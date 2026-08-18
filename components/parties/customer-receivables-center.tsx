"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BanknoteArrowDown, BookOpenCheck, Building2, CalendarClock, CircleAlert, Eye, FilePlus2, Plus, Search, UsersRound } from "lucide-react";
import { getPostingAccounts } from "@/lib/accounting/accounts";
import { agingForItems, itemOutstanding } from "@/lib/parties/aging";
import { createCustomerCollection, createCustomerInvoice } from "@/lib/parties/receivables";
import { loadAccounts, saveEntry } from "@/lib/storage/accounting";
import { loadOpenItems, loadParties, saveOpenItems, saveParties } from "@/lib/storage/parties";
import { loadWorkspace } from "@/lib/storage/workspace";
import type { ChartAccount, Locale, OpenItem, Party } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => { const value = new Date(date); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };
const money = (value: number, locale: Locale) => value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });

export function CustomerReceivablesCenter({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [customers, setCustomers] = useState<Party[]>([]), [items, setItems] = useState<OpenItem[]>([]), [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [companyName, setCompanyName] = useState(""), [query, setQuery] = useState(""), [notice, setNotice] = useState(""), [error, setError] = useState("");
  const [customerDraft, setCustomerDraft] = useState({ nameAr: "", nameEn: "", taxNumber: "", commercialRegistration: "", contactPerson: "", phone: "", email: "", address: "", creditDays: 30, creditLimit: 0 });
  const [invoice, setInvoice] = useState({ partyId: "", invoiceNumber: "", invoiceDate: today(), dueDate: addDays(today(), 30), description: "", netAmount: 0, vatRate: 14, currency: "EGP", revenueAccountCode: "4100" });
  const [collection, setCollection] = useState({ partyId: "", itemId: "", date: today(), amount: 0, paymentAccountCode: "1110", reference: "" });

  useEffect(() => {
    const workspace = loadWorkspace(), company = workspace.companies.find((item) => item.id === workspace.activeCompanyId);
    setCompanyName(company ? (ar ? company.nameAr : company.nameEn) : (ar ? "الشركة الحالية" : "Current company"));
    setCustomers(loadParties().filter((party) => party.type === "customer"));
    setItems(loadOpenItems().filter((item) => item.kind === "receivable"));
    setAccounts(loadAccounts());
  }, [ar]);

  const commitCustomers = (nextCustomers: Party[]) => {
    const suppliers = loadParties().filter((party) => party.type === "supplier");
    setCustomers(nextCustomers); saveParties([...suppliers, ...nextCustomers]);
  };
  const commitItems = (nextReceivables: OpenItem[]) => {
    const payables = loadOpenItems().filter((item) => item.kind === "payable");
    setItems(nextReceivables); saveOpenItems([...payables, ...nextReceivables]);
  };
  const clearMessages = () => { setNotice(""); setError(""); };

  const postingAccounts = useMemo(() => getPostingAccounts(accounts), [accounts]);
  const revenueAccounts = postingAccounts.filter((account) => account.type === "revenue");
  const paymentAccounts = postingAccounts.filter((account) => account.type === "asset" && (account.code === "1100" || account.code.startsWith("111")));
  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const balances = useMemo(() => customers.map((customer) => {
    const own = items.filter((item) => item.partyId === customer.id), aging = agingForItems(own, today());
    return { customer, aging, openCount: own.filter((item) => itemOutstanding(item) > 0).length };
  }), [customers, items]);
  const filteredBalances = balances.filter(({ customer }) => `${customer.code} ${customer.accountCode} ${customer.nameAr} ${customer.nameEn} ${customer.taxNumber || ""}`.toLowerCase().includes(query.toLowerCase()));
  const totalOutstanding = balances.reduce((sum, row) => sum + row.aging.total, 0), totalOverdue = balances.reduce((sum, row) => sum + row.aging.days30 + row.aging.days60 + row.aging.days90 + row.aging.over90, 0);
  const openInvoices = items.filter((item) => itemOutstanding(item) > 0), creditLimit = customers.reduce((sum, customer) => sum + (customer.creditLimit || 0), 0);

  const addCustomer = () => {
    clearMessages();
    if (!customerDraft.nameAr.trim() || !customerDraft.nameEn.trim()) return setError(ar ? "اكتب اسم العميل بالعربية والإنجليزية." : "Enter the customer name in Arabic and English.");
    const number = customers.length ? Math.max(...customers.map((customer) => Number(customer.code.match(/\d+/)?.[0] || 0))) + 1 : 1;
    const customer: Party = {
      id: crypto.randomUUID(), type: "customer", code: `C-${String(number).padStart(4, "0")}`,
      nameAr: customerDraft.nameAr.trim(), nameEn: customerDraft.nameEn.trim(), taxNumber: customerDraft.taxNumber.trim() || undefined,
      commercialRegistration: customerDraft.commercialRegistration.trim() || undefined, contactPerson: customerDraft.contactPerson.trim() || undefined,
      phone: customerDraft.phone.trim() || undefined, email: customerDraft.email.trim() || undefined, address: customerDraft.address.trim() || undefined,
      creditDays: Math.max(0, customerDraft.creditDays), creditLimit: customerDraft.creditLimit > 0 ? customerDraft.creditLimit : undefined,
      accountCode: `112${String(number).padStart(3, "0")}`, active: true, createdAt: new Date().toISOString(),
    };
    commitCustomers([...customers, customer]);
    setCustomerDraft({ nameAr: "", nameEn: "", taxNumber: "", commercialRegistration: "", contactPerson: "", phone: "", email: "", address: "", creditDays: 30, creditLimit: 0 });
    setInvoice({ ...invoice, partyId: customer.id, dueDate: addDays(invoice.invoiceDate, customer.creditDays) });
    setNotice(ar ? `تم إنشاء العميل ${customer.nameAr} بحساب فرعي ${customer.accountCode}.` : `${customer.nameEn} was created with subledger ${customer.accountCode}.`);
  };

  const selectInvoiceCustomer = (partyId: string) => {
    const customer = customers.find((item) => item.id === partyId);
    setInvoice({ ...invoice, partyId, dueDate: addDays(invoice.invoiceDate, customer?.creditDays || 0) });
  };
  const addInvoice = () => {
    clearMessages();
    const customer = customers.find((item) => item.id === invoice.partyId);
    if (!customer) return setError(ar ? "اختر العميل أولًا." : "Select a customer first.");
    try {
      const result = createCustomerInvoice(customer, invoice, items, accounts), saved = saveEntry(result.entry);
      const openItem = { ...result.item, linkedEntryId: saved.id, invoiceEntryId: saved.id };
      commitItems([openItem, ...items]);
      setInvoice({ ...invoice, invoiceNumber: "", description: "", netAmount: 0 });
      setNotice(`${ar ? "تم إنشاء الفاتورة ومسودة القيد" : "Invoice and draft entry created"} ${saved.entryNumber}.${result.warning ? ` ${result.warning}` : ""}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  };

  const selectedCustomerItems = openInvoices.filter((item) => item.partyId === collection.partyId);
  const recordCollection = () => {
    clearMessages();
    const customer = customers.find((item) => item.id === collection.partyId), item = items.find((current) => current.id === collection.itemId);
    if (!customer || !item) return setError(ar ? "اختر العميل والفاتورة المراد تحصيلها." : "Select the customer and invoice.");
    try {
      const result = createCustomerCollection(customer, item, collection, accounts), saved = saveEntry(result.entry);
      const updated = { ...result.item, collectionEntryIds: [...(item.collectionEntryIds || []), saved.id], allocations: [...(item.allocations || []), { ...result.allocation, linkedEntryId: saved.id }] };
      commitItems(items.map((current) => current.id === item.id ? updated : current));
      setCollection({ ...collection, itemId: "", amount: 0, reference: "" });
      setNotice(ar ? `تم تسجيل التحصيل وإنشاء مسودة القيد ${saved.entryNumber}.` : `Collection recorded and draft ${saved.entryNumber} created.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  };

  return <div className="grid gap-6">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-[#0b315f] to-[#195998] p-7 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"><Building2 size={15}/>{companyName}</span><h1 className="mt-4 text-3xl font-black">{ar ? "مركز حسابات العملاء الآجلين" : "Customer Receivables Center"}</h1><p className="mt-2 max-w-3xl text-white/75">{ar ? "من تعريف العميل وفاتورة البيع الآجل إلى التحصيل وأعمار الديون والقيد والأستاذ — داخل حساب الشركة الحالية فقط." : "Customer master, credit invoices, collections, aging, journal entries, and ledger in one company-scoped flow."}</p></div><Link className="btn border-white/20 bg-white text-[#0b315f]" href={`/${locale}/journal`}><BookOpenCheck size={17}/>{ar ? "فتح مركز القيود" : "Open Journal Center"}</Link></div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Metric icon={UsersRound} title={ar ? "العملاء النشطون" : "Active customers"} value={customers.filter((item) => item.active).length}/>
      <Metric icon={FilePlus2} title={ar ? "إجمالي المستحق" : "Outstanding"} value={money(totalOutstanding, locale)}/>
      <Metric icon={CircleAlert} title={ar ? "المتأخر" : "Overdue"} value={money(totalOverdue, locale)} danger={totalOverdue > 0}/>
      <Metric icon={CalendarClock} title={ar ? "فواتير مفتوحة" : "Open invoices"} value={openInvoices.length}/>
      <Metric icon={BanknoteArrowDown} title={ar ? "المتاح من الائتمان" : "Available credit"} value={creditLimit ? money(Math.max(0, creditLimit - totalOutstanding), locale) : "—"}/>
    </section>

    <section className="card"><SectionTitle icon={Plus} ar="إضافة عميل للشركة" en="Add company customer"/><p className="muted">{ar ? "ينشأ للعميل ملف وحساب فرعي داخل أستاذ العملاء، بينما يظل حساب المراقبة 1120 هو المستخدم في القيد العام." : "Creates a customer subledger while control account 1120 remains in the general journal."}</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Field label={ar ? "اسم العميل بالعربية" : "Arabic name"}><input value={customerDraft.nameAr} onChange={(event) => setCustomerDraft({ ...customerDraft, nameAr: event.target.value })}/></Field>
      <Field label={ar ? "اسم العميل بالإنجليزية" : "English name"}><input dir="ltr" value={customerDraft.nameEn} onChange={(event) => setCustomerDraft({ ...customerDraft, nameEn: event.target.value })}/></Field>
      <Field label={ar ? "الرقم الضريبي" : "Tax number"}><input dir="ltr" value={customerDraft.taxNumber} onChange={(event) => setCustomerDraft({ ...customerDraft, taxNumber: event.target.value })}/></Field>
      <Field label={ar ? "السجل التجاري" : "Commercial registration"}><input dir="ltr" value={customerDraft.commercialRegistration} onChange={(event) => setCustomerDraft({ ...customerDraft, commercialRegistration: event.target.value })}/></Field>
      <Field label={ar ? "مسؤول التواصل" : "Contact person"}><input value={customerDraft.contactPerson} onChange={(event) => setCustomerDraft({ ...customerDraft, contactPerson: event.target.value })}/></Field>
      <Field label={ar ? "الهاتف / واتساب" : "Phone / WhatsApp"}><input dir="ltr" value={customerDraft.phone} onChange={(event) => setCustomerDraft({ ...customerDraft, phone: event.target.value })}/></Field>
      <Field label={ar ? "أيام الائتمان" : "Credit days"}><input type="number" min="0" value={customerDraft.creditDays} onChange={(event) => setCustomerDraft({ ...customerDraft, creditDays: Number(event.target.value) })}/></Field>
      <Field label={ar ? "حد الائتمان" : "Credit limit"}><input type="number" min="0" value={customerDraft.creditLimit || ""} onChange={(event) => setCustomerDraft({ ...customerDraft, creditLimit: Number(event.target.value) })}/></Field>
      <Field label={ar ? "البريد الإلكتروني" : "Email"}><input dir="ltr" type="email" value={customerDraft.email} onChange={(event) => setCustomerDraft({ ...customerDraft, email: event.target.value })}/></Field>
      <Field label={ar ? "العنوان" : "Address"}><input value={customerDraft.address} onChange={(event) => setCustomerDraft({ ...customerDraft, address: event.target.value })}/></Field>
    </div><button className="btn btn-primary mt-5" onClick={addCustomer}><Plus size={17}/>{ar ? "حفظ العميل وفتح حسابه" : "Save customer account"}</button></section>

    <section className="grid gap-6 xl:grid-cols-2">
      <article className="card"><SectionTitle icon={FilePlus2} ar="تسجيل فاتورة بيع آجل" en="Record credit invoice"/><div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label={ar ? "العميل" : "Customer"}><select value={invoice.partyId} onChange={(event) => selectInvoiceCustomer(event.target.value)}><option value="">—</option>{customers.filter((item) => item.active).map((customer) => <option key={customer.id} value={customer.id}>{customer.code} — {ar ? customer.nameAr : customer.nameEn}</option>)}</select></Field>
        <Field label={ar ? "رقم الفاتورة" : "Invoice number"}><input dir="ltr" value={invoice.invoiceNumber} onChange={(event) => setInvoice({ ...invoice, invoiceNumber: event.target.value })}/></Field>
        <Field label={ar ? "تاريخ الفاتورة" : "Invoice date"}><input type="date" value={invoice.invoiceDate} onChange={(event) => { const customer = customerMap.get(invoice.partyId); setInvoice({ ...invoice, invoiceDate: event.target.value, dueDate: addDays(event.target.value, customer?.creditDays || 0) }); }}/></Field>
        <Field label={ar ? "تاريخ الاستحقاق" : "Due date"}><input type="date" value={invoice.dueDate} onChange={(event) => setInvoice({ ...invoice, dueDate: event.target.value })}/></Field>
        <Field label={ar ? "بيان الشغل أو التوريد" : "Work / supply description"}><input value={invoice.description} onChange={(event) => setInvoice({ ...invoice, description: event.target.value })}/></Field>
        <Field label={ar ? "صافي قبل الضريبة" : "Net before VAT"}><input type="number" min="0" value={invoice.netAmount || ""} onChange={(event) => setInvoice({ ...invoice, netAmount: Number(event.target.value) })}/></Field>
        <Field label={ar ? "ضريبة %" : "VAT %"}><input type="number" min="0" max="100" value={invoice.vatRate} onChange={(event) => setInvoice({ ...invoice, vatRate: Number(event.target.value) })}/></Field>
        <Field label={ar ? "حساب الإيراد" : "Revenue account"}><select value={invoice.revenueAccountCode} onChange={(event) => setInvoice({ ...invoice, revenueAccountCode: event.target.value })}>{revenueAccounts.map((account) => <option key={account.id} value={account.code}>{account.code} — {ar ? account.nameAr : account.nameEn}</option>)}</select></Field>
      </div><div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">{ar ? "القيد المقترح: من حـ/ العملاء 1120 إلى حـ/ الإيراد وضريبة المخرجات. يُحفظ كمسودة للمراجعة قبل الترحيل." : "Proposed: Dr A/R 1120, Cr revenue and output VAT. Saved as a draft for review."}</div><button className="btn btn-primary mt-4" onClick={addInvoice}><FilePlus2 size={17}/>{ar ? "إنشاء الفاتورة ومسودة القيد" : "Create invoice and draft"}</button>
      </article>

      <article className="card"><SectionTitle icon={BanknoteArrowDown} ar="تسجيل تحصيل من عميل" en="Record customer collection"/><div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label={ar ? "العميل" : "Customer"}><select value={collection.partyId} onChange={(event) => setCollection({ ...collection, partyId: event.target.value, itemId: "", amount: 0 })}><option value="">—</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} — {ar ? customer.nameAr : customer.nameEn}</option>)}</select></Field>
        <Field label={ar ? "الفاتورة" : "Invoice"}><select value={collection.itemId} onChange={(event) => { const item = items.find((current) => current.id === event.target.value); setCollection({ ...collection, itemId: event.target.value, amount: item ? itemOutstanding(item) : 0 }); }}><option value="">—</option>{selectedCustomerItems.map((item) => <option key={item.id} value={item.id}>{item.invoiceNumber} — {money(itemOutstanding(item), locale)} {item.currency}</option>)}</select></Field>
        <Field label={ar ? "تاريخ التحصيل" : "Collection date"}><input type="date" value={collection.date} onChange={(event) => setCollection({ ...collection, date: event.target.value })}/></Field>
        <Field label={ar ? "المبلغ المحصل" : "Collected amount"}><input type="number" min="0" value={collection.amount || ""} onChange={(event) => setCollection({ ...collection, amount: Number(event.target.value) })}/></Field>
        <Field label={ar ? "الصندوق أو البنك" : "Cash / bank account"}><select value={collection.paymentAccountCode} onChange={(event) => setCollection({ ...collection, paymentAccountCode: event.target.value })}>{paymentAccounts.map((account) => <option key={account.id} value={account.code}>{account.code} — {ar ? account.nameAr : account.nameEn}</option>)}</select></Field>
        <Field label={ar ? "مرجع التحصيل" : "Collection reference"}><input dir="ltr" value={collection.reference} onChange={(event) => setCollection({ ...collection, reference: event.target.value })}/></Field>
      </div><div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">{ar ? "القيد المقترح: من حـ/ الصندوق أو البنك إلى حـ/ العملاء 1120، ثم يخفض رصيد الفاتورة وأعمار الدين تلقائيًا." : "Proposed: Dr cash/bank, Cr A/R 1120, then reduce the invoice and aging balance."}</div><button className="btn btn-primary mt-4" onClick={recordCollection}><BanknoteArrowDown size={17}/>{ar ? "تسجيل التحصيل ومسودة القيد" : "Record collection and draft"}</button>
      </article>
    </section>

    {(notice || error) && <p className={`rounded-2xl p-4 font-bold ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{error || notice}</p>}

    <section className="card"><div className="flex flex-wrap items-end justify-between gap-4"><SectionTitle icon={UsersRound} ar="حسابات العملاء وأعمار الديون" en="Customer accounts and aging"/><label className="min-w-[280px]"><span className="sr-only">Search</span><div className="flex items-center gap-2"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث بالاسم أو الكود أو الرقم الضريبي" : "Search customer, code, or tax number"}/></div></label></div><div className="table-wrap mt-5"><table><thead><tr><th>{ar ? "العميل" : "Customer"}</th><th>{ar ? "الحساب الفرعي" : "Subledger"}</th><th>{ar ? "حد الائتمان" : "Credit limit"}</th><th>{ar ? "غير مستحق" : "Current"}</th><th>1–30</th><th>31–60</th><th>61–90</th><th>+90</th><th>{ar ? "الرصيد" : "Balance"}</th><th>{ar ? "الحالة" : "Risk"}</th><th></th></tr></thead><tbody>{filteredBalances.map(({ customer, aging }) => { const utilization = customer.creditLimit ? aging.total / customer.creditLimit * 100 : 0, risky = aging.over90 > 0 || utilization > 100; return <tr key={customer.id}><td><b>{ar ? customer.nameAr : customer.nameEn}</b><small className="mt-1 block text-daftar-muted" dir="ltr">{customer.code}</small></td><td dir="ltr">{customer.accountCode}</td><td>{customer.creditLimit ? money(customer.creditLimit, locale) : "—"}</td><td>{money(aging.current, locale)}</td><td>{money(aging.days30, locale)}</td><td>{money(aging.days60, locale)}</td><td>{money(aging.days90, locale)}</td><td>{money(aging.over90, locale)}</td><td><b>{money(aging.total, locale)}</b></td><td><span className={risky ? "badge error" : "badge"}>{risky ? (ar ? "يحتاج متابعة" : "Review") : (ar ? "منتظم" : "Healthy")}</span></td><td><Link className="btn" href={`/${locale}/parties/${customer.id}`}><Eye size={15}/>{ar ? "كشف وملف 360°" : "Statement & 360°"}</Link></td></tr>; })}{!filteredBalances.length && <tr><td colSpan={11}>{ar ? "لا يوجد عملاء مطابقون." : "No matching customers."}</td></tr>}</tbody></table></div></section>

    <section className="card"><SectionTitle icon={CalendarClock} ar="الفواتير المفتوحة والقيود المرتبطة" en="Open invoices and linked entries"/><div className="table-wrap mt-5"><table><thead><tr><th>{ar ? "الفاتورة" : "Invoice"}</th><th>{ar ? "العميل" : "Customer"}</th><th>{ar ? "البيان" : "Description"}</th><th>{ar ? "الاستحقاق" : "Due"}</th><th>{ar ? "الإجمالي" : "Total"}</th><th>{ar ? "المحصل" : "Collected"}</th><th>{ar ? "المتبقي" : "Outstanding"}</th><th>{ar ? "قيد الفاتورة" : "Invoice entry"}</th></tr></thead><tbody>{openInvoices.map((item) => { const customer = customerMap.get(item.partyId); return <tr key={item.id}><td dir="ltr">{item.invoiceNumber}</td><td>{customer ? (ar ? customer.nameAr : customer.nameEn) : "—"}</td><td>{item.description || "—"}</td><td>{item.dueDate}</td><td>{money(item.amount, locale)}</td><td>{money(item.paid, locale)}</td><td><b>{money(itemOutstanding(item), locale)}</b></td><td>{item.invoiceEntryId || item.linkedEntryId ? <Link className="btn" href={`/${locale}/journal?entry=${item.invoiceEntryId || item.linkedEntryId}`}>{ar ? "فتح القيد" : "Open entry"}</Link> : "—"}</td></tr>; })}{!openInvoices.length && <tr><td colSpan={8}>{ar ? "لا توجد فواتير مفتوحة حاليًا." : "No open invoices."}</td></tr>}</tbody></table></div></section>
  </div>;
}

function SectionTitle({ icon: Icon, ar, en }: { icon: typeof Plus; ar: string; en: string }) { return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-daftar-primary"><Icon size={20}/></span><h2 className="m-0 flex flex-wrap items-baseline gap-3"><span>{ar}</span><small className="font-normal text-daftar-muted" dir="ltr">{en}</small></h2></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>; }
function Metric({ icon: Icon, title, value, danger = false }: { icon: typeof UsersRound; title: string; value: string | number; danger?: boolean }) { return <article className="rounded-3xl border border-daftar-line bg-daftar-card p-5 shadow-sm"><Icon className={danger ? "text-red-600" : "text-daftar-primary"} size={21}/><small className="mt-4 block text-daftar-muted">{title}</small><b className={`mt-1 block text-2xl ${danger ? "text-red-700" : ""}`}>{value}</b></article>; }
