import { defaultAccounts } from "@/data/accounts";
import type { ChartAccount, GeneratedJournalEntry } from "@/types";
import { loadWorkspace } from "./workspace";
import { assertDateOpen } from "./periods";
export const ACCOUNTS_KEY = "journal-chart-accounts", ENTRIES_KEY = "journal-recent";
export function activeCompanyId() { return loadWorkspace().activeCompanyId || "personal"; }
export function companyKey(base: string) { return `${base}:${activeCompanyId()}`; }
function migrate<T>(base: string, fallback: T): T { const scoped = companyKey(base), current = localStorage.getItem(scoped); if (current) return JSON.parse(current) as T; const legacy = localStorage.getItem(base); if (legacy) { localStorage.setItem(scoped, legacy); return JSON.parse(legacy) as T; } return fallback; }
function upgradeRequiredAccounts(saved: ChartAccount[]) {
  const next = [...saved], addWithParents = (item: ChartAccount) => { if (next.some((current) => current.id === item.id || current.code === item.code)) return; if (item.parentId) { const parent = defaultAccounts.find((current) => current.id === item.parentId); if (parent) addWithParents(parent); } next.push({ ...item }); };
  defaultAccounts.filter((account) => account.system).forEach(addWithParents);
  return next;
}
export function loadAccounts(): ChartAccount[] { if (typeof window === "undefined") return defaultAccounts; try { const saved = migrate(ACCOUNTS_KEY, defaultAccounts), upgraded = upgradeRequiredAccounts(saved); if (upgraded.length !== saved.length) localStorage.setItem(companyKey(ACCOUNTS_KEY), JSON.stringify(upgraded)); return upgraded; } catch { return defaultAccounts; } }
export function saveAccounts(accounts: ChartAccount[]) { localStorage.setItem(companyKey(ACCOUNTS_KEY), JSON.stringify(accounts)); }
function upgradeLegacyEntryCodes(entry: GeneratedJournalEntry) {
  let changed = false; const lines = entry.lines.map((line) => ({ ...line })), apply = (line: typeof lines[number] | undefined, code: string) => { if (!line || line.accountCode === code) return; const selected = defaultAccounts.find((account) => account.code === code); line.accountCode = code; if (selected) { line.accountNameAr = selected.nameAr; line.accountNameEn = selected.nameEn; } changed = true; };
  const debit = lines.find((line) => line.debit > 0), credit = [...lines].reverse().find((line) => line.credit > 0);
  if (entry.transactionType === "credit-sale" && debit?.accountCode === "1100") apply(debit, "1120");
  if (entry.transactionType === "cash-purchase" && credit?.accountCode === "2100") apply(credit, entry.paymentAccountCode || "1100");
  const legacy: Record<string, [string, string]> = { "customer-collection": ["1110", "1120"], "supplier-payment": ["2100", "1110"], "rent-expense": ["5100", "1100"], "electricity-expense": ["5110", "1100"], "maintenance-expense": ["5130", "1100"], "salary-accrual": ["5200", "2210"], "salary-payment": ["2210", "1110"], "loan-receipt": ["1110", "2300"], "loan-payment": ["2300", "1110"], "prepaid-expense": ["1140", "1100"], "capital-contribution": ["1110", "3100"], drawings: ["3200", "1100"], "bank-charges": ["5600", "1110"], "vat-payment": ["2201", "1110"] };
  const mapping = legacy[entry.transactionType]; if (mapping) { if (!debit?.accountCode) apply(debit, mapping[0]); if (!credit?.accountCode) apply(credit, mapping[1]); }
  return changed ? { ...entry, lines, paymentAccountCode: entry.paymentAccountCode || lines.find((line) => line.accountCode === "1100" || line.accountCode === "1110")?.accountCode } : entry;
}
export function loadEntries(): GeneratedJournalEntry[] { if (typeof window === "undefined") return []; try { const saved = migrate<GeneratedJournalEntry[]>(ENTRIES_KEY, []), upgraded = saved.map(upgradeLegacyEntryCodes); if (upgraded.some((entry, index) => entry !== saved[index])) localStorage.setItem(companyKey(ENTRIES_KEY), JSON.stringify(upgraded)); return upgraded; } catch { return []; } }
export const ACCOUNTING_ENTRIES_UPDATED = "accounting-entries-updated";
export function saveEntries(entries: GeneratedJournalEntry[]) {
  localStorage.setItem(companyKey(ENTRIES_KEY), JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(ACCOUNTING_ENTRIES_UPDATED));
}
export function subscribeToEntries(callback: (entries: GeneratedJournalEntry[]) => void) {
  if (typeof window === "undefined") return () => undefined;
  const refresh = () => callback(loadEntries());
  const storage = (event: StorageEvent) => { if (event.key === companyKey(ENTRIES_KEY)) refresh(); };
  window.addEventListener(ACCOUNTING_ENTRIES_UPDATED, refresh);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(ACCOUNTING_ENTRIES_UPDATED, refresh); window.removeEventListener("storage", storage); };
}
export function saveEntry(entry: GeneratedJournalEntry) { assertDateOpen(entry.date); const companyId = activeCompanyId(); const prepared: GeneratedJournalEntry = { ...entry, companyId, workflowStatus: entry.workflowStatus || "draft", audit: entry.audit?.length ? entry.audit : [{ id: crypto.randomUUID(), entryId: entry.id, action: "created", at: new Date().toISOString(), actor: "Local user" }] }; saveEntries([prepared, ...loadEntries().filter((item) => item.id !== entry.id)].slice(0, 500)); window.dispatchEvent(new CustomEvent<GeneratedJournalEntry>("accounting-entry-saved", { detail: prepared })); return prepared; }
