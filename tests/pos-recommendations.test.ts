import { describe, expect, it } from "vitest";
import { posProviders } from "@/data/pos";
import { calculatePosOperation, calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { buildOwnerCommandCenter, compareStores, planCanAccess, safePercentChange, sortRecommendations } from "@/lib/pos/recommendations";
import type { PosOperation, PosProviderId, PosShift } from "@/types";
import type { OwnerCommandCenterInput } from "@/lib/pos/recommendations";
import type { OwnerRecommendation } from "@/types/pos-owner";

const now = new Date("2026-09-03T12:00:00.000Z");
const balances = [300, 10_000, 3_000, 2_000, 2_000, 2_000, 2_000];
function operation(shiftId: string, businessDate: string, providerId: PosProviderId, amount: number, fee: number, cost: number, reference: string, at: string, status: PosOperation["status"] = "successful") {
  return { ...calculatePosOperation({ shiftId, businessDate, type: "send-transfer", providerId, amount, customerFee: fee, providerCost: cost, reference }), at, status };
}
function fixture(storeId = "s1", storeName = "Main"): OwnerCommandCenterInput {
  const shift: PosShift = { id: `${storeId}-shift`, storeName, cashierName: "Mona", businessDate: "2026-09-03", openedAt: "2026-09-03T08:00:00.000Z", status: "open", openingCash: 3_000, providers: posProviders.map((provider, index) => ({ providerId: provider.id, openingBalance: balances[index] })) };
  const operations = [
    operation(shift.id, "2026-09-03", "fawry", 500, 10, 2, "DUP-1", "2026-09-03T09:00:00.000Z"),
    operation(shift.id, "2026-09-03", "fawry", 500, 10, 2, "DUP-1", "2026-09-03T09:02:00.000Z"),
    operation(shift.id, "2026-09-03", "etisalat-cash", 200, 4, 1, "P-1", "2026-09-03T09:30:00.000Z", "pending"),
    operation(shift.id, "2026-09-02", "vodafone-cash", 300, 4, 1, "Y-1", "2026-09-02T10:00:00.000Z"),
  ];
  return { storeId, storeName, shifts: [shift], operations, snapshot: calculatePosShiftSnapshot(shift, operations), settings: { schemaVersion: 1, onboardingComplete: true, profileMode: "demo", businessName: storeName, enabledProviders: posProviders.map((provider) => provider.id), salesDemoMode: true, tourComplete: true, lastBackupAt: "2026-08-01T00:00:00.000Z" }, subscription: { trialStartedAt: "2026-09-01T00:00:00.000Z", trialEndsAt: "2026-09-04T00:00:00.000Z", currentPlan: "pro", subscriptionStatus: "trial", billingCycle: "monthly" }, now };
}

describe("FINORA owner recommendations", () => {
  it("generates deterministic balance, pending, duplicate, backup, and trial signals", () => {
    const types = buildOwnerCommandCenter(fixture()).recommendations.map((item) => item.type);
    expect(types).toEqual(expect.arrayContaining(["LOW_SERVICE_BALANCE", "IDLE_SERVICE_BALANCE", "PENDING_TOO_LONG", "DUPLICATE_RISK", "BACKUP_OVERDUE", "TRIAL_ENDING"]));
  });

  it("keeps zero-baseline comparisons safe", () => {
    expect(safePercentChange(25, 0)).toBeNull();
    expect(safePercentChange(75, 50)).toBe(50);
  });

  it("calculates today/yesterday and week comparisons without mixing pending operations", () => {
    const model = buildOwnerCommandCenter(fixture());
    expect(model.today.operations).toBe(2);
    expect(model.today.pending).toBe(1);
    expect(model.yesterday.operations).toBe(1);
    expect(model.week.operations).toBe(3);
    expect(model.comparisons.todayProfit).not.toBeNull();
  });

  it("sorts decision cards by priority before severity", () => {
    const base = { titleAr: "", titleEn: "", detailAr: "", detailEn: "", descriptionAr: "", descriptionEn: "", reason: "test", relatedStore: "s1", actionAr: "", actionEn: "", actionType: "open" as const, actionTarget: "report" as const };
    const items: OwnerRecommendation[] = [
      { ...base, id: "low", type: "BACKUP_OVERDUE", severity: "critical", priority: 10 },
      { ...base, id: "high", type: "PENDING_TOO_LONG", severity: "medium", priority: 90 },
    ];
    expect(sortRecommendations(items).map((item) => item.id)).toEqual(["high", "low"]);
  });

  it("enforces Starter, Pro, and Business visibility", () => {
    expect(planCanAccess("starter", "dailyBrief")).toBe(true);
    expect(planCanAccess("starter", "recommendations")).toBe(false);
    expect(planCanAccess("pro", "liquidity")).toBe(true);
    expect(planCanAccess("pro", "storeComparison")).toBe(false);
    expect(planCanAccess("business", "storeComparison")).toBe(true);
  });

  it("ranks store comparisons by profit and exposes priority signal counts", () => {
    const first = fixture("s1", "Main"), second = fixture("s2", "Branch");
    second.operations = second.operations.map((item) => item.status === "successful" ? { ...item, customerFee: 1, revenue: 1, profit: 0 } : item);
    const compared = compareStores([second, first]);
    expect(compared[0].storeName).toBe("Main");
    expect(compared.every((item) => item.prioritySignals >= 0)).toBe(true);
  });

  it("ranks providers by net profit and creates the top cashier insight", () => {
    const model = buildOwnerCommandCenter(fixture());
    expect(model.providerPerformance[0].providerId).toBe("fawry");
    expect(model.cashierInsight?.cashierName).toBe("Mona");
    expect(model.cashierInsight?.titleEn).toContain("highest profit per hour");
  });

  it("raises a high-priority shift difference when a closed shift is outside tolerance", () => {
    const input = fixture(), open = input.shifts[0], expected = calculatePosShiftSnapshot(open, input.operations);
    const closed: PosShift = { ...open, status: "closed", closedAt: "2026-09-03T11:00:00.000Z", actualClosingCash: expected.expectedCash - 200, providers: open.providers.map((provider) => ({ ...provider, actualClosingBalance: expected.expectedProviders[provider.providerId] })) };
    input.shifts = [closed];
    const signal = buildOwnerCommandCenter(input).recommendations.find((item) => item.type === "SHIFT_DIFFERENCE");
    expect(signal?.severity).toBe("critical");
    expect(signal?.priority).toBeGreaterThan(80);
  });
});
