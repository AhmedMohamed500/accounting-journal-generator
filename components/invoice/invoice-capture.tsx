"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, Building2, CheckCircle2, FileCheck2, FileScan, Landmark, PackageCheck, Plus, ReceiptText, RefreshCw, Save, Trash2, TriangleAlert, Workflow } from "lucide-react";
import { extractTextFromInvoice } from "@/lib/invoice/extract";
import { parseInvoiceText } from "@/lib/invoice/parser";
import { roundCurrency } from "@/lib/accounting/calculations";
import { generateJournalEntry } from "@/rules";
import { saveEntry } from "@/lib/storage/accounting";
import { loadBusinessDocuments, saveBusinessDocuments } from "@/lib/storage/business-documents";
import { loadOpenItems, loadParties, saveOpenItems, saveParties } from "@/lib/storage/parties";
import type { BusinessDocument, BusinessDocumentLine, ExtractedInvoice, ExtractedInvoiceLine, GeneratedJournalEntry, Locale, Party } from "@/types";
import { JournalResult } from "@/components/journal/result";

const emptyLine = (index = 1): ExtractedInvoiceLine => ({ id: `line-${Date.now()}-${index}`, description: "", quantity: 1, unitPrice: 0, discount: 0, vatRate: 14, net: 0, vat: 0, total: 0 });
const empty: ExtractedInvoice = { supplier: "", invoiceNumber: "", taxNumber: "", date: "", dueDate: "", currency: "EGP", lines: [], subtotal: 0, discount: 0, withholdingTax: 0, withholdingRate: 0, net: 0, vatRate: 0, vat: 0, total: 0, confidence: 0, rawText: "", warnings: [] };

function calculateLine(line: ExtractedInvoiceLine): ExtractedInvoiceLine {
  const net = roundCurrency(Math.max(0, line.quantity * line.unitPrice - line.discount));
  const vat = roundCurrency(net * line.vatRate / 100);
  return { ...line, net, vat, total: roundCurrency(net + vat) };
}

function totals(lines: ExtractedInvoiceLine[]) {
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const discount = roundCurrency(lines.reduce((sum, line) => sum + line.discount, 0));
  const net = roundCurrency(lines.reduce((sum, line) => sum + line.net, 0));
  const vat = roundCurrency(lines.reduce((sum, line) => sum + line.vat, 0));
  return { subtotal, discount, net, vat, total: roundCurrency(net + vat) };
}

