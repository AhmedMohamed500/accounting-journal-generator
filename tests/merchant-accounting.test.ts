import { describe, expect, it } from "vitest";
import {
  calculateMerchantSummary,
  collectSubscription,
  createMerchantDemoData,
  customerBalance,
  inventoryQuantity,
  reverseMerchantTransaction,
  supplierBalance,
  validateMerchantBackup,
} from "@/lib/pos/merchant-accounting";
import type { MerchantCustomer, MerchantInventoryItem, MerchantSupplier, MerchantTransaction, SmallMerchant } from "@/types";

const merchant: SmallMerchant = {
  id: "merchant-1", code: "M-0001", name: "Ahmed", businessName: "Test Store", activityType: "Retail",
  phone: "01000000000", address: "Cairo", branchCount: 1, startDate: "2026-08-01", status: "active",
  packageId: "basic", subscriptionAmount: 250, subscriptionFrequency: "monthly", nextDueDate: "2026-09-01",
  collectedAmount: 0, inventoryEnabled: true, employeesEnabled: false, creditSalesEnabled: true,
  customersEnabled: true, suppliersEnabled: true, dailyReport: true, weeklyReport: true, monthlyReport: true,
  openingCash: 1000, openingBank: 500, openingWallet: 200, createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z",
};

const transaction = (overrides: Partial<MerchantTransaction> = {}): MerchantTransaction => ({
  id: crypto.randomUUID(), merchantId: merchant.id, date: "2026-08-03", transactionType: "cash-sale",
  description: "Sale", amount: 1000, costAmount: 600, paymentMethod: "cash", createdBy: "local",
  createdAt: "2026-08-03T10:00:00Z", updatedAt: "2026-08-03T10:00:00Z", status: "posted", ...overrides,
});

describe("small merchant accounting", () => {
  it("calculates cash, sales and estimated profit from posted movements", () => {
    const summary = calculateMerchantSummary(merchant, [transaction(), transaction({ transactionType: "expense", amount: 100, costAmount: undefined })]);
    expect(summary.cash).toBe(1900);
    expect(summary.sales).toBe(1000);
    expect(summary.estimatedProfit).toBe(300);
    expect(summary.missingCostData).toBe(false);
  });

  it("tracks customer and supplier balances independently", () => {
    const customer: MerchantCustomer = { id: "c", merchantId: merchant.id, name: "Customer", openingBalance: 50, active: true, createdAt: "now" };
    const supplier: MerchantSupplier = { id: "s", merchantId: merchant.id, name: "Supplier", openingBalance: 20, active: true, createdAt: "now" };
    const rows = [
      transaction({ transactionType: "credit-sale", paymentMethod: "credit", customerId: "c", amount: 500 }),
      transaction({ transactionType: "customer-collection", customerId: "c", amount: 200, costAmount: undefined }),
      transaction({ transactionType: "credit-purchase", paymentMethod: "credit", supplierId: "s", amount: 300, costAmount: undefined }),
      transaction({ transactionType: "supplier-payment", supplierId: "s", amount: 100, costAmount: undefined }),
    ];
    expect(customerBalance(customer, rows)).toBe(350);
    expect(supplierBalance(supplier, rows)).toBe(220);
  });

  it("updates simplified inventory from purchases and sales", () => {
    const item: MerchantInventoryItem = { id: "i", merchantId: merchant.id, code: "I-1", name: "Item", category: "General", unit: "unit", openingQuantity: 10, unitCost: 5, sellingPrice: 8, reorderLevel: 2, active: true, createdAt: "now" };
    const rows = [transaction({ transactionType: "cash-purchase", inventoryItemId: "i", quantity: 5 }), transaction({ inventoryItemId: "i", quantity: 3 })];
    expect(inventoryQuantity(item, rows)).toBe(12);
  });

  it("fully cancels an operation through a linked reversal", () => {
    const sale = transaction();
    const reversal = reverseMerchantTransaction(sale, "input error");
    const summary = calculateMerchantSummary(merchant, [sale, reversal]);
    expect(summary.cash).toBe(merchant.openingCash);
    expect(summary.sales).toBe(0);
    expect(summary.estimatedProfit).toBe(0);
    expect(reversal.originalTransactionId).toBe(sale.id);
  });

  it("caps a local subscription collection at the remaining due", () => {
    const subscription = { id: "sub", merchantId: merchant.id, packageId: "basic", startDate: "2026-08-01", frequency: "monthly" as const, amount: 250, due: 250, collected: 200, nextDueDate: "2026-09-01", status: "partial" as const, collections: [] };
    const updated = collectSubscription(subscription, { date: "2026-08-03", amount: 100, method: "cash", collectedBy: "admin" });
    expect(updated.collected).toBe(250);
    expect(updated.collections[0].amount).toBe(50);
    expect(updated.status).toBe("active");
  });

  it("ships isolated valid demo data for a store", () => {
    const demo = createMerchantDemoData("store-a");
    expect(validateMerchantBackup(demo)).toBe(true);
    expect(demo.storeId).toBe("store-a");
    expect(demo.merchants.length).toBeGreaterThanOrEqual(8);
    expect(demo.merchants.every((item) => item.isDemo)).toBe(true);
  });
});
