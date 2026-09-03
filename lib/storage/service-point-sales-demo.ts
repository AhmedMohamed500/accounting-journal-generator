import { posProviders } from "@/data/pos";
import { servicePointSalesDemoConfig as config } from "@/data/service-point-sales-demo";
import { calculatePosOperation, calculatePosShiftSnapshot, createPosJournalEntry, createPosVarianceEntry } from "@/lib/pos/engine";
import { nextSalesDemoStep } from "@/lib/pos/sales-demo";
import type { PosProviderId, PosShift } from "@/types";
import type { SalesDemoProgress } from "@/types/sales-demo";
import { companyKey } from "./accounting";
import { appendLocalAudit, loadServicePointSettings, resetSalesDemo, saveServicePointSettings } from "./service-point-demo";
import { createPosStore, loadPosOperations, loadPosShifts, savePosEntry, savePosOperation, savePosShifts, setActivePosStoreId, updatePosShift } from "./pos";

export const SALES_DEMO_PROGRESS_KEY = "finora-service-point-sales-demo-progress";
const key = () => companyKey(SALES_DEMO_PROGRESS_KEY);
export const loadSalesDemoProgress = () => { if (typeof window === "undefined") return undefined; try { return (JSON.parse(localStorage.getItem(key()) || "null") as SalesDemoProgress | null) || undefined; } catch { return undefined; } };
export const saveSalesDemoProgress = (value: SalesDemoProgress) => { localStorage.setItem(key(), JSON.stringify(value)); return value; };
const advance = (progress: SalesDemoProgress) => saveSalesDemoProgress({ ...progress, demoStep: nextSalesDemoStep(progress.demoStep) });

export function initializeInteractiveSalesDemo(now = new Date(), locale: "ar" | "en" = "ar") {
  resetSalesDemo();
  const store = createPosStore(locale === "ar" ? config.businessNameAr : config.businessNameEn), settings = loadServicePointSettings();
  saveServicePointSettings({ ...settings, salesDemoMode: true, demoStoreIds: [store.id] });
  const progress: SalesDemoProgress = { version: 1, status: "active", locale, storeId: store.id, demoStartedAt: now.toISOString(), demoStep: 1 };
  saveSalesDemoProgress(progress); appendLocalAudit("start-guided-demo", "store", store.name); return progress;
}

export function demoStartShift(progress: SalesDemoProgress, now = new Date()) {
  const existing = loadPosShifts(progress.storeId)[0]; if (existing) return advance(progress);
  const shift: PosShift = { id: crypto.randomUUID(), storeName: progress.locale === "ar" ? config.businessNameAr : config.businessNameEn, cashierName: progress.locale === "ar" ? config.cashierNameAr : config.cashierNameEn, businessDate: now.toISOString().slice(0, 10), openedAt: now.toISOString(), status: "open", openingCash: config.openingCash, providers: posProviders.map((provider) => ({ providerId: provider.id, openingBalance: config.providerBalances[provider.id] })) };
  savePosShifts(progress.storeId, [shift]); setActivePosStoreId(progress.storeId); appendLocalAudit("open-shift", "shift", `Guided demo — ${shift.cashierName}`); return advance(progress);
}

function activeShift(progress: SalesDemoProgress) { const shift = loadPosShifts(progress.storeId).find((item) => item.status === "open"); if (!shift) throw new Error("Demo shift is not open"); return shift; }
function saveSuccessful(progress: SalesDemoProgress, input: Parameters<typeof calculatePosOperation>[0]) {
  const existing = loadPosOperations(progress.storeId).find((item) => item.reference === input.reference); if (existing) return advance(progress);
  const operation = { ...calculatePosOperation(input), status: "successful" as const }; savePosOperation(progress.storeId, operation); savePosEntry(progress.storeId, createPosJournalEntry(operation)); return advance(progress);
}
export function demoRecordFawry(progress: SalesDemoProgress) { const shift = activeShift(progress); return saveSuccessful(progress, { shiftId: shift.id, businessDate: shift.businessDate, type: "bill-payment", providerId: "fawry", ...config.fawry }); }
export function demoRecordVodafone(progress: SalesDemoProgress) { const shift = activeShift(progress); return saveSuccessful(progress, { shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", ...config.vodafone }); }
export function demoRecordPending(progress: SalesDemoProgress, now = new Date()) { const shift = activeShift(progress), existing = loadPosOperations(progress.storeId).find((item) => item.reference === config.pending.reference); if (!existing) { const operation = { ...calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "recharge", providerId: "orange-cash", ...config.pending }), at: new Date(now.getTime() - 75 * 60_000).toISOString(), status: "pending" as const }; savePosOperation(progress.storeId, operation); } return advance(progress); }
export const demoAcknowledgeAlert = (progress: SalesDemoProgress) => advance(progress);
export const demoAcknowledgeOwner = (progress: SalesDemoProgress) => advance(progress);

export function demoCloseShift(progress: SalesDemoProgress, now = new Date()) {
  const shift = activeShift(progress), operations = loadPosOperations(progress.storeId), snapshot = calculatePosShiftSnapshot(shift, operations);
  const actualProviders = snapshot.expectedProviders;
  const closed: PosShift = { ...shift, status: "closed", closedAt: now.toISOString(), actualClosingCash: snapshot.expectedCash + config.closingDifference, providers: shift.providers.map((provider) => ({ ...provider, actualClosingBalance: actualProviders[provider.providerId] })) };
  updatePosShift(progress.storeId, closed);
  const closedSnapshot = calculatePosShiftSnapshot(closed, operations, closed.actualClosingCash, actualProviders as Partial<Record<PosProviderId, number>>), varianceEntry = createPosVarianceEntry(closed, closedSnapshot); if (varianceEntry) savePosEntry(progress.storeId, varianceEntry);
  appendLocalAudit("close-shift", "shift", `Guided demo variance ${closedSnapshot.totalVariance}`);
  return saveSalesDemoProgress({ ...progress, status: "completed", demoCompletedAt: now.toISOString(), demoStep: 7 });
}

export function resetInteractiveSalesDemo() { resetSalesDemo(); localStorage.removeItem(key()); }
