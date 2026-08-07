import { roundCurrency } from "./calculations";
import type { ChartAccount, GeneratedJournalEntry } from "@/types";
import { isPostedJournalEntry } from "./journal";

export interface TreasuryBalance { account: ChartAccount; balance: number; kind: "cash" | "bank" }

function treasuryKind(account: ChartAccount, accounts: ChartAccount[]): "cash" | "bank" | undefined {
  if (account.id === "cash" || account.code === "1100") return "cash";
  if (account.id === "bank" || account.code === "1110") return "bank";
  let parentId = account.parentId;
  while (parentId) { if (parentId === "cash") return "cash"; if (parentId === "bank") return "bank"; const parent = accounts.find((item) => item.id === parentId); parentId = parent?.parentId; }
  return undefined;
}

export function treasuryAccounts(accounts: ChartAccount[]) { return accounts.filter((account) => account.active && account.allowPosting !== false && treasuryKind(account, accounts)); }

export function treasuryBalances(entries: GeneratedJournalEntry[], accounts: ChartAccount[]): TreasuryBalance[] {
  const posted = entries.filter(isPostedJournalEntry);
  return treasuryAccounts(accounts).map((account) => ({ account, kind: treasuryKind(account, accounts) || "bank", balance: roundCurrency(posted.flatMap((entry) => entry.lines).filter((line) => line.accountCode === account.code).reduce((sum, line) => sum + line.debit - line.credit, 0)) }));
}

export function totalTreasuryBalance(entries: GeneratedJournalEntry[], accounts: ChartAccount[]) { return roundCurrency(treasuryBalances(entries, accounts).reduce((sum, current) => sum + current.balance, 0)); }
