"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { buildTrialBalance, trialBalanceTotals } from "@/lib/accounting/reports";
import { loadEntries, subscribeToEntries } from "@/lib/storage/accounting";
import type { Locale } from "@/types";

export function TrialBalance({ locale }: { locale: Locale }) {
  const ar = locale === "ar"; const [entries, setEntries] = useState<ReturnType<typeof loadEntries>>([]); useEffect(() => { setEntries(loadEntries()); return subscribeToEntries(setEntries); }, []); const rows = buildTrialBalance(entries); const totals = trialBalanceTotals(rows); const balanced = totals.debit === totals.credit;
  return <section className="card"><div className="actions" style={{ justifyContent: "space-between" }}><span className={balanced ? "badge" : "badge error"}><CheckCircle2 size={16} />{balanced ? (ar ? "الميزان متوازن" : "Trial balance is balanced") : (ar ? "الميزان غير متوازن" : "Trial balance is unbalanced")}</span><button className="btn no-print" onClick={() => window.print()}><Printer size={16} />{ar ? "طباعة" : "Print"}</button></div>
    <div className="table-wrap"><table><thead><tr><th>{ar ? "كود الحساب" : "Code"}</th><th>{ar ? "اسم الحساب" : "Account"}</th><th>{ar ? "إجمالي المدين" : "Debit activity"}</th><th>{ar ? "إجمالي الدائن" : "Credit activity"}</th><th>{ar ? "رصيد مدين" : "Debit balance"}</th><th>{ar ? "رصيد دائن" : "Credit balance"}</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.accountCode}-${row.accountNameEn}`}><td>{row.accountCode}</td><td>{ar ? row.accountNameAr : row.accountNameEn}</td><td>{row.totalDebit || "—"}</td><td>{row.totalCredit || "—"}</td><td>{row.debitBalance || "—"}</td><td>{row.creditBalance || "—"}</td></tr>)}<tr><th colSpan={4}>{ar ? "إجمالي الأرصدة" : "Balance totals"}</th><th>{totals.debit.toLocaleString()}</th><th>{totals.credit.toLocaleString()}</th></tr></tbody></table></div>{!rows.length && <p className="muted">{ar ? "لا توجد بيانات. احفظ بعض القيود أولًا." : "No data. Save some journal entries first."}</p>}
  </section>;
}
