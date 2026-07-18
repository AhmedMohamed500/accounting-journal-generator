import type { FiscalYear } from "@/types";
import { createFiscalYear, isDateLocked } from "@/lib/periods";
import { loadWorkspace } from "./workspace";
const key = () => `financial-periods:${loadWorkspace().activeCompanyId || "personal"}`;
export function loadFiscalYears(): FiscalYear[] { if (typeof window === "undefined") return []; try { const value = localStorage.getItem(key()); return value ? JSON.parse(value) as FiscalYear[] : [createFiscalYear(new Date().getFullYear())]; } catch { return []; } }
export function saveFiscalYears(items: FiscalYear[]) { localStorage.setItem(key(), JSON.stringify(items)); }
export function assertDateOpen(date: string) { if (isDateLocked(loadFiscalYears(), date)) throw new Error("The financial period is locked. Reopen it with authorized approval before posting or changing entries."); }