export function InvoiceCapture({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [data, setData] = useState(empty), [progress, setProgress] = useState(0), [status, setStatus] = useState(""), [entry, setEntry] = useState<GeneratedJournalEntry>();
  const [sourceFile, setSourceFile] = useState<File>();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "cheque" | "credit">("credit");
  const [purchaseAccountCode, setPurchaseAccountCode] = useState("1200"), [posted, setPosted] = useState(false);

  const scan = async (file?: File, forceOcr = false) => {
    if (!file) return;
    try {
      setSourceFile(file);
      setPosted(false); setEntry(undefined); setStatus(ar ? "جارٍ قراءة صفحات الفاتورة وتجميع السطور…" : "Reading pages and rebuilding invoice rows…"); setProgress(0);
      const text = await extractTextFromInvoice(file, setProgress, { forceOcr });
      const parsed = parseInvoiceText(text);
      if (!parsed.lines.length && parsed.net > 0) parsed.lines = [{ ...emptyLine(), description: ar ? "بند الفاتورة — راجع الوصف" : "Invoice item — review description", quantity: 1, unitPrice: parsed.net, vatRate: parsed.vatRate, net: parsed.net, vat: parsed.vat, total: parsed.total }];
      if (parsed.warnings.includes("possibly-not-invoice")) parsed.lines = [];
      setData(parsed);
      setStatus(parsed.warnings.includes("possibly-not-invoice") ? (ar ? "المستند لا يبدو كفاتورة واضحة. لم يتم الترحيل؛ راجع النوع والبيانات أولًا." : "This may not be an invoice. Review before posting.") : (ar ? "تمت القراءة. راجع رأس الفاتورة والبنود والمجاميع قبل الترحيل." : "Invoice read. Review header, lines, and totals before posting."));
    } catch (error) { setStatus(`${ar ? "تعذرت القراءة" : "Extraction failed"}: ${error instanceof Error ? error.message : "Unknown error"}`); }
  };

  const setField = <K extends keyof ExtractedInvoice>(key: K, value: ExtractedInvoice[K]) => setData((current) => ({ ...current, [key]: value }));
  const updateLine = (id: string, key: keyof ExtractedInvoiceLine, value: string) => {
    const nextLines = data.lines.map((line) => line.id === id ? calculateLine({ ...line, [key]: key === "description" ? value : Number(value) || 0 }) : line);
    setData((current) => { const calculated=totals(nextLines);return ({ ...current, lines: nextLines, ...calculated, total:roundCurrency(calculated.total-current.withholdingTax), vatRate: nextLines.length ? roundCurrency(nextLines.reduce((sum, line) => sum + line.vatRate, 0) / nextLines.length) : current.vatRate }); });
  };
  const addLine = () => setData((current) => ({ ...current, lines: [...current.lines, emptyLine(current.lines.length + 1)] }));
  const removeLine = (id: string) => { const lines = data.lines.filter((line) => line.id !== id); setData((current) => {const calculated=totals(lines);return({ ...current, lines, ...calculated,total:roundCurrency(calculated.total-current.withholdingTax) });}); };
  const mismatch = data.total > 0 && Math.abs(data.total - (data.net + data.vat - data.withholdingTax)) > .02;
  const unverifiedDocument = data.warnings.includes("possibly-not-invoice") && (data.confidence < 50 || data.total <= 0);
  const missingRequired = unverifiedDocument || !data.supplier.trim() || !data.date || data.net <= 0 || data.total <= 0;

  const transactionType = purchaseAccountCode === "1330" ? "fixed-asset-purchase" : paymentMethod === "credit" ? "credit-purchase" : "cash-purchase";
  const createEntry = () => generateJournalEntry({ type: transactionType, amount: data.net, date: data.date || undefined, currency: data.currency, paymentMethod, paymentAccountCode: paymentMethod === "cash" ? "1100" : paymentMethod === "credit" ? undefined : "1110", purchaseAccountCode, vatEnabled: data.vat > 0 || data.vatRate > 0, vatRate: data.vatRate || undefined, vatIncluded: false, withholdingEnabled:data.withholdingTax>0,withholdingRate:data.withholdingRate||(data.net?roundCurrency(data.withholdingTax/data.net*100):0), supplier: data.supplier, notes: `${ar ? "فاتورة" : "Invoice"} ${data.invoiceNumber || "—"} — ${data.supplier}` });

  const suggest = () => {
    if (missingRequired) { setStatus(ar ? "أكمل المورد والتاريخ والصافي والإجمالي أولًا." : "Complete supplier, date, net, and total first."); return; }
    if (mismatch) { setStatus(ar ? "الصافي + الضريبة - الاستقطاع لا يساوي الإجمالي؛ صحح المجاميع قبل إنشاء القيد." : "Net plus VAT less withholding does not equal total."); return; }
    try { const generated = createEntry(); setEntry({ ...generated, workflowStatus: "draft" }); setPosted(false); setStatus(ar ? "تم تكوين القيد وشرح أثره. راجعه ثم اضغط ترحيل الدورة كاملة." : "Entry created with impact. Review then post the full cycle."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Generation failed"); }
  };

  const ensureSupplier = (): Party => {
    const parties = loadParties(), normalized = data.supplier.trim().toLowerCase();
    const existing = parties.find((party) => party.type === "supplier" && ((data.taxNumber && party.taxNumber === data.taxNumber) || party.nameAr.toLowerCase() === normalized || party.nameEn.toLowerCase() === normalized));
    if (existing) return existing;
    const supplier: Party = { id: crypto.randomUUID(), type: "supplier", code: `SUP-${String(parties.filter((party) => party.type === "supplier").length + 1).padStart(4, "0")}`, nameAr: data.supplier, nameEn: data.supplier, taxNumber: data.taxNumber || undefined, creditDays: 30, accountCode: "2100", active: true, createdAt: new Date().toISOString() };
    saveParties([supplier, ...parties]); return supplier;
  };

  const postFullCycle = () => {
    if (missingRequired || mismatch) { setStatus(ar ? "راجع الحقول والمجاميع قبل الترحيل." : "Review required fields and totals before posting."); return; }
    const documents = loadBusinessDocuments();
    if (data.invoiceNumber && documents.some((document) => document.type === "purchase-invoice" && (document.reference === data.invoiceNumber || document.number === data.invoiceNumber))) { setStatus(ar ? "الفاتورة دي مسجلة قبل كده؛ تم إيقاف التكرار." : "This invoice is already posted; duplicate blocked."); return; }
    try {
      const generated = entry || createEntry(), postedEntry = saveEntry({ ...generated, workflowStatus: "posted" });
      const supplier = ensureSupplier();
      const documentLines: BusinessDocumentLine[] = (data.lines.length ? data.lines : [{ ...emptyLine(), description: ar ? "إجمالي الفاتورة" : "Invoice total", unitPrice: data.net, net: data.net, vat: data.vat, total: data.total, vatRate: data.vatRate }]).map((line) => ({ id: line.id, description: line.description || (ar ? "بند فاتورة" : "Invoice item"), quantity: line.quantity, unitPrice: line.unitPrice, discount: line.discount, vatRate: line.vatRate, accountCode: purchaseAccountCode, net: line.net, vat: line.vat, total: line.total }));
      const document: BusinessDocument = { id: crypto.randomUUID(), number: data.invoiceNumber || `PI-${Date.now().toString().slice(-6)}`, type: "purchase-invoice", status: "posted", date: data.date, dueDate: data.dueDate || undefined, partyId: supplier.id, currency: data.currency, lines: documentLines, subtotal: data.subtotal || data.net + data.discount, discountTotal: data.discount, netTotal: data.net, vatTotal: data.vat,withholdingTax:data.withholdingTax||undefined,withholdingRate:data.withholdingRate||undefined, grandTotal: data.total, reference: data.invoiceNumber || undefined, notes: ar ? "مقروءة ومُرحّلة من مركز قراءة الفواتير" : "Captured and posted from invoice capture", linkedEntryId: postedEntry.id, createdAt: new Date().toISOString() };
      saveBusinessDocuments([document, ...documents]);
      if (paymentMethod === "credit") {
        const due = data.dueDate || (() => { const value = new Date(`${data.date}T00:00:00`); value.setDate(value.getDate() + supplier.creditDays); return value.toISOString().slice(0, 10); })();
        saveOpenItems([{ id: crypto.randomUUID(), partyId: supplier.id, kind: "payable", invoiceNumber: document.number, invoiceDate: data.date, dueDate: due, currency: data.currency, amount: data.total, paid: 0, status: "open", linkedEntryId: postedEntry.id, createdAt: new Date().toISOString() }, ...loadOpenItems()]);
      }
      setEntry(postedEntry); setPosted(true); setStatus(ar ? "تم ترحيل الفاتورة بنجاح وربطها بالمورد والقيد والأستاذ والتقارير." : "Invoice posted and linked to supplier, entry, ledger, and reports.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Posting failed"); }
  };

  const warningLabels: Record<string, string> = { supplier: "اسم المورد", "invoice-number": "رقم الفاتورة", date: "التاريخ", total: "الإجمالي", "line-items": "بنود الفاتورة", "totals-do-not-match": "تطابق المجاميع", "possibly-not-invoice": "نوع المستند" };
  const accountOptions = [{ code: "1200", ar: "مخزون", en: "Inventory" }, { code: "5120", ar: "أدوات مكتبية ومطبوعات", en: "Office supplies" }, { code: "5130", ar: "صيانة وإصلاح", en: "Maintenance" }, { code: "5100", ar: "إيجار", en: "Rent" }, { code: "5110", ar: "كهرباء ومرافق", en: "Utilities" }, { code: "5500", ar: "أتعاب مهنية", en: "Professional fees" }, { code: "1330", ar: "أجهزة ومعدات — أصل ثابت", en: "Equipment — fixed asset" }];

  return <div className="grid gap-6">
    <section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2"><FileScan size={22}/>{ar ? "رفع وقراءة الفاتورة بالتفصيل" : "Detailed invoice capture"}</h2><p className="muted">{ar ? "يدعم PDF والصور، ويحافظ على سطور البنود بدل دمج النص كله." : "Reads PDFs and images while preserving line items."}</p></div><span className="badge">{ar ? "تتم القراءة محليًا" : "Local processing"}</span></div><input type="file" accept="application/pdf,image/*" onChange={(event) => scan(event.target.files?.[0])}/>{status && <p className={data.warnings.includes("possibly-not-invoice") ? "warning error" : "warning"}>{status}</p>}{progress > 0 && progress < 100 && <div className="h-2.5 overflow-hidden rounded-full bg-daftar-line"><div className="h-full rounded-full bg-daftar-primary" style={{ width: `${progress}%` }}/></div>}</section>

    {sourceFile && (data.warnings.includes("possibly-not-invoice") || data.confidence < 67 || data.warnings.length >= 3) && <section className="card border-amber-300 bg-amber-50 dark:bg-amber-950/20"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{ar ? "بعض بيانات الفاتورة تحتاج قراءة أدق" : "Some invoice fields need a more accurate scan"}</b><p className="muted mt-1">{ar ? "لن يخمّن النظام أرقامًا غير مؤكدة. اضغط إعادة القراءة لتشغيل OCR العربي والإنجليزي على كل صفحة، ثم راجع النتائج قبل الترحيل." : "The system will not guess uncertain values. Run OCR on every page, then review before posting."}</p></div><button className="btn" type="button" onClick={() => scan(sourceFile, true)}><RefreshCw size={17}/>{ar ? "إعادة القراءة الدقيقة OCR" : "Re-read with OCR"}</button></div></section>}

    {data.rawText && <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric title={ar ? "ثقة الاستخراج" : "Confidence"} value={`${data.confidence}%`}/><Metric title={ar ? "الصافي" : "Net"} value={data.net.toLocaleString()}/><Metric title={ar ? "الضريبة" : "VAT"} value={data.vat.toLocaleString()}/><Metric title={ar ? "الإجمالي" : "Total"} value={data.total.toLocaleString()}/></section>
      <section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2>{ar ? "1 — رأس الفاتورة" : "1 — Invoice header"}</h2><p className="muted">{ar ? "البيانات اللي تحدد المورد والفترة والاستحقاق." : "Supplier, period, and due information."}</p></div><span className="warning">{ar ? `يحتاج مراجعة: ${data.warnings.map((item) => warningLabels[item] || item).join("، ") || "لا شيء"}` : `${data.warnings.length} fields need review`}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label>{ar ? "المورد" : "Supplier"}<input value={data.supplier} onChange={(event) => setField("supplier", event.target.value)}/></label><label>{ar ? "رقم الفاتورة" : "Invoice number"}<input value={data.invoiceNumber} onChange={(event) => setField("invoiceNumber", event.target.value)}/></label><label>{ar ? "الرقم الضريبي" : "Tax number"}<input value={data.taxNumber} onChange={(event) => setField("taxNumber", event.target.value)}/></label><label>{ar ? "تاريخ الفاتورة" : "Invoice date"}<input type="date" value={data.date} onChange={(event) => setField("date", event.target.value)}/></label><label>{ar ? "تاريخ الاستحقاق" : "Due date"}<input type="date" value={data.dueDate} onChange={(event) => setField("dueDate", event.target.value)}/></label><label>{ar ? "العملة" : "Currency"}<select value={data.currency} onChange={(event) => setField("currency", event.target.value)}>{["EGP", "USD", "EUR", "SAR", "AED"].map((currency) => <option key={currency}>{currency}</option>)}</select></label></div></section>

      <section className="card"><div className="flex items-start justify-between gap-4"><div><h2>{ar ? "2 — بنود الفاتورة" : "2 — Invoice lines"}</h2><p className="muted">{ar ? "الوصف والكمية والسعر والخصم والضريبة لكل بند." : "Description, quantity, price, discount, and VAT per line."}</p></div><button className="btn" onClick={addLine}><Plus size={17}/>{ar ? "إضافة بند" : "Add line"}</button></div><div className="table-wrap"><table className="min-w-[1050px]"><thead><tr><th>{ar ? "البيان" : "Description"}</th><th>{ar ? "الكمية" : "Qty"}</th><th>{ar ? "سعر الوحدة" : "Unit price"}</th><th>{ar ? "الخصم" : "Discount"}</th><th>{ar ? "الضريبة %" : "VAT %"}</th><th>{ar ? "الصافي" : "Net"}</th><th>{ar ? "الضريبة" : "VAT"}</th><th>{ar ? "الإجمالي" : "Total"}</th><th/></tr></thead><tbody>{data.lines.map((line) => <tr key={line.id}><td><input value={line.description} onChange={(event) => updateLine(line.id, "description", event.target.value)}/></td>{(["quantity", "unitPrice", "discount", "vatRate"] as const).map((key) => <td key={key}><input type="number" min="0" value={line[key] || ""} onChange={(event) => updateLine(line.id, key, event.target.value)}/></td>)}<td>{line.net.toLocaleString()}</td><td>{line.vat.toLocaleString()}</td><td><b>{line.total.toLocaleString()}</b></td><td><button className="btn icon-btn" aria-label={ar ? "حذف البند" : "Delete line"} onClick={() => removeLine(line.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>{!data.lines.length && <div className="warning">{ar ? "لم يتم اكتشاف بنود. أضف البنود يدويًا أو راجع جودة الصورة." : "No lines detected. Add them manually."}</div>}</section>

      <section className="card"><h2>{ar ? "3 — المجاميع المستخرجة" : "3 — Extracted totals"}</h2>{mismatch && <p className="warning error"><TriangleAlert size={17}/>{ar ? "الصافي + الضريبة - الاستقطاع الضريبي لا يساوي الإجمالي. الترحيل متوقف حتى التصحيح." : "Net plus VAT less withholding does not equal total. Posting is blocked."}</p>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><NumberField label={ar ? "قبل الخصم" : "Subtotal"} value={data.subtotal} onChange={(value) => setField("subtotal", value)}/><NumberField label={ar ? "الخصم التجاري" : "Commercial discount"} value={data.discount} onChange={(value) => setField("discount", value)}/><NumberField label={ar ? "الصافي الخاضع للضريبة" : "Taxable net"} value={data.net} onChange={(value) => setField("net", value)}/><NumberField label={ar ? "قيمة الضريبة المضافة" : "VAT amount"} value={data.vat} onChange={(value) => setField("vat", value)}/><NumberField label={ar ? "الخصم تحت حساب الضريبة" : "Withholding tax"} value={data.withholdingTax} onChange={(value) => setData((current)=>({...current,withholdingTax:value,withholdingRate:current.net?roundCurrency(value/current.net*100):0}))}/><NumberField label={ar ? "صافي المستحق" : "Amount due"} value={data.total} onChange={(value) => setField("total", value)}/></div>{data.withholdingTax>0&&<p className="warning mt-4">{ar?`استقطاع ضريبي ${data.withholdingTax.toLocaleString()} (${data.withholdingRate.toLocaleString()}%) سيُرحّل دائنًا إلى حساب 2202، ويُخصم من رصيد المورد.`:`Withholding ${data.withholdingTax.toLocaleString()} (${data.withholdingRate.toLocaleString()}%) will credit account 2202 and reduce the supplier balance.`}</p>}</section>

      <section className="card"><h2>{ar ? "4 — مكان الترحيل وطريقة السداد" : "4 — Posting destination and settlement"}</h2><div className="grid gap-4 md:grid-cols-2"><label>{ar ? "الحساب الذي استلم القيمة" : "Purchase / expense account"}<select value={purchaseAccountCode} onChange={(event) => setPurchaseAccountCode(event.target.value)}>{accountOptions.map((account) => <option value={account.code} key={account.code}>{account.code} — {ar ? account.ar : account.en}</option>)}</select></label><label>{ar ? "طريقة السداد" : "Payment method"}<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}><option value="credit">{ar ? "آجل — على المورد" : "Credit — supplier payable"}</option><option value="cash">{ar ? "نقدًا — من الصندوق" : "Cash — cash on hand"}</option><option value="bank">{ar ? "تحويل — من البنك" : "Bank transfer"}</option><option value="cheque">{ar ? "شيك — من البنك" : "Cheque — bank"}</option></select></label></div><div className="mt-5 flex flex-wrap gap-3"><button className="btn" disabled={missingRequired || mismatch} onClick={suggest}><ReceiptText size={18}/>{ar ? "تكوين القيد وشرح تأثيره" : "Build entry and explain impact"}</button><button className="btn btn-primary" disabled={missingRequired || mismatch} onClick={postFullCycle}><Workflow size={18}/>{ar ? "ترحيل الفاتورة في الدورة كاملة" : "Post invoice through full cycle"}</button></div></section>

      <details className="card"><summary>{ar ? "عرض النص الخام المستخرج للتدقيق" : "View raw extracted text"}</summary><pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-daftar-bg p-4 text-xs leading-6">{data.rawText}</pre></details>
    </>}

    {entry && <><JournalResult entry={entry} locale={locale}/>{!posted && <button className="btn btn-primary no-print" onClick={postFullCycle}><Save size={17}/>{ar ? "اعتماد وترحيل الدورة كاملة" : "Approve and post full cycle"}</button>}</>}
    {posted && <CycleResult locale={locale} paymentMethod={paymentMethod} purchaseAccountCode={purchaseAccountCode} entry={entry!}/>} 
  </div>;
}

function Metric({ title, value }: { title: string; value: string }) { return <div className="card"><span className="muted">{title}</span><div className="impact mt-2">{value}</div></div>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label>{label}<input type="number" min="0" step="0.01" value={value || ""} onChange={(event) => onChange(Number(event.target.value) || 0)}/></label>; }

function CycleResult({ locale, paymentMethod, purchaseAccountCode, entry }: { locale: Locale; paymentMethod: string; purchaseAccountCode: string; entry: GeneratedJournalEntry }) {
  const ar = locale === "ar", cashText = paymentMethod === "credit" ? (ar ? "لم تخرج نقدية الآن؛ زاد رصيد الموردين." : "No cash paid now; payables increased.") : paymentMethod === "cash" ? (ar ? "انخفض حساب الصندوق بقيمة الفاتورة." : "Cash on hand decreased.") : (ar ? "انخفض حساب البنك بقيمة الفاتورة." : "Bank decreased.");
  const stages = [
    { icon: FileCheck2, title: ar ? "فاتورة مشتريات" : "Purchase invoice", text: ar ? "حُفظ رأس الفاتورة والبنود والضريبة والمورد كمستند مرحّل." : "Header, lines, VAT, and supplier saved." },
    { icon: Building2, title: ar ? "المورد والاستحقاق" : "Supplier and due item", text: paymentMethod === "credit" ? (ar ? "أُنشئ أو رُبط المورد وفاتورة مستحقة ضمن أعمار الدائنين." : "Supplier and payable due item created.") : (ar ? "تم ربط المورد مع اعتبار الفاتورة مسددة فورًا." : "Supplier linked and invoice treated as paid.") },
    { icon: paymentMethod === "cash" ? Banknote : Landmark, title: ar ? "الصندوق أو البنك" : "Cash or bank", text: cashText },
    { icon: ReceiptText, title: ar ? "قيد اليومية" : "Journal entry", text: ar ? `${entry.entryNumber} متوازن ومرحّل: ${entry.totalDebit.toLocaleString()} ${entry.currency}.` : `${entry.entryNumber} posted and balanced.` },
    { icon: PackageCheck, title: ar ? "الأستاذ وميزان المراجعة" : "Ledger and trial balance", text: ar ? `تحرك الحساب ${purchaseAccountCode} والطرف المقابل، وتحدثت أرصدتهما.` : `Account ${purchaseAccountCode} and its counter-account updated.` },
    { icon: Workflow, title: ar ? "القوائم والميزانية" : "Statements", text: ar ? `الأصول ${signed(entry.financialStatementImpact.assets)}، الالتزامات ${signed(entry.financialStatementImpact.liabilities)}، الربح ${signed(entry.financialStatementImpact.profit)}.` : "Statement impacts are now included in reports." },
  ];
  return <section className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"><div className="flex items-start gap-3"><CheckCircle2 className="shrink-0 text-emerald-600"/><div><h2 className="m-0">{ar ? "تمت الدورة المحاسبية للفاتورة" : "Invoice accounting cycle completed"}</h2><p className="mt-2 opacity-75">{ar ? "كل مرحلة مرتبطة بنفس المستند والقيد ويمكن تتبعها من بطاقة العملية." : "Every stage is linked to the same document and entry."}</p></div></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{stages.map(({icon:Icon,title,text})=><article className="rounded-2xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900 dark:bg-black/10" key={title}><Icon/><b className="mt-3 block">{title}</b><p className="mt-2 text-sm leading-6 opacity-75">{text}</p></article>)}</div><div className="actions mt-6"><Link className="btn bg-white text-emerald-900" href={`/${locale}/operations/${entry.id}`}>{ar ? "فتح بطاقة العملية" : "Open operation dossier"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link><Link className="btn bg-white text-emerald-900" href={`/${locale}/journal`}>{ar ? "عرض اليومية" : "Open journal"}</Link><Link className="btn bg-white text-emerald-900" href={`/${locale}/trial-balance`}>{ar ? "ميزان المراجعة" : "Trial balance"}</Link><Link className="btn bg-white text-emerald-900" href={`/${locale}/reports`}>{ar ? "القوائم المالية" : "Statements"}</Link></div></section>;
}
function signed(value: number) { return value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString(); }
