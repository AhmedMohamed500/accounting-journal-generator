"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import { loadEntries, subscribeToEntries } from "@/lib/storage/accounting";
import { EntryImpact } from "./entry-impact";
import { AccountingCycleTrace } from "./accounting-cycle-trace";
import type { Locale } from "@/types";

export function GeneralJournal({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [entries, setEntries] = useState<ReturnType<typeof loadEntries>>([]);
  useEffect(() => { setEntries(loadEntries()); return subscribeToEntries(setEntries); }, []);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => entries.filter((entry) => !entry.workflowStatus || entry.workflowStatus === "posted").flatMap((entry) => entry.lines.map((line) => ({ entry, line }))).filter(({ entry, line }) => `${entry.entryNumber} ${entry.date} ${entry.titleAr} ${entry.titleEn} ${line.accountNameAr} ${line.accountNameEn}`.toLowerCase().includes(query.toLowerCase())), [entries, query]);
  const debit = rows.reduce((sum, row) => sum + row.line.debit, 0); const credit = rows.reduce((sum, row) => sum + row.line.credit, 0);
  const exportCsv = () => { const csv = `entry,date,account_code,account,debit,credit,currency\n${rows.map(({ entry, line }) => `"${entry.entryNumber}",${entry.date},"${line.accountCode || ""}","${ar ? line.accountNameAr : line.accountNameEn}",${line.debit},${line.credit},${entry.currency}`).join("\n")}`; const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); link.download = "general-journal.csv"; link.click(); URL.revokeObjectURL(link.href); };
  return <section className="card"><div className="actions no-print" style={{ justifyContent: "space-between" }}><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "بحث في القيود أو الحسابات" : "Search entries or accounts"} /></label><div className="actions"><button className="btn" onClick={() => window.print()}><Printer size={16} />{ar ? "طباعة" : "Print"}</button><button className="btn" onClick={exportCsv}><Download size={16} />CSV</button></div></div>
    <div className="table-wrap"><table><thead><tr><th>{ar ? "رقم القيد" : "Entry"}</th><th>{ar ? "التاريخ" : "Date"}</th><th>{ar ? "كود الحساب" : "Code"}</th><th>{ar ? "الحساب" : "Account"}</th><th>{ar ? "مدين" : "Debit"}</th><th>{ar ? "دائن" : "Credit"}</th></tr></thead><tbody>{rows.map(({ entry, line }, index) => <tr key={`${entry.id}-${line.id}-${index}`}><td>{entry.entryNumber}</td><td>{entry.date}</td><td>{line.accountCode || "—"}</td><td>{ar ? line.accountNameAr : line.accountNameEn}</td><td>{line.debit || "—"}</td><td>{line.credit || "—"}</td></tr>)}<tr><th colSpan={4}>{ar ? "الإجمالي" : "Total"}</th><th>{debit.toLocaleString()}</th><th>{credit.toLocaleString()}</th></tr></tbody></table></div>{!rows.length && <p className="muted">{ar ? "لا توجد قيود محفوظة. أنشئ قيدًا واضغط حفظ أولًا." : "No saved entries. Generate an entry and save it first."}</p>}
    {entries.filter((entry) => !entry.workflowStatus || entry.workflowStatus === "posted").map((entry) => <details key={entry.id} className="section"><summary className="btn"><b>{ar ? "شرح الدورة والتأثير" : "Explain cycle and impact"} — {entry.entryNumber}</b></summary><div className="grid section"><AccountingCycleTrace entry={{ ...entry, workflowStatus: "posted" }} locale={locale} /><EntryImpact entry={entry} locale={locale} /></div></details>)}
  </section>;
}
