import type { CustodyAdvance } from "@/types";
import { companyKey } from "./accounting";
const KEY = "employee-custody-advances";
export function loadCustodies(): CustodyAdvance[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(companyKey(KEY)) || "[]") as CustodyAdvance[]; } catch { return []; } }
export function saveCustodies(items: CustodyAdvance[]) { localStorage.setItem(companyKey(KEY), JSON.stringify(items)); }
