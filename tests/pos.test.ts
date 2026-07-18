import { describe, expect, it } from "vitest";
import { calculatePosOperation, calculatePosShiftSnapshot, createPosJournalEntry, createPosReversal, createPosReversalJournalEntry, createPosVarianceEntry, isDuplicatePosOperation } from "@/lib/pos/engine";
import type { PosShift } from "@/types";
import { posProviders } from "@/data/pos";

const shift: PosShift = {
  id: "shift-1", storeName: "محل النور", cashierName: "أحمد", businessDate: "2026-07-14", openedAt: "2026-07-14T08:00:00Z", status: "open", openingCash: 5000,
  providers: posProviders.map((provider) => ({ providerId: provider.id, openingBalance: provider.id === "vodafone-cash" ? 10000 : 0 })),
};

describe("financial service point", () => {
  it("calculates a wallet transfer and its real profit", () => {
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", amount: 1000, customerFee: 10, providerCost: 2 });
    expect(operation.cashChange).toBe(1010);
    expect(operation.providerBalanceChange).toBe(-1002);
    expect(operation.profit).toBe(8);
    const entry = createPosJournalEntry(operation);
    expect(entry.isBalanced).toBe(true);
    expect(entry.totalDebit).toBe(1012);
    expect(entry.financialStatementImpact.profit).toBe(8);
  });

  it("calculates cash withdrawal without confusing cash and wallet", () => {
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "cash-withdrawal", providerId: "vodafone-cash", amount: 1000, customerFee: 10, providerCost: 3 });
    expect(operation.cashChange).toBe(-990);
    expect(operation.providerBalanceChange).toBe(997);
    expect(operation.profit).toBe(7);
    expect(createPosJournalEntry(operation).isBalanced).toBe(true);
  });

  it("tracks expected balances and closing variance", () => {
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", amount: 1000, customerFee: 10, providerCost: 0 });
    const snapshot = calculatePosShiftSnapshot(shift, [operation], 6005, { "vodafone-cash": 9000 });
    expect(snapshot.expectedCash).toBe(6010);
    expect(snapshot.expectedProviders["vodafone-cash"]).toBe(9000);
    expect(snapshot.cashVariance).toBe(-5);
    expect(snapshot.totalVariance).toBe(-5);
    expect(createPosVarianceEntry(shift, snapshot)?.isBalanced).toBe(true);
  });

  it("moves store-owned balance between providers without cash or profit", () => {
    const transferShift: PosShift = {
      ...shift,
      providers: posProviders.map((provider) => ({ providerId: provider.id, openingBalance: provider.id === "orange-cash" || provider.id === "vodafone-cash" ? 500 : 0 })),
    };
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "internal-provider-transfer", providerId: "orange-cash", destinationProviderId: "vodafone-cash", amount: 500, customerFee: 0, providerCost: 0 });
    const snapshot = calculatePosShiftSnapshot(transferShift, [operation]);
    const entry = createPosJournalEntry(operation);

    expect(operation.cashChange).toBe(0);
    expect(operation.profit).toBe(0);
    expect(snapshot.expectedProviders["orange-cash"]).toBe(0);
    expect(snapshot.expectedProviders["vodafone-cash"]).toBe(1000);
    expect(entry.isBalanced).toBe(true);
    expect(entry.financialStatementImpact.assets).toBe(0);
  });

  it("supports InstaPay as an independent provider balance", () => {
    const instaPay = posProviders.find((provider) => provider.id === "instapay");
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "provider-topup", providerId: "instapay", amount: 750, customerFee: 0, providerCost: 0 });

    expect(instaPay?.accountCode).toBe("1187");
    expect(operation.providerBalanceChange).toBe(750);
    expect(createPosJournalEntry(operation).isBalanced).toBe(true);
  });

  it("keeps pending and failed operations out of live balances", () => {
    const pending = { ...calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", amount: 500, customerFee: 5, providerCost: 0 }), status: "pending" as const };
    const failed = { ...pending, id: "failed", status: "failed" as const };
    const snapshot = calculatePosShiftSnapshot(shift, [pending, failed]);
    expect(snapshot.expectedCash).toBe(5000);
    expect(snapshot.expectedProviders["vodafone-cash"]).toBe(10000);
  });

  it("detects duplicate references and creates a balanced reversal", () => {
    const operation = { ...calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "vodafone-cash", amount: 500, customerFee: 5, providerCost: 1, reference: "TX-77" }), status: "successful" as const };
    expect(isDuplicatePosOperation([operation], operation, new Date(operation.at).getTime() + 30_000)).toBe(true);
    const originalEntry = createPosJournalEntry(operation), reversal = createPosReversal(operation), reversalEntry = createPosReversalJournalEntry(originalEntry, reversal);
    const snapshot = calculatePosShiftSnapshot(shift, [{ ...operation, status: "reversed" }, reversal]);
    expect(reversalEntry.isBalanced).toBe(true);
    expect(snapshot.expectedCash).toBe(5000);
    expect(snapshot.expectedProviders["vodafone-cash"]).toBe(10000);
    expect(snapshot.profit).toBe(0);
  });
});
