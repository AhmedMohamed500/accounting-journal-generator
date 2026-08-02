import type { BankImportBatch, BankTransaction } from "@/types";
import { companyKey } from "@/lib/storage/accounting";

const KEY = "bank-reconciliation";
const batchKey = () => companyKey(`${KEY}:imports`);
export function loadBankTransactions(period: string): BankTransaction[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(`${companyKey(KEY)}:${period}`) || "[]") as BankTransaction[]; } catch { return []; }
}
export function saveBankTransactions(period: string, items: BankTransaction[]) { localStorage.setItem(`${companyKey(KEY)}:${period}`, JSON.stringify(items)); }
export function loadBankImportBatches(): BankImportBatch[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(batchKey()) || "[]") as BankImportBatch[]; } catch { return []; } }
export function saveBankImportBatch(batch: BankImportBatch) { const items = loadBankImportBatches().filter((item) => item.id !== batch.id); localStorage.setItem(batchKey(), JSON.stringify([batch, ...items])); }
