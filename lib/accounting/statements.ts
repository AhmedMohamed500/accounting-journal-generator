import type { AccountType, ChartAccount, GeneratedJournalEntry } from "@/types";
import { roundCurrency } from "./calculations";
import { isPostedJournalEntry } from "./journal";

export interface StatementRow { code: string; nameAr: string; nameEn: string; type: AccountType; balance: number }

export function statementRows(entries: GeneratedJournalEntry[], accounts: ChartAccount[], from?: string, to?: string): StatementRow[] {
  const map = new Map<string, StatementRow>();
  for (const entry of entries.filter((item) => isPostedJournalEntry(item) && (!from || item.date >= from) && (!to || item.date <= to))) {
    for (const line of entry.lines) {
      const account = accounts.find((item) => item.code === line.accountCode) || accounts.find((item) => item.nameAr === line.accountNameAr || item.nameEn === line.accountNameEn);
      const type = account?.type || ("asset" as AccountType), natural = type === "asset" || type === "expense" ? line.debit - line.credit : line.credit - line.debit;
      const key = line.accountCode || line.accountNameEn, row = map.get(key) || { code: line.accountCode || "—", nameAr: line.accountNameAr, nameEn: line.accountNameEn, type, balance: 0 };
      row.balance = roundCurrency(row.balance + natural); map.set(key, row);
    }
  }
  return [...map.values()].filter((row) => Math.abs(row.balance) > .001).sort((a, b) => a.code.localeCompare(b.code));
}
export function incomeStatement(rows: StatementRow[]) { const revenue = roundCurrency(rows.filter((row) => row.type === "revenue").reduce((sum, row) => sum + row.balance, 0)), expenses = roundCurrency(rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.balance, 0)); return { revenue, expenses, netProfit: roundCurrency(revenue - expenses), rows: rows.filter((row) => row.type === "revenue" || row.type === "expense") }; }
export function balanceSheet(rows: StatementRow[]) { const assets = roundCurrency(rows.filter((row) => row.type === "asset").reduce((sum, row) => sum + row.balance, 0)), liabilities = roundCurrency(rows.filter((row) => row.type === "liability").reduce((sum, row) => sum + row.balance, 0)), equityBase = roundCurrency(rows.filter((row) => row.type === "equity").reduce((sum, row) => sum + row.balance, 0)), profit = incomeStatement(rows).netProfit, equity = roundCurrency(equityBase + profit); return { assets, liabilities, equity, difference: roundCurrency(assets - liabilities - equity), rows: rows.filter((row) => !["revenue", "expense"].includes(row.type)) }; }
export function ledgerForAccount(entries: GeneratedJournalEntry[], code: string) { let balance = 0; return entries.filter(isPostedJournalEntry).sort((a, b) => a.date.localeCompare(b.date)).flatMap((entry) => entry.lines.filter((line) => line.accountCode === code).map((line) => { balance = roundCurrency(balance + line.debit - line.credit); return { entryId: entry.id, entryNumber: entry.entryNumber, date: entry.date, narration: entry.narrationAr, debit: line.debit, credit: line.credit, balance }; })); }
