import { describe, expect, it } from "vitest";
import { calculateCashierPerformance, detectPosControlSignals } from "@/lib/pos/control";
import { calculatePosOperation } from "@/lib/pos/engine";
import type { PosShift } from "@/types";

const shift: PosShift = { id: "shift-1", storeName: "Store", cashierName: "Ali", businessDate: "2026-08-03", openedAt: "2026-08-03T08:00:00Z", closedAt: "2026-08-03T12:00:00Z", status: "closed", openingCash: 1000, actualClosingCash: 1104, providers: [] };
const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", amount: 100, customerFee: 5, providerCost: 1, reference: "R-1" });

describe("service point control", () => {
  it("calculates cashier profitability and cash variance", () => {
    const performance = calculateCashierPerformance([shift], [{ ...operation, status: "successful" }])[0];
    expect(performance.operations).toBe(1);
    expect(performance.profit).toBe(4);
    expect(performance.profitPerHour).toBe(1);
    expect(performance.variance).toBe(-1);
  });

  it("flags duplicate references without accusing the cashier", () => {
    const signals = detectPosControlSignals([shift], [{ ...operation, status: "successful" }, { ...operation, id: "two", status: "successful" }]);
    expect(signals.some((item) => item.id === "duplicate-r-1")).toBe(true);
    expect(signals.every((item) => !item.titleAr.includes("سرقة"))).toBe(true);
  });

  it("flags old pending operations", () => {
    const pending = { ...operation, id: "pending", status: "pending" as const, at: "2026-08-03T08:00:00Z" };
    const signals = detectPosControlSignals([shift], [pending], new Date("2026-08-03T12:00:01Z"));
    expect(signals.some((item) => item.id === "pending-pending")).toBe(true);
  });
});
