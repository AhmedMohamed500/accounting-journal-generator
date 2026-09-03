import { beforeEach, describe, expect, it } from "vitest";
import { calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { nextSalesDemoStep, recommendedDemoPlan } from "@/lib/pos/sales-demo";
import { detectIos, detectStandalone, localStorageSizeKb, pwaInstallGuidance } from "@/lib/pwa";
import { demoAcknowledgeAlert, demoAcknowledgeOwner, demoCloseShift, demoRecordFawry, demoRecordPending, demoRecordVodafone, demoStartShift, initializeInteractiveSalesDemo, loadSalesDemoProgress, resetInteractiveSalesDemo, saveSalesDemoProgress } from "@/lib/storage/service-point-sales-demo";
import { createPosStore, loadPosOperations, loadPosShifts, loadPosStores } from "@/lib/storage/pos";

describe("FINORA installable PWA helpers", () => {
  it("detects standalone and iOS without assuming browser support", () => {
    expect(detectStandalone(true, false)).toBe(true);
    expect(detectStandalone(false, true)).toBe(true);
    expect(detectStandalone(false, false)).toBe(false);
    expect(detectIos("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(pwaInstallGuidance({ standalone: true, installPromptAvailable: true, ios: false })).toBe("installed");
    expect(pwaInstallGuidance({ standalone: false, installPromptAvailable: false, ios: true })).toBe("ios");
    expect(pwaInstallGuidance({ standalone: false, installPromptAvailable: true, ios: false })).toBe("prompt");
  });

  it("estimates local storage size without mutating data", () => {
    localStorage.setItem("finora-test", "1234567890");
    const before = localStorage.getItem("finora-test"), size = localStorageSizeKb(localStorage);
    expect(size).toBeGreaterThan(0);
    expect(localStorage.getItem("finora-test")).toBe(before);
  });
});

describe("FINORA 5-minute sales demo", () => {
  beforeEach(() => localStorage.clear());

  it("initializes an isolated dataset and preserves a real store", () => {
    const real = createPosStore("Real Store"), progress = initializeInteractiveSalesDemo(new Date("2026-09-04T08:00:00Z"));
    expect(progress.demoStep).toBe(1);
    expect(progress.status).toBe("active");
    expect(progress.storeId).not.toBe(real.id);
    expect(loadPosStores().map((store) => store.id)).toContain(real.id);
  });

  it("progresses deterministically through the seven hands-on steps", () => {
    let progress = initializeInteractiveSalesDemo(new Date("2026-09-04T08:00:00Z"));
    progress = demoStartShift(progress, new Date("2026-09-04T08:01:00Z"));
    progress = demoRecordFawry(progress);
    progress = demoRecordVodafone(progress);
    progress = demoRecordPending(progress, new Date("2026-09-04T10:00:00Z"));
    progress = demoAcknowledgeAlert(progress);
    progress = demoAcknowledgeOwner(progress);
    expect(progress.demoStep).toBe(7);
    progress = demoCloseShift(progress, new Date("2026-09-04T10:05:00Z"));
    expect(progress.status).toBe("completed");
    expect(progress.demoCompletedAt).toBeTruthy();
  });

  it("derives demo cash, balances, and true profit from real POS operations", () => {
    let progress = demoStartShift(initializeInteractiveSalesDemo(new Date("2026-09-04T08:00:00Z")), new Date("2026-09-04T08:01:00Z"));
    progress = demoRecordFawry(progress);
    let shift = loadPosShifts(progress.storeId)[0], snapshot = calculatePosShiftSnapshot(shift, loadPosOperations(progress.storeId));
    expect(snapshot.profit).toBe(8);
    expect(snapshot.expectedCash).toBe(21_010);
    expect(snapshot.expectedProviders.fawry).toBe(298);
    progress = demoRecordVodafone(progress); progress = demoRecordPending(progress, new Date("2026-09-04T10:00:00Z"));
    shift = loadPosShifts(progress.storeId)[0]; snapshot = calculatePosShiftSnapshot(shift, loadPosOperations(progress.storeId));
    expect(snapshot.profit).toBe(17);
    expect(snapshot.operationCount).toBe(2);
    expect(loadPosOperations(progress.storeId).filter((operation) => operation.status === "pending")).toHaveLength(1);
  });

  it("saves and resumes progress locally", () => {
    const started = initializeInteractiveSalesDemo(new Date("2026-09-04T08:00:00Z"));
    saveSalesDemoProgress({ ...started, demoStep: 4 });
    expect(loadSalesDemoProgress()).toMatchObject({ demoStep: 4, status: "active" });
  });

  it("resets demo data only and clears progress", () => {
    const real = createPosStore("Real Store"); initializeInteractiveSalesDemo(); resetInteractiveSalesDemo();
    expect(loadSalesDemoProgress()).toBeUndefined();
    expect(loadPosStores().map((store) => store.id)).toContain(real.id);
  });

  it("maps the demonstrated value to plans with local rules", () => {
    expect(recommendedDemoPlan(["operations"])).toBe("starter");
    expect(recommendedDemoPlan(["smart-brief"])).toBe("pro");
    expect(recommendedDemoPlan(["store-comparison"], 2)).toBe("business");
    expect(nextSalesDemoStep(7)).toBe(7);
  });
});
