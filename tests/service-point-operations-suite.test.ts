import { describe, expect, it } from "vitest";
import { posProviders } from "@/data/pos";
import { calculatePosOperation, calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { buildExceptionCenter, buildShiftTimeline, cashierAccountability, checklistProgress, createServicePointMovement, createServicePointMovementEntry, dailyOwnerPack, monthlyBudgetStatus, providerStatement, reconciliationRows } from "@/lib/pos/operations-suite";
import { emptyServicePointOperationsData } from "@/lib/storage/service-point-operations";
import type { PosShift } from "@/types";

const shift: PosShift = { id: "s1", storeName: "Test", cashierName: "Ahmed", businessDate: "2026-10-01", openedAt: "2026-10-01T08:00:00Z", status: "open", openingCash: 1000, providers: posProviders.map((item) => ({ providerId: item.id, openingBalance: item.id === "fawry" ? 500 : 0 })) };

describe("service point operations suite", () => {
  it("posts owner capital without inflating sales or profit", () => {
    const movement = createServicePointMovement({ shiftId: shift.id, businessDate: shift.businessDate, type: "capital-in", direction: "in", balanceId: "cash", amount: 250, authorizedBy: "Owner" });
    const snapshot = calculatePosShiftSnapshot(shift, [], undefined, undefined, [movement]), entry = createServicePointMovementEntry(movement);
    expect(snapshot.expectedCash).toBe(1250); expect(snapshot.operationCount).toBe(0); expect(snapshot.profit).toBe(0);
    expect(entry.isBalanced).toBe(true); expect(entry.financialStatementImpact.equity).toBe(250); expect(entry.financialStatementImpact.revenue).toBe(0);
  });

  it("supports provider owner funding and documented manager decreases", () => {
    const providerFunding = createServicePointMovement({ shiftId: shift.id, businessDate: shift.businessDate, type: "capital-in", direction: "in", balanceId: "fawry", amount: 100, authorizedBy: "Owner" });
    const adjustment = createServicePointMovement({ shiftId: shift.id, businessDate: shift.businessDate, type: "manager-adjustment", direction: "out", balanceId: "cash", amount: 20, authorizedBy: "Manager" });
    const snapshot = calculatePosShiftSnapshot(shift, [], undefined, undefined, [providerFunding, adjustment]);
    expect(snapshot.expectedProviders.fawry).toBe(600); expect(snapshot.expectedCash).toBe(980); expect(createServicePointMovementEntry(adjustment).isBalanced).toBe(true);
  });

  it("tracks budgets from categorized effective expenses", () => {
    const expense = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "store-expense", amount: 300, customerFee: 0, providerCost: 0, expenseCategoryId: "rent" });
    const data = emptyServicePointOperationsData(), rows = monthlyBudgetStatus([expense], [{ id: "b", month: "2026-10", categoryId: "rent", amount: 1000, updatedAt: "x" }], data.expenseCategories, "2026-10");
    expect(rows.find((item) => item.category.id === "rent")).toMatchObject({ actual: 300, remaining: 700, usage: 30 });
  });

  it("tracks checklist completion, incidents, exceptions, and timeline", () => {
    const data = emptyServicePointOperationsData(), first = data.checklistItems.find((item) => item.phase === "opening")!;
    data.checklistCompletions.push({ shiftId: shift.id, itemId: first.id, completedAt: "2026-10-01T08:01:00Z", completedBy: "Ahmed" });
    data.incidents.push({ id: "i1", shiftId: shift.id, businessDate: shift.businessDate, at: "2026-10-01T09:00:00Z", category: "device", severity: "high", title: "Printer", details: "Offline", reportedBy: "Ahmed", status: "open" });
    expect(checklistProgress(data, shift.id, "opening").done).toBe(1);
    expect(buildExceptionCenter([shift], [], data).some((item) => item.source === "incident")).toBe(true);
    expect(buildShiftTimeline(shift, [], data, []).map((item) => item.kind)).toContain("incident");
  });

  it("builds provider statement, reconciliation, owner pack, and factual cashier metrics", () => {
    const operation = calculatePosOperation({ shiftId: shift.id, businessDate: shift.businessDate, type: "send-transfer", providerId: "fawry", amount: 100, customerFee: 5, providerCost: 1, reference: "F-1" });
    const data = emptyServicePointOperationsData(), statement = providerStatement("fawry", [shift], [operation], []), pack = dailyOwnerPack(shift.businessDate, [shift], [operation], data);
    expect(statement.closing).toBe(399); expect(pack).toMatchObject({ operations: 1, volume: 100, fees: 5, providerCosts: 1, profit: 4 });
    expect(reconciliationRows(shift, [operation], [])[0].expected).toBe(1105);
    expect(cashierAccountability([shift], [operation], [])[0]).toMatchObject({ successful: 1, pending: 0, failed: 0 });
  });
});
