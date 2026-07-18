import type { GeneratedJournalEntry, PosOperation, PosShift, PosStore } from "@/types";
import { companyKey, loadAccounts, loadEntries, saveAccounts, saveEntries } from "./accounting";

export const POS_STORES_KEY = "finora-pos-stores";
export const POS_ACTIVE_STORE_KEY = "finora-pos-active-store";
export const POS_SHIFTS_KEY = "finora-pos-shifts";
export const POS_OPERATIONS_KEY = "finora-pos-operations";
export const POS_ENTRIES_KEY = "finora-pos-entries";

const catalogKey = (key: string) => companyKey(key);
const storeKey = (key: string, storeId: string) => `${companyKey(key)}:store:${storeId}`;
function load<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(key) || "null") as T || fallback; } catch { return fallback; } }
function save<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

export function loadPosStores() { return load<PosStore[]>(catalogKey(POS_STORES_KEY), []); }
export function savePosStores(stores: PosStore[]) { save(catalogKey(POS_STORES_KEY), stores); }
export function loadActivePosStoreId() { return localStorage.getItem(catalogKey(POS_ACTIVE_STORE_KEY)) || ""; }
export function setActivePosStoreId(storeId: string) { localStorage.setItem(catalogKey(POS_ACTIVE_STORE_KEY), storeId); }
export function createPosStore(name: string) { const store: PosStore = { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString(), active: true }; savePosStores([store, ...loadPosStores()]); setActivePosStoreId(store.id); return store; }
export function updatePosStore(storeId: string, changes: Partial<Pick<PosStore, "name" | "active" | "logoDataUrl">>) { const stores=loadPosStores().map((store)=>store.id===storeId?{...store,...changes}:store); savePosStores(stores); return stores.find((store)=>store.id===storeId); }

export function migrateLegacyPosData() {
  const posCodes = new Set(["118", "1180", "1181", "1182", "1183", "1184", "1185", "1186", "1187", "4400", "5650", "5660", "5710"]);
  const mainAccounts = loadAccounts(), cleanedAccounts = mainAccounts.filter((account) => !posCodes.has(account.code));
  if (cleanedAccounts.length !== mainAccounts.length) saveAccounts(cleanedAccounts);
  let stores = loadPosStores();
  if (stores.length) return stores;
  const legacyShifts = load<PosShift[]>(companyKey(POS_SHIFTS_KEY), []), legacyOperations = load<PosOperation[]>(companyKey(POS_OPERATIONS_KEY), []);
  const mainEntries = loadEntries(), legacyEntries = mainEntries.filter((entry) => entry.transactionType.startsWith("pos-"));
  if (!legacyShifts.length && !legacyOperations.length && !legacyEntries.length) return stores;
  const store: PosStore = { id: "migrated-main-store", name: legacyShifts[0]?.storeName || "المحل الرئيسي", createdAt: new Date().toISOString(), active: true };
  stores = [store]; savePosStores(stores); setActivePosStoreId(store.id);
  save(storeKey(POS_SHIFTS_KEY, store.id), legacyShifts); save(storeKey(POS_OPERATIONS_KEY, store.id), legacyOperations); save(storeKey(POS_ENTRIES_KEY, store.id), legacyEntries);
  if (legacyEntries.length) saveEntries(mainEntries.filter((entry) => !entry.transactionType.startsWith("pos-")));
  return stores;
}

export function loadPosShifts(storeId: string) { return load<PosShift[]>(storeKey(POS_SHIFTS_KEY, storeId), []); }
export function savePosShifts(storeId: string, shifts: PosShift[]) { save(storeKey(POS_SHIFTS_KEY, storeId), shifts.slice(0, 500)); }
export function loadPosOperations(storeId: string) { return load<PosOperation[]>(storeKey(POS_OPERATIONS_KEY, storeId), []); }
export function savePosOperations(storeId: string, operations: PosOperation[]) { save(storeKey(POS_OPERATIONS_KEY, storeId), operations.slice(0, 5000)); }
export function loadPosEntries(storeId: string) { return load<GeneratedJournalEntry[]>(storeKey(POS_ENTRIES_KEY, storeId), []); }
export function savePosEntries(storeId: string, entries: GeneratedJournalEntry[]) { save(storeKey(POS_ENTRIES_KEY, storeId), entries.slice(0, 5000)); }
export function savePosEntry(storeId: string, entry: GeneratedJournalEntry) { const prepared = { ...entry, workflowStatus: "posted" as const }; savePosEntries(storeId, [prepared, ...loadPosEntries(storeId).filter((item) => item.id !== entry.id)]); return prepared; }

export function openPosShift(storeId: string, shift: PosShift) { const shifts = loadPosShifts(storeId); if (shifts.some((item) => item.status === "open")) throw new Error("يوجد وردية مفتوحة بالفعل لهذا المحل"); savePosShifts(storeId, [shift, ...shifts]); return shift; }
export function updatePosShift(storeId: string, shift: PosShift) { savePosShifts(storeId, [shift, ...loadPosShifts(storeId).filter((item) => item.id !== shift.id)]); return shift; }
export function savePosOperation(storeId: string, operation: PosOperation) { savePosOperations(storeId, [operation, ...loadPosOperations(storeId).filter((item) => item.id !== operation.id)]); return operation; }
