import { defaultAccounts } from "@/data/accounts";
import type { ChartAccount, GeneratedJournalEntry } from "@/types";
import { activeWorkspaceScope, loadWorkspace } from "./workspace";
import { assertDateOpen } from "./periods";
import { normalizeJournalEntry } from "@/lib/accounting/journal";
import { assertValidJournalEntry } from "@/lib/accounting/validation";
import { transitionJournalEntry } from "@/lib/accounting/posting";
import { reversePostedEntry } from "@/lib/accounting/reversal";
import { validateAccountCatalog } from "@/lib/accounting/accounts";
export const ACCOUNTS_KEY = "journal-chart-accounts", ENTRIES_KEY = "journal-recent";
export function activeCompanyId() { return loadWorkspace().activeCompanyId || "personal"; }
export function activeBranchId() { return activeWorkspaceScope().branchId; }
export function activeFiscalYearId() { return activeWorkspaceScope().fiscalYearId; }
export function companyKey(base: string) { return `${base}:${activeCompanyId()}`; }
export function operationalKey(base: string) { const scope = activeWorkspaceScope(); return `${base}:${scope.companyId}:branch:${scope.branchId}:year:${scope.fiscalYearId}`; }
function migrateCompany<T>(base: string, fallback: T): T {
  const scoped = companyKey(base), current = localStorage.getItem(scoped); if (current) return JSON.parse(current) as T;
  const legacy = localStorage.getItem(base), ownerKey = `finora-legacy-owner:${base}`, owner = localStorage.getItem(ownerKey), companyId = activeCompanyId();
  if (legacy && (!owner || owner === companyId)) { localStorage.setItem(scoped, legacy); localStorage.setItem(ownerKey, companyId); return JSON.parse(legacy) as T; }
  return fallback;
}
function migrateOperational<T>(base: string, fallback: T): T {
  const scoped = operationalKey(base), current = localStorage.getItem(scoped); if (current) return JSON.parse(current) as T;
  const marker = companyKey(`scope-migrated:${base}`); if (localStorage.getItem(marker)) return fallback;
  const companyLegacy = localStorage.getItem(companyKey(base)), rawLegacy = localStorage.getItem(base), ownerKey = `finora-legacy-owner:${base}`, owner = localStorage.getItem(ownerKey), legacy = companyLegacy || ((!owner || owner === activeCompanyId()) ? rawLegacy : null);
  if (legacy) { localStorage.setItem(scoped, legacy); localStorage.setItem(marker, scoped); if (rawLegacy === legacy) localStorage.setItem(ownerKey, activeCompanyId()); return JSON.parse(legacy) as T; }
  localStorage.setItem(marker, scoped); return fallback;
}
export function loadOperationalData<T>(base: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return migrateOperational(base, fallback); } catch { return fallback; }
}
export function saveOperationalData<T>(base: string, value: T) { localStorage.setItem(operationalKey(base), JSON.stringify(value)); }
function upgradeRequiredAccounts(saved: ChartAccount[]) {
  const next = [...saved], addWithParents = (item: ChartAccount) => { if (next.some((current) => current.id === item.id || current.code === item.code)) return; if (item.parentId) { const parent = defaultAccounts.find((current) => current.id === item.parentId); if (parent) addWithParents(parent); } next.push({ ...item }); };
  defaultAccounts.filter((account) => account.system).forEach(addWithParents);
  return next;
}
export function loadAccounts(): ChartAccount[] { if (typeof window === "undefined") return defaultAccounts; try { const saved = migrateCompany(ACCOUNTS_KEY, defaultAccounts), upgraded = upgradeRequiredAccounts(saved); if (upgraded.length !== saved.length) localStorage.setItem(companyKey(ACCOUNTS_KEY), JSON.stringify(upgraded)); return upgraded; } catch { return defaultAccounts; } }
export function saveAccounts(accounts: ChartAccount[]) { const errors = validateAccountCatalog(accounts); if (errors.length) throw new Error(errors[0]); localStorage.setItem(companyKey(ACCOUNTS_KEY), JSON.stringify(accounts)); }
function upgradeLegacyEntryCodes(entry: GeneratedJournalEntry) {
  let changed = false; const lines = entry.lines.map((line) => ({ ...line })), apply = (line: typeof lines[number] | undefined, code: string) => { if (!line || line.accountCode === code) return; const selected = defaultAccounts.find((account) => account.code === code); line.accountCode = code; if (selected) { line.accountNameAr = selected.nameAr; line.accountNameEn = selected.nameEn; } changed = true; };
  const debit = lines.find((line) => line.debit > 0), credit = [...lines].reverse().find((line) => line.credit > 0);
  if (entry.transactionType === "credit-sale" && debit?.accountCode === "1100") apply(debit, "1120");
  if (entry.transactionType === "cash-purchase" && credit?.accountCode === "2100") apply(credit, entry.paymentAccountCode || "1100");
  const legacy: Record<string, [string, string]> = { "customer-collection": ["1110", "1120"], "supplier-payment": ["2100", "1110"], "rent-expense": ["5100", "1100"], "electricity-expense": ["5110", "1100"], "maintenance-expense": ["5130", "1100"], "salary-accrual": ["5200", "2210"], "salary-payment": ["2210", "1110"], "loan-receipt": ["1110", "2300"], "loan-payment": ["2300", "1110"], "prepaid-expense": ["1140", "1100"], "capital-contribution": ["1110", "3100"], drawings: ["3200", "1100"], "bank-charges": ["5600", "1110"], "vat-payment": ["2201", "1110"] };
  const mapping = legacy[entry.transactionType]; if (mapping) { if (!debit?.accountCode) apply(debit, mapping[0]); if (!credit?.accountCode) apply(credit, mapping[1]); }
  return changed ? { ...entry, lines, paymentAccountCode: entry.paymentAccountCode || lines.find((line) => line.accountCode === "1100" || line.accountCode === "1110")?.accountCode } : entry;
}
export function loadEntries(): GeneratedJournalEntry[] { if (typeof window === "undefined") return []; try { const saved = migrateOperational<GeneratedJournalEntry[]>(ENTRIES_KEY, []), legacyUpgraded = saved.map(upgradeLegacyEntryCodes), upgraded = legacyUpgraded.reduce<GeneratedJournalEntry[]>((items, entry) => [...items, normalizeJournalEntry(entry, items)], []); if (upgraded.some((entry, index) => JSON.stringify(entry) !== JSON.stringify(saved[index]))) localStorage.setItem(operationalKey(ENTRIES_KEY), JSON.stringify(upgraded)); return upgraded; } catch { return []; } }
export const ACCOUNTING_ENTRIES_UPDATED = "accounting-entries-updated";
export function saveEntries(entries: GeneratedJournalEntry[]) {
  localStorage.setItem(operationalKey(ENTRIES_KEY), JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(ACCOUNTING_ENTRIES_UPDATED));
}
export function subscribeToEntries(callback: (entries: GeneratedJournalEntry[]) => void) {
  if (typeof window === "undefined") return () => undefined;
  const refresh = () => callback(loadEntries());
  const storage = (event: StorageEvent) => { if (event.key === operationalKey(ENTRIES_KEY)) refresh(); };
  window.addEventListener(ACCOUNTING_ENTRIES_UPDATED, refresh);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(ACCOUNTING_ENTRIES_UPDATED, refresh); window.removeEventListener("storage", storage); };
}
export function saveEntry(entry: GeneratedJournalEntry) {
  const existing = loadEntries(), companyId = activeCompanyId(), prepared = normalizeJournalEntry({ ...entry, companyId }, existing, entry.source);
  if (prepared.workflowStatus !== "draft" && prepared.workflowStatus !== "rejected") assertValidJournalEntry(prepared, loadAccounts());
  if (prepared.workflowStatus === "posted") assertDateOpen(prepared.date);
  saveEntries([prepared, ...existing.filter((item) => item.id !== prepared.id)].slice(0, 500));
  window.dispatchEvent(new CustomEvent<GeneratedJournalEntry>("accounting-entry-saved", { detail: prepared })); return prepared;
}
export function transitionStoredEntry(entryId: string, next: GeneratedJournalEntry["workflowStatus"], note?: string) {
  if (!next) throw new Error("حالة القيد مطلوبة."); const entries = loadEntries(), current = entries.find((entry) => entry.id === entryId); if (!current) throw new Error("القيد غير موجود.");
  const updated = transitionJournalEntry(current, next, { note, accounts: loadAccounts(), assertPeriodOpen: assertDateOpen });
  saveEntries(entries.map((entry) => entry.id === entryId ? updated : entry)); return updated;
}
export function postEntryThroughLifecycle(entry: GeneratedJournalEntry) {
  let saved = saveEntry({ ...entry, workflowStatus: "draft" });
  saved = transitionStoredEntry(saved.id, "review"); saved = transitionStoredEntry(saved.id, "approved"); return transitionStoredEntry(saved.id, "posted");
}
export function reverseStoredEntry(entryId: string, reason: string) {
  const entries = loadEntries(), current = entries.find((entry) => entry.id === entryId); if (!current) throw new Error("القيد غير موجود."); assertDateOpen(current.date);
  const result = reversePostedEntry(current, reason, loadAccounts());
  saveEntries([result.reversal, ...entries.map((entry) => entry.id === entryId ? result.original : entry)]); return result;
}
