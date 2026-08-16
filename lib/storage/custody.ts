import type { CustodyAdvance } from "@/types";
import { loadOperationalData, saveOperationalData } from "./accounting";
const KEY = "employee-custody-advances";
export function loadCustodies(): CustodyAdvance[] { return loadOperationalData<CustodyAdvance[]>(KEY, []); }
export function saveCustodies(items: CustodyAdvance[]) { saveOperationalData(KEY, items); }
