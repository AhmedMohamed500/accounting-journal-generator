"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Download, FileText, Printer, Save } from "lucide-react";
import { loadAccounts, saveEntry } from "@/lib/storage/accounting";
import { EntryImpact } from "@/components/accounting/entry-impact";
import { AccountingCycleTrace } from "@/components/accounting/accounting-cycle-trace";
import { getPostingAccounts } from "@/lib/accounting/accounts";
import type { ChartAccount, GeneratedJournalEntry, JournalEntryLine, Locale } from "@/types";

const asText = (entry: GeneratedJournalEntry, locale: Locale) => [locale === "ar" ? entry.titleAr : entry.titleEn, locale === "ar" ? entry.narrationAr : entry.narrationEn, ...entry.lines.map((line) => `${line.accountCode || ""}\t${locale === "ar" ? line.accountNameAr : line.accountNameEn}\t${line.debit || "-"}\t${line.credit || "-"}`), `${entry.totalDebit}\t${entry.totalCredit}`].join("\n");

export function JournalResult({ entry, locale }: { entry: GeneratedJournalEntry; locale: Locale }) {
  const ar = locale === "ar";
  const [working, setWorking] = useState(entry);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { setWorking(entry); setAccounts(getPostingAccounts(loadAccounts())); }, [entry]);
  const replaceAccount = (lineId: string, accountId: string) => {
    const account = accounts.find((item) => item.id === accountId); if (!account) return;
    setWorking((current) => ({ ...current, lines: current.lines.map((line) => line.id === lineId ? { ...line, accountCode: account.code, accountNameAr: account.nameAr, accountNameEn: account.nameEn } : line) }));
  };
  const save = () => { try { const saved = saveEntry({ ...working, workflowStatus: "draft" }); setWorking(saved); setMessage(ar ? "تم حفظ القيد كمسودة. أرسله للمراجعة من مركز الاعتماد." : "Saved as draft. Submit it from the review center."); } catch { setMessage(ar ? "تعذر الحفظ." : "Could not save."); } };
  const download = (content: string, name: string, type: string) => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); URL.revokeObjectURL(link.href); };
  const csv = () => download(`account_code,account,debit,credit\n${working.lines.map((line) => `"${line.accountCode || ""}","${ar ? line.accountNameAr : line.accountNameEn}",${line.debit},${line.credit}`).join("\n")}`, "entry.csv", "text/csv;charset=utf-8");
  const pdf = async () => { try { const { jsPDF } = await import("jspdf"); const doc = new jsPDF(); doc.text(working.titleEn, 15, 20); working.lines.forEach((line, index) => doc.text(`${line.accountCode || ""} ${line.accountNameEn}: Dr ${line.debit} Cr ${line.credit}`, 15, 35 + index * 8)); doc.save("journal-entry.pdf"); } catch { setMessage(ar ? "تعذر تصدير PDF." : "PDF export failed."); } };
  return <article className="card" id="journal-result">
    <div className="actions" style={{ justifyContent: "space-between" }}><div><span className={working.isBalanced ? "badge" : "badge error"}><CheckCircle2 size={15} />{working.isBalanced ? (ar ? "قيد متوازن" : "Balanced") : (ar ? "غير متوازن" : "Unbalanced")}</span><h2>{ar ? working.titleAr : working.titleEn}</h2><p className="muted">{working.entryNumber} · {working.date} · {working.currency}</p></div>
      <div className="no-print actions"><button className="btn" onClick={() => navigator.clipboard.writeText(asText(working, locale))}><Copy size={16} />{ar ? "نسخ" : "Copy"}</button><button className="btn btn-primary" onClick={save}><Save size={16} />{ar ? "حفظ كمسودة" : "Save draft"}</button><button className="btn" onClick={() => window.print()}><Printer size={16} /></button><button className="btn" onClick={csv}>CSV</button><button className="btn" onClick={() => download(JSON.stringify(working, null, 2), "entry.json", "application/json")}>JSON</button><button className="btn" onClick={pdf}><Download size={16} />PDF</button></div>
    </div>
    {message && <div className="warning"><p>{message}</p><Link className="btn btn-primary" href={`/${locale}/operations/${working.id}`}><FileText size={16} />{ar ? "فتح بطاقة العملية المحاسبية الشاملة" : "Open the full operation dossier"}</Link></div>}<p>{ar ? working.narrationAr : working.narrationEn}</p>
    <div className="table-wrap"><table><thead><tr><th>{ar ? "كود الحساب" : "Code"}</th><th>{ar ? "اسم الحساب" : "Account"}</th><th className="no-print">{ar ? "اختيار من الدليل" : "Select from chart"}</th><th>{ar ? "مدين" : "Debit"}</th><th>{ar ? "دائن" : "Credit"}</th></tr></thead><tbody>
      {working.lines.map((line) => <tr key={line.id}><td>{line.accountCode || "—"}</td><td>{ar ? line.accountNameAr : line.accountNameEn}</td><td className="no-print"><AccountSelect line={line} accounts={accounts} locale={locale} onChange={(id) => replaceAccount(line.id, id)} /></td><td>{line.debit ? line.debit.toLocaleString(ar ? "ar-EG" : "en-US") : "—"}</td><td>{line.credit ? line.credit.toLocaleString(ar ? "ar-EG" : "en-US") : "—"}</td></tr>)}
      <tr><th colSpan={ar ? 3 : 3}>{ar ? "الإجمالي" : "Total"}</th><th>{working.totalDebit.toLocaleString()}</th><th>{working.totalCredit.toLocaleString()}</th></tr>
    </tbody></table></div>
    <details open><summary><b>{ar ? "الشرح والقاعدة المحاسبية" : "Explanation and rule"}</b></summary><ul>{(ar ? working.explanationAr : working.explanationEn).map((item) => <li key={item}>{item}</li>)}</ul><p>{ar ? working.accountingRuleAr : working.accountingRuleEn}</p></details>
    <AccountingCycleTrace entry={working} locale={locale} />
    <EntryImpact entry={working} locale={locale} />
    <p className="muted"><small>{ar ? "النتائج تعليمية ويجب مراجعتها بواسطة محاسب مؤهل قبل الترحيل الرسمي." : "Educational output; review with a qualified accountant before official posting."}</small></p>
  </article>;
}

function AccountSelect({ line, accounts, locale, onChange }: { line: JournalEntryLine; accounts: ChartAccount[]; locale: Locale; onChange: (id: string) => void }) {
  return <select aria-label={locale === "ar" ? "اختيار الحساب" : "Select account"} value="" onChange={(event) => onChange(event.target.value)}><option value="">{locale === "ar" ? "تغيير الحساب…" : "Change account…"}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {locale === "ar" ? account.nameAr : account.nameEn}{account.code === line.accountCode ? " ✓" : ""}</option>)}</select>;
}
