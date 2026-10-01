import { defaultExpenseCategories, defaultShiftChecklist } from "@/data/service-point-operations";
import type { ServicePointOperationsData } from "@/types/service-point-operations";
import { companyKey } from "./accounting";

const storageKey = (storeId: string) => `${companyKey("hawally-service-point-operations")}:store:${storeId}`;
export const emptyServicePointOperationsData = (): ServicePointOperationsData => ({
  schemaVersion: 1,
  movements: [],
  expenseCategories: defaultExpenseCategories.map((item) => ({ ...item })),
  budgets: [], incidents: [],
  checklistItems: defaultShiftChecklist.map((item) => ({ ...item })),
  checklistCompletions: [], managementNotes: [],
});

export function normalizeServicePointOperationsData(raw?: Partial<ServicePointOperationsData> | null): ServicePointOperationsData {
  const fallback = emptyServicePointOperationsData();
  if (!raw || raw.schemaVersion !== 1) return fallback;
  return {
    schemaVersion: 1,
    movements: Array.isArray(raw.movements) ? raw.movements : [],
    expenseCategories: Array.isArray(raw.expenseCategories) && raw.expenseCategories.length ? raw.expenseCategories : fallback.expenseCategories,
    budgets: Array.isArray(raw.budgets) ? raw.budgets : [], incidents: Array.isArray(raw.incidents) ? raw.incidents : [],
    checklistItems: Array.isArray(raw.checklistItems) && raw.checklistItems.length ? raw.checklistItems : fallback.checklistItems,
    checklistCompletions: Array.isArray(raw.checklistCompletions) ? raw.checklistCompletions : [],
    managementNotes: Array.isArray(raw.managementNotes) ? raw.managementNotes : [],
  };
}
export function loadServicePointOperationsData(storeId: string) {
  if (typeof window === "undefined" || !storeId) return emptyServicePointOperationsData();
  try { return normalizeServicePointOperationsData(JSON.parse(localStorage.getItem(storageKey(storeId)) || "null")); }
  catch { return emptyServicePointOperationsData(); }
}
export function saveServicePointOperationsData(storeId: string, value: ServicePointOperationsData) {
  const data = normalizeServicePointOperationsData(value);
  localStorage.setItem(storageKey(storeId), JSON.stringify({ ...data, movements: data.movements.slice(0, 3000), budgets: data.budgets.slice(0, 500), incidents: data.incidents.slice(0, 1000), checklistCompletions: data.checklistCompletions.slice(0, 5000), managementNotes: data.managementNotes.slice(0, 1000) }));
}
export function removeServicePointOperationsData(storeId: string) { localStorage.removeItem(storageKey(storeId)); }
