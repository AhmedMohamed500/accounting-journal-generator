import { describe, expect, it } from "vitest";
import { calculatePosOperation, calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { calculateBreakEven, calculateLiquidity, calculateProfitLeakage, calculateProfitability, countCash, defaultLocalRules, feeRuleKey, previewOperationRisk } from "@/lib/pos/local-intelligence";
import type { PosOperation, PosShift } from "@/types";

const shift: PosShift = { id: "shift-1", storeName: "Test", cashierName: "Cashier", businessDate: "2026-09-16", openedAt: "2026-09-16T08:00:00Z", status: "open", openingCash: 5000, providers: [{ providerId: "fawry", openingBalance: 10000 }] };
function operation(date: string, amount: number, fee: number, cost: number, extra: Partial<PosOperation> = {}): PosOperation {
  return { ...calculatePosOperation({ shiftId: shift.id, businessDate: date, type: "bill-payment", providerId: "fawry", amount, customerFee: fee, providerCost: cost, reference: `ref-${date}-${amount}` }), at: `${date}T10:00:00Z`, status: "successful", ...extra };
}

describe("local Service Point intelligence", () => {
  it("estimates fee leakage only from successful non-reversed operations", () => {
    const rules = defaultLocalRules(); rules.normalFees[feeRuleKey("fawry", "bill-payment")] = 10; rules.normalCosts[feeRuleKey("fawry", "bill-payment")] = 2;
    const operations = [operation("2026-09-16", 100, 6, 3), operation("2026-09-16", 200, 1, 2, { status: "pending" }), operation("2026-09-15", 300, 1, 2, { status: "reversed" })];
    const result = calculateProfitLeakage(operations, [], rules, new Date("2026-09-16T12:00:00"));
    expect(result.find((item) => item.id === "low-fee")).toMatchObject({ count: 1, impact: 4 });
    expect(result.find((item) => item.id === "high-cost")).toMatchObject({ count: 1, impact: 1 });
  });
  it("estimates runway from observed outgoing requirement and refuses one-day history", () => {
    const operations = [operation("2026-09-15", 1000, 10, 2), operation("2026-09-16", 1000, 10, 2)];
    const snapshot = calculatePosShiftSnapshot(shift, operations);
    const row = calculateLiquidity(snapshot, operations, defaultLocalRules(), new Date("2026-09-16T12:00:00")).find((item) => item.id === "fawry")!;
    expect(row.averageDailyOutflow).toBe(1002);
    expect(row.runwayDays).toBeCloseTo(7.98, 2);
    expect(calculateLiquidity(snapshot, operations.slice(0, 1), defaultLocalRules(), new Date("2026-09-16T12:00:00")).find((item) => item.id === "fawry")?.runwayDays).toBeNull();
  });
  it("keeps provider top-ups out of profitability and calculates fee margin", () => {
    const rows = calculateProfitability([operation("2026-09-16", 100, 10, 2), operation("2026-09-16", 200, 10, 2), { ...operation("2026-09-16", 100, 0, 0), type: "provider-topup", profit: 0 }]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ count: 2, averageProfit: 8, totalProfit: 16, margin: 80, label: "insufficient" });
  });
  it("calculates denominations and break-even without inventing values", () => {
    expect(countCash({ 200: 3, 50: 2, 1: 4 })).toBe(704);
    expect(calculateBreakEven(9000, 6)).toBe(1500);
    expect(calculateBreakEven(9000, 0)).toBeNull();
  });
  it("separates blocking balance errors from review warnings", () => {
    const rules = defaultLocalRules(); rules.minimumProviders.fawry = 1000; rules.normalFees[feeRuleKey("fawry", "bill-payment")] = 10;
    const preview = previewOperationRisk({ operation: operation("2026-09-16", 9500, 5, 0, { reference: "existing" }), snapshot: calculatePosShiftSnapshot(shift, []), operations: [operation("2026-09-16", 100, 10, 2, { reference: "existing" })], rules });
    expect(preview.blocking).toEqual([]);
    expect(preview.warnings).toEqual(expect.arrayContaining(["low-provider", "duplicate-reference", "low-fee"]));
    expect(preview.nextProvider).toBe(500);
  });
});
