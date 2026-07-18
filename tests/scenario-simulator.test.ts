import { describe, expect, it } from "vitest";
import { simulateDecision } from "@/lib/accounting/scenario-simulator";
import type { DecisionSimulationInput } from "@/types";

const base: DecisionSimulationInput = {
  decisionType: "sale",
  amount: 1000,
  vatRate: 14,
  cashDiscountRate: 2,
  creditDays: 30,
  minimumReserve: 500,
  currency: "EGP",
  baselineCash: { now: 5000, day7: 5000, day30: 5000, day90: 5000 },
  paymentAccountCode: "1110",
  paymentAccountNameAr: "البنك",
  paymentAccountNameEn: "Bank",
};

describe("financial decision simulator", () => {
  it("compares cash, credit, and split sale timing", () => {
    const result = simulateDecision(base), cash = result.alternatives.find((item) => item.id === "cash")!, credit = result.alternatives.find((item) => item.id === "credit")!, split = result.alternatives.find((item) => item.id === "split")!;
    expect(cash.cashEffect.day7).toBe(1117.2);
    expect(credit.cashEffect.day7).toBe(0);
    expect(credit.cashEffect.day30).toBe(1140);
    expect(credit.collectionExposure).toBe(1140);
    expect(split.entries).toHaveLength(2);
    expect(result.alternatives.filter((item) => item.recommended)).toHaveLength(1);
  });

  it("shows the payable and cash timing for a credit purchase", () => {
    const result = simulateDecision({ ...base, decisionType: "purchase", cashDiscountRate: 0 }), credit = result.alternatives.find((item) => item.id === "credit")!;
    expect(credit.financialImpact.liabilities).toBe(1140);
    expect(credit.financialImpact.cash).toBe(0);
    expect(credit.cashEffect.day7).toBe(0);
    expect(credit.cashEffect.day30).toBe(-1140);
    expect(credit.vatEffect).toBe(-140);
  });

  it("flags alternatives that breach the minimum cash reserve", () => {
    const result = simulateDecision({ ...base, decisionType: "fixed-asset", amount: 10000, baselineCash: { now: 3000, day7: 3000, day30: 3000, day90: 3000 }, minimumReserve: 2500 });
    expect(result.alternatives.every((item) => item.reserveGap > 0)).toBe(true);
    expect(result.alternatives.every((item) => item.risk === "high")).toBe(true);
  });
});
