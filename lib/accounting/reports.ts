import type { GeneratedJournalEntry, TrialBalanceRow } from "@/types";
import { roundCurrency } from "./calculations";

export function buildTrialBalance(entries: GeneratedJournalEntry[]): TrialBalanceRow[] {
  const rows = new Map<string, TrialBalanceRow>();
  for (const entry of entries.filter((item) => item.isBalanced && (!item.workflowStatus || item.workflowStatus === "posted"))) {
    for (const line of entry.lines) {
      const key = line.accountCode || `${line.accountNameAr}|${line.accountNameEn}`;
      const current = rows.get(key) || { accountCode: line.accountCode || "—", accountNameAr: line.accountNameAr, accountNameEn: line.accountNameEn, totalDebit: 0, totalCredit: 0, debitBalance: 0, creditBalance: 0 };
      current.totalDebit = roundCurrency(current.totalDebit + line.debit);
      current.totalCredit = roundCurrency(current.totalCredit + line.credit);
      rows.set(key, current);
    }
  }
  return [...rows.values()].map((row) => {
    const balance = roundCurrency(row.totalDebit - row.totalCredit);
    return { ...row, debitBalance: balance > 0 ? balance : 0, creditBalance: balance < 0 ? Math.abs(balance) : 0 };
  }).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export function trialBalanceTotals(rows: TrialBalanceRow[]) {
  return rows.reduce((total, row) => ({ debit: roundCurrency(total.debit + row.debitBalance), credit: roundCurrency(total.credit + row.creditBalance) }), { debit: 0, credit: 0 });
}
