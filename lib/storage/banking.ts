import type { BankImportBatch, BankTransaction } from "@/types";
import { companyKey, loadOperationalData, saveOperationalData } from "@/lib/storage/accounting";

const KEY = "bank-reconciliation";
export function loadBankTransactions(period: string): BankTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const scoped = loadOperationalData<BankTransaction[]>(`${KEY}:period:${period}`, []);
    if (scoped.length) return scoped;
    const legacy = localStorage.getItem(`${companyKey(KEY)}:${period}`);
    if (legacy) { const items = JSON.parse(legacy) as BankTransaction[]; saveOperationalData(`${KEY}:period:${period}`, items); return items; }
    return [];
  } catch { return []; }
}
export function saveBankTransactions(period: string, items: BankTransaction[]) { saveOperationalData(`${KEY}:period:${period}`, items); }
export function loadBankImportBatches(): BankImportBatch[] { return loadOperationalData<BankImportBatch[]>(`${KEY}:imports`, []); }
export function saveBankImportBatch(batch: BankImportBatch) { const items = loadBankImportBatches().filter((item) => item.id !== batch.id); saveOperationalData(`${KEY}:imports`, [batch, ...items]); }
