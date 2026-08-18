import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { buildCustomerStatement, createCustomerCollection, createCustomerInvoice } from "@/lib/parties/receivables";
import type { OpenItem, Party } from "@/types";

const customer: Party = {
  id: "customer-1", type: "customer", code: "C-0001", nameAr: "شركة الاختبار", nameEn: "Test Company",
  creditDays: 30, creditLimit: 20_000, accountCode: "112001", active: true, createdAt: "2026-08-01T00:00:00.000Z",
};

const invoiceInput = {
  invoiceNumber: "INV-100", invoiceDate: "2026-08-01", dueDate: "2026-08-31", description: "خدمات استشارية شهر أغسطس",
  netAmount: 10_000, vatRate: 14, currency: "EGP", revenueAccountCode: "4200",
};

describe("customer receivables engine", () => {
  it("creates a linked open item and a balanced draft journal entry", () => {
    const result = createCustomerInvoice(customer, invoiceInput, [], defaultAccounts);
    expect(result.item).toMatchObject({ partyId: customer.id, netAmount: 10_000, vatAmount: 1_400, amount: 11_400, paid: 0 });
    expect(result.entry).toMatchObject({ source: "customer-receivables", workflowStatus: "draft", partyId: customer.id, reference: "INV-100", isBalanced: true });
    expect(result.entry.lines.find((line) => line.accountCode === "1120")).toMatchObject({ debit: 11_400, partyId: customer.id });
    expect(result.entry.lines.find((line) => line.accountCode === "4200")?.credit).toBe(10_000);
    expect(result.entry.lines.find((line) => line.accountCode === "2201")?.credit).toBe(1_400);
  });

  it("blocks duplicate invoices and invoices for inactive customers", () => {
    const first = createCustomerInvoice(customer, invoiceInput, [], defaultAccounts);
    expect(() => createCustomerInvoice(customer, invoiceInput, [first.item], defaultAccounts)).toThrow(/مسجل سابق/);
    expect(() => createCustomerInvoice({ ...customer, active: false }, { ...invoiceInput, invoiceNumber: "INV-101" }, [], defaultAccounts)).toThrow(/موقوف/);
  });

  it("records partial collections against the invoice and links the journal", () => {
    const invoice = createCustomerInvoice(customer, invoiceInput, [], defaultAccounts).item;
    const result = createCustomerCollection(customer, invoice, { date: "2026-08-10", amount: 4_000, paymentAccountCode: "1110", reference: "TRX-1" }, defaultAccounts);
    expect(result.item).toMatchObject({ paid: 4_000, status: "partial" });
    expect(result.entry).toMatchObject({ source: "customer-receivables", workflowStatus: "draft", partyId: customer.id });
    expect(result.entry.lines.find((line) => line.accountCode === "1110")?.debit).toBe(4_000);
    expect(result.entry.lines.find((line) => line.accountCode === "1120")).toMatchObject({ credit: 4_000, partyId: customer.id });
    expect(() => createCustomerCollection(customer, invoice, { date: "2026-08-10", amount: 20_000, paymentAccountCode: "1110" }, defaultAccounts)).toThrow(/أكبر من الرصيد/);
  });

  it("builds a running customer statement from invoices and allocations", () => {
    const invoice = createCustomerInvoice(customer, invoiceInput, [], defaultAccounts).item;
    const collected = createCustomerCollection(customer, invoice, { date: "2026-08-10", amount: 4_000, paymentAccountCode: "1100" }, defaultAccounts).item;
    const rows = buildCustomerStatement(customer.id, [collected] as OpenItem[]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: "invoice", debit: 11_400, credit: 0, balance: 11_400 });
    expect(rows[1]).toMatchObject({ type: "collection", debit: 0, credit: 4_000, balance: 7_400 });
  });
});
