import { roundCurrency } from "./calculations";
import type { AccountType, ChartAccount, FinancialStatementSection, GeneratedJournalEntry } from "@/types";

export interface EntryLineImpact { lineId: string; code?: string; nameAr: string; nameEn: string; type: AccountType; section: FinancialStatementSection; statement: "balance-sheet" | "income-statement"; amount: number; movement: "increase" | "decrease"; debit: number; credit: number; statementDelta: number }
export interface EntryImpact { lines: EntryLineImpact[]; assets: number; liabilities: number; directEquity: number; revenue: number; expenses: number; profit: number; totalEquity: number; cash: number; balancedEffect: boolean }

const fallbackSection: Record<AccountType, FinancialStatementSection> = { asset: "current-assets", liability: "current-liabilities", equity: "equity", revenue: "operating-revenue", expense: "operating-expenses" };
function inferType(text: string): AccountType { const value = text.toLowerCase(); if (/expense|cost|purchase|مصروف|تكلفة|مشتريات/.test(value)) return "expense"; if (/revenue|sales|income|إيراد|مبيعات/.test(value)) return "revenue"; if (/payable|loan|accrued|output vat|مورد|قرض|مستحق/.test(value)) return "liability"; if (/capital|equity|retained|رأس المال|حقوق الملكية/.test(value)) return "equity"; return "asset"; }
function findAccount(accounts: ChartAccount[], code: string | undefined, ar: string, en: string) { return accounts.find((account) => code && account.code === code) || accounts.find((account) => account.nameAr === ar || account.nameEn.toLowerCase() === en.toLowerCase()); }

export function analyzeEntryImpact(entry: GeneratedJournalEntry, accounts: ChartAccount[]): EntryImpact {
  const lines: EntryLineImpact[] = entry.lines.map((line) => {
    const matched = findAccount(accounts, line.accountCode, line.accountNameAr, line.accountNameEn), type = matched?.type || inferType(`${line.accountNameAr} ${line.accountNameEn}`), normal = matched?.normalBalance || (type === "asset" || type === "expense" ? "debit" : "credit");
    const accountMovement = roundCurrency(normal === "debit" ? line.debit - line.credit : line.credit - line.debit), statementDelta = roundCurrency(type === "asset" || type === "expense" ? line.debit - line.credit : line.credit - line.debit);
    return { lineId: line.id, code: line.accountCode, nameAr: line.accountNameAr, nameEn: line.accountNameEn, type, section: matched?.statementSection || fallbackSection[type], statement: type === "revenue" || type === "expense" ? "income-statement" : "balance-sheet", amount: Math.abs(accountMovement), movement: accountMovement >= 0 ? "increase" : "decrease", debit: line.debit, credit: line.credit, statementDelta };
  });
  const sum = (type: AccountType) => roundCurrency(lines.filter((line) => line.type === type).reduce((total, line) => total + line.statementDelta, 0));
  const assets = sum("asset"), liabilities = sum("liability"), directEquity = sum("equity"), revenue = sum("revenue"), expenses = sum("expense"), profit = roundCurrency(revenue - expenses), totalEquity = roundCurrency(directEquity + profit);
  const cash = roundCurrency(lines.filter((line) => ["cash", "bank"].some((id) => accounts.find((account) => account.id === id)?.code === line.code)).reduce((total, line) => total + line.statementDelta, 0));
  return { lines, assets, liabilities, directEquity, revenue, expenses, profit, totalEquity, cash, balancedEffect: Math.abs(assets - liabilities - totalEquity) < .01 };
}
