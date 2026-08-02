"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Landmark } from "lucide-react";
import type { ChartAccount, GeneratedJournalEntry, Locale, TransactionInput } from "@/types";
import { parseTransaction } from "@/lib/parser";
import { generateJournalEntry } from "@/rules";
import { getTransaction, transactions } from "@/data/transactions";
import { loadAccounts } from "@/lib/storage/accounting";
import { treasuryAccounts } from "@/lib/accounting/treasury";
import { JournalResult } from "@/components/journal/result";

const schema = z.object({ type: z.string().min(1), amount: z.number().positive(), date: z.string().optional(), currency: z.string().length(3), paymentMethod: z.enum(["cash", "bank", "cheque", "credit"]), paymentAccountCode: z.string().optional(), vatEnabled: z.boolean(), vatRate: z.number().min(0).max(100), vatIncluded: z.boolean(), commercialDiscount: z.number().min(0), withholdingEnabled: z.boolean(), withholdingRate: z.number().min(0).max(100), usefulLife: z.number().min(0), residualValue: z.number().min(0), notes: z.string().optional() });
type Form = z.infer<typeof schema>;

export function Generator({ locale, initialType }: { locale: Locale; initialType?: string }) {
  const ar = locale === "ar", [tab, setTab] = useState<"text" | "guided">("text"), [natural, setNatural] = useState(""), [entry, setEntry] = useState<GeneratedJournalEntry>(), [notice, setNotice] = useState(""), [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors }, reset } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { type: initialType || "cash-sale", amount: 10000, date: new Date().toISOString().slice(0, 10), currency: "EGP", paymentMethod: "cash", paymentAccountCode: "1100", vatEnabled: false, vatRate: 14, vatIncluded: false, commercialDiscount: 0, withholdingEnabled: false, withholdingRate: 0, usefulLife: 5, residualValue: 0 } });
  useEffect(() => setAccounts(treasuryAccounts(loadAccounts())), []);
  const vat = watch("vatEnabled"), withholding = watch("withholdingEnabled"), type = watch("type"), paymentMethod = watch("paymentMethod"), paymentAccountCode = watch("paymentAccountCode");
  useEffect(() => { if (paymentMethod === "cash" && (!paymentAccountCode || paymentAccountCode === "1110")) setValue("paymentAccountCode", "1100"); if ((paymentMethod === "bank" || paymentMethod === "cheque") && (!paymentAccountCode || paymentAccountCode === "1100")) setValue("paymentAccountCode", "1110"); }, [paymentMethod, paymentAccountCode, setValue]);
  const submit = (value: Form) => { try { const selected = accounts.find((account) => account.code === value.paymentAccountCode), input: TransactionInput = { ...value, paymentAccountNameAr: selected?.nameAr, paymentAccountNameEn: selected?.nameEn }; setEntry(generateJournalEntry(input)); setNotice(""); } catch (error) { setNotice(error instanceof Error ? error.message : "Generation failed"); } };
  const preview = useMemo(() => natural.trim() ? parseTransaction(natural) : undefined, [natural]);
  const parse = () => {
    const result = parseTransaction(natural);
    Object.entries(result.input).forEach(([key, value]) => { if (value !== undefined) setValue(key as keyof Form, value as never); });
    if (result.missingFields.length) {
      setNotice((ar ? result.warningsAr : result.warningsEn).join(" "));
      setTab("guided");
      return;
    }
    const current = getValues();
    const candidate = schema.safeParse({ ...current, ...result.input, vatRate: result.input.vatRate ?? current.vatRate });
    if (!candidate.success) {
      setNotice(ar ? "فهمت العملية، لكن توجد بيانات تحتاج مراجعة في النموذج الموجّه." : "The transaction was understood, but some fields need review in the guided form.");
      setTab("guided");
      return;
    }
    submit(candidate.data);
    const understood = getTransaction(candidate.data.type);
    setNotice(ar ? `تم فهم العملية: ${understood?.titleAr || candidate.data.type} بمبلغ ${candidate.data.amount.toLocaleString("ar-EG")} ${candidate.data.currency}. راجع القيد المقترح بالأسفل.` : `Understood: ${understood?.titleEn || candidate.data.type} for ${candidate.data.amount.toLocaleString("en-US")} ${candidate.data.currency}. Review the suggested entry below.`);
  };
  return <div className="grid" style={{ gap: 22 }}><section className="card no-print"><div className="tabs"><button className={`btn ${tab === "text" ? "tab-active" : ""}`} onClick={() => setTab("text")}>{ar ? "اكتب العملية" : "Natural language"}</button><button className={`btn ${tab === "guided" ? "tab-active" : ""}`} onClick={() => setTab("guided")}>{ar ? "النموذج الموجّه" : "Guided form"}</button></div>
    {tab === "text" ? <div className="grid">
      <label>{ar ? "صف العملية المحاسبية بطريقتك" : "Describe the transaction in your own words"}
        <textarea rows={5} value={natural} onChange={(event) => setNatural(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") parse(); }} placeholder={ar ? "مثال: حصلت شيكات من العميل أحمد بمبلغ 5,000 جنيه" : "Example: Received a 5,000 EGP cheque from customer Ahmed"}/>
      </label>
      {preview && <section className="card" style={{ padding: 18, background: preview.missingFields.length ? "#fff8e6" : "#eefbf5" }}>
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <strong>{ar ? "الفهم الفوري للعملية" : "Live transaction understanding"}</strong>
          <span className="badge">{Math.round(preview.confidence * 100)}% {ar ? "ثقة" : "confidence"}</span>
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <span className="badge">{preview.input.type ? (ar ? getTransaction(preview.input.type)?.titleAr : getTransaction(preview.input.type)?.titleEn) : (ar ? "نوع العملية غير واضح" : "Type not clear")}</span>
          <span className="badge">{preview.input.amount ? `${preview.input.amount.toLocaleString(ar ? "ar-EG" : "en-US")} ${preview.input.currency}` : (ar ? "المبلغ غير واضح" : "Amount not clear")}</span>
          <span className="badge">{ar ? ({ cash: "نقدي — الصندوق", bank: "البنك", cheque: "شيك — البنك", credit: "آجل" }[preview.input.paymentMethod || "cash"]) : preview.input.paymentMethod}</span>
          {preview.input.customer && <span className="badge">{ar ? "العميل" : "Customer"}: {preview.input.customer}</span>}
          {preview.input.supplier && <span className="badge">{ar ? "المورد" : "Supplier"}: {preview.input.supplier}</span>}
          {preview.input.vatEnabled && <span className="badge">{ar ? "ضريبة" : "VAT"}: {preview.input.vatRate ?? 14}%</span>}
        </div>
        {preview.missingFields.length > 0 && <p className="muted" style={{ marginTop: 10 }}>{(ar ? preview.warningsAr : preview.warningsEn).join(" ")}</p>}
      </section>}
      <div className="actions">{[ar ? "حصلت شيكات من العميل أحمد بمبلغ 5,000" : "Received a 5,000 cheque from customer Ahmed", ar ? "بيع نقدي 10,000 وضريبة 14%" : "cash sale 10,000 VAT 14%", ar ? "شراء آجل 5,000 من المورد النور" : "credit purchase 5,000 from Al Noor supplier", ar ? "دفعت مصروف صيانة 2,000 من البنك" : "paid maintenance expense 2,000 from bank"].map((example) => <button className="btn" key={example} onClick={() => setNatural(example)}>{example}</button>)}</div>
      <button className="btn btn-primary" onClick={parse} disabled={!natural.trim()}>{ar ? "إنشاء القيد الذي فهمه النظام" : "Generate the understood entry"}</button>
      <small className="muted">{ar ? "اختصار سريع: Ctrl + Enter. يعمل محليًا بدون API مدفوع، والقيد يظل للمراجعة قبل الاعتماد والترحيل." : "Shortcut: Ctrl + Enter. Works locally without a paid API; review before approval and posting."}</small>
    </div>
      : <form className="grid" onSubmit={handleSubmit(submit)}><div className="grid three"><label>{ar ? "نوع العملية" : "Transaction type"}<select {...register("type")}>{transactions.map((transaction) => <option key={transaction.type} value={transaction.type}>{ar ? transaction.titleAr : transaction.titleEn}</option>)}</select></label><label>{ar ? "المبلغ" : "Amount"}<input type="number" step="0.01" {...register("amount")}/>{errors.amount && <small className="error">{ar ? "أدخل مبلغًا أكبر من صفر" : "Enter an amount greater than zero"}</small>}</label><label>{ar ? "العملة" : "Currency"}<select {...register("currency")}>{["EGP", "USD", "EUR", "SAR", "AED", "KWD", "QAR", "GBP"].map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>{ar ? "التاريخ" : "Date"}<input type="date" {...register("date")}/></label><label>{ar ? "طريقة السداد أو التحصيل" : "Payment or receipt method"}<select {...register("paymentMethod")}><option value="cash">{ar ? "نقدي — صندوق" : "Cash"}</option><option value="bank">{ar ? "تحويل بنكي" : "Bank"}</option><option value="cheque">{ar ? "شيك — بنك" : "Cheque"}</option><option value="credit">{ar ? "آجل — عملاء/موردون" : "Credit"}</option></select></label><label>{ar ? "خصم تجاري" : "Commercial discount"}<input type="number" {...register("commercialDiscount")}/></label></div>
        {paymentMethod !== "credit" && <section className="card"><h3>{paymentMethod === "cash" ? <Banknote size={19}/> : <Landmark size={19}/>} {ar ? "الحساب الذي ستتحرك عليه الأموال" : "Treasury account affected"}</h3><label>{ar ? "اختر الصندوق أو الحساب البنكي" : "Select cash or bank account"}<select {...register("paymentAccountCode")}><option value="">—</option>{accounts.map((account) => <option key={account.id} value={account.code}>{account.code} — {ar ? account.nameAr : account.nameEn}</option>)}</select></label><p className="muted"><small>{ar ? "لن يتغير الرصيد الرسمي إلا بعد اعتماد القيد وترحيله." : "The official balance changes only after the entry is approved and posted."}</small></p></section>}
        <div className="actions"><label><input style={{ width: "auto" }} type="checkbox" {...register("vatEnabled")}/>{ar ? " تطبيق ضريبة قيمة مضافة" : " Apply VAT"}</label>{vat && <><label>{ar ? "النسبة %" : "Rate %"}<input type="number" {...register("vatRate")}/></label><label><input style={{ width: "auto" }} type="checkbox" {...register("vatIncluded")}/>{ar ? " المبلغ شامل الضريبة" : " VAT included"}</label></>}</div><div className="actions"><label><input style={{ width: "auto" }} type="checkbox" {...register("withholdingEnabled")}/>{ar ? " ضريبة خصم" : " Withholding tax"}</label>{withholding && <label>{ar ? "النسبة %" : "Rate %"}<input type="number" {...register("withholdingRate")}/></label>}</div>{type === "depreciation" && <div className="grid two"><label>{ar ? "العمر الإنتاجي" : "Useful life"}<input type="number" {...register("usefulLife")}/></label><label>{ar ? "القيمة التخريدية" : "Residual value"}<input type="number" {...register("residualValue")}/></label></div>}<label>{ar ? "ملاحظات" : "Notes"}<textarea {...register("notes")}/></label><div className="actions"><button className="btn btn-primary" type="submit">{ar ? "إنشاء القيد" : "Generate entry"}</button><button className="btn" type="button" onClick={() => { reset(); setEntry(undefined); }}>{ar ? "إعادة تعيين" : "Reset"}</button></div></form>}
    {notice && <p className={entry && !preview?.missingFields.length ? "success" : "warning"}>{notice}</p>}</section>{entry && <JournalResult entry={entry} locale={locale}/>}</div>;
}
