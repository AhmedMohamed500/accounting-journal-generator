import { createEmptyOffice, createOfficeSeed } from "@/data/accounting-office";
import type { AccountingOfficeData } from "@/types";
import { activeCompanyId } from "./accounting";

export const OFFICE_STORAGE_KEY = "finora-accounting-office";
export const OFFICE_UPDATED = "finora-accounting-office-updated";
export const officeStorageKey = (companyId = activeCompanyId()) => `${OFFICE_STORAGE_KEY}:${companyId}`;

export function loadOfficeData(companyId = activeCompanyId()): AccountingOfficeData {
  if (typeof window === "undefined") return createOfficeSeed(companyId);
  try {
    const raw = localStorage.getItem(officeStorageKey(companyId));
    if (!raw) return createOfficeSeed(companyId);
    const parsed = JSON.parse(raw) as AccountingOfficeData;
    return parsed.schemaVersion === 2 && parsed.companyId === companyId ? parsed : createOfficeSeed(companyId);
  } catch { return createOfficeSeed(companyId); }
}

export function saveOfficeData(data: AccountingOfficeData) {
  localStorage.setItem(officeStorageKey(data.companyId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(OFFICE_UPDATED, { detail: data }));
}

export function resetOfficeDemo(companyId = activeCompanyId()) {
  const data = createOfficeSeed(companyId); saveOfficeData(data); return data;
}

export function startEmptyOffice(companyId = activeCompanyId(), input?: Parameters<typeof createEmptyOffice>[1]) {
  const data = createEmptyOffice(companyId, input); saveOfficeData(data); return data;
}

export function subscribeOffice(callback: (data: AccountingOfficeData) => void) {
  if (typeof window === "undefined") return () => undefined;
  const refresh = () => callback(loadOfficeData());
  const storage = (event: StorageEvent) => { if (event.key === officeStorageKey()) refresh(); };
  window.addEventListener(OFFICE_UPDATED, refresh); window.addEventListener("storage", storage);
  return () => { window.removeEventListener(OFFICE_UPDATED, refresh); window.removeEventListener("storage", storage); };
}
