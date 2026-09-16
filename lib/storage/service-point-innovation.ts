import { companyKey } from "./accounting";
import { defaultLocalRules, type LocalRuleSettings } from "@/lib/pos/local-intelligence";
import type { PosOperationType, PosProviderId } from "@/types";

export interface QuickOperationTemplate { id: string; name: string; type: PosOperationType; providerId?: PosProviderId; customerFee: number; providerCost: number; notes?: string; favorite: boolean; }
export interface ShiftHandover { shiftId: string; createdAt: string; cashierName: string; receivingCashier?: string; expectedCash: number; actualCash: number; cashVariance: number; providers: { id: PosProviderId; expected: number; actual: number; variance: number }[]; pending: number; failed: number; reversed: number; expenses: number; notes: string; acceptedAt?: string; acceptedBy?: string; acceptanceNote?: string; }
export interface InnovationStoreData { schemaVersion: 1; rules: LocalRuleSettings; templates: QuickOperationTemplate[]; handovers: ShiftHandover[]; reviewedAlerts: string[]; }
export const emptyInnovationData = (): InnovationStoreData => ({ schemaVersion: 1, rules: defaultLocalRules(), templates: [], handovers: [], reviewedAlerts: [] });
const key = (storeId: string) => `${companyKey("finora-service-point-innovation")}:store:${storeId}`;
export function loadInnovationData(storeId: string): InnovationStoreData {
  if (typeof window === "undefined" || !storeId) return emptyInnovationData();
  try { const raw = JSON.parse(localStorage.getItem(key(storeId)) || "null") as Partial<InnovationStoreData> | null; if (!raw || raw.schemaVersion !== 1) return emptyInnovationData(); const fallback = emptyInnovationData(); return { schemaVersion: 1, rules: { ...fallback.rules, ...raw.rules, minimumProviders: { ...fallback.rules.minimumProviders, ...raw.rules?.minimumProviders }, normalFees: { ...fallback.rules.normalFees, ...raw.rules?.normalFees }, normalCosts: { ...fallback.rules.normalCosts, ...raw.rules?.normalCosts } }, templates: Array.isArray(raw.templates) ? raw.templates : [], handovers: Array.isArray(raw.handovers) ? raw.handovers : [], reviewedAlerts: Array.isArray(raw.reviewedAlerts) ? raw.reviewedAlerts : [] }; } catch { return emptyInnovationData(); }
}
export function saveInnovationData(storeId: string, data: InnovationStoreData) { localStorage.setItem(key(storeId), JSON.stringify({ ...data, schemaVersion: 1, templates: data.templates.slice(0, 50), handovers: data.handovers.slice(0, 500), reviewedAlerts: data.reviewedAlerts.slice(0, 500) })); }
export function removeInnovationData(storeId: string) { localStorage.removeItem(key(storeId)); }
