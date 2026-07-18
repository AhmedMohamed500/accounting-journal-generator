import { describe, expect, it } from "vitest";
import { buildCashflowPlan } from "@/lib/parties/cashflow";
import type { OpenItem, Party } from "@/types";

const parties = [{ id: "c", type: "customer", nameAr: "عميل", nameEn: "Customer" }, { id: "s", type: "supplier", nameAr: "مورد", nameEn: "Supplier" }] as Party[];
const item = (id: string, partyId: string, kind: OpenItem["kind"], dueDate: string, amount: number): OpenItem => ({ id, partyId, kind, invoiceNumber: id, invoiceDate: "2026-07-01", dueDate, currency: "EGP", amount, paid: 0, status: "open", createdAt: "2026-07-01T00:00:00.000Z" });

describe("daily collections and cashflow plan", () => {
  it("projects liquidity and identifies a shortfall", () => {
    const plan = buildCashflowPlan(parties, [item("R1", "c", "receivable", "2026-07-14", 300), item("P1", "s", "payable", "2026-07-15", 1000)], "2026-07-13", 200);
    expect(plan).toMatchObject({ receipts7: 300, payments7: 1000, projected7: -500, shortfall7: 500 });
    expect(plan.collectionSuggestions[0].item.invoiceNumber).toBe("R1");
  });

  it("separates overdue and due-today receipts and payments", () => {
    const plan = buildCashflowPlan(parties, [item("R1", "c", "receivable", "2026-07-01", 600), item("R2", "c", "receivable", "2026-07-13", 200), item("P1", "s", "payable", "2026-07-01", 400)], "2026-07-13", 1000);
    expect(plan).toMatchObject({ overdueReceipts: 600, overduePayments: 400, dueTodayReceipts: 200, dueTodayPayments: 0 });
  });
});
