import { describe, expect, it } from "vitest";
import { buildPartyProfile, normalizeWhatsappPhone, whatsappChatUrl } from "@/lib/parties/profile";
import type { BusinessDocument, OpenItem, Party } from "@/types";

const party: Party = { id: "p1", type: "supplier", code: "S-1", nameAr: "مورد الاختبار", nameEn: "Test supplier", phone: "01012345678", creditDays: 30, creditLimit: 1000, accountCode: "2101", active: true, createdAt: "2026-01-01T00:00:00.000Z" };
const items: OpenItem[] = [
  { id: "i1", partyId: "p1", kind: "payable", invoiceNumber: "INV-1", invoiceDate: "2026-05-01", dueDate: "2026-05-31", currency: "EGP", amount: 1000, paid: 400, status: "partial", createdAt: "2026-05-01T00:00:00.000Z" },
  { id: "i2", partyId: "p1", kind: "payable", invoiceNumber: "INV-2", invoiceDate: "2026-07-01", dueDate: "2026-07-31", currency: "EGP", amount: 500, paid: 0, status: "open", createdAt: "2026-07-01T00:00:00.000Z" },
];
const documents: BusinessDocument[] = [
  { id: "d1", number: "PI-1", type: "purchase-invoice", status: "posted", date: "2026-07-01", partyId: "p1", currency: "EGP", lines: [], subtotal: 500, discountTotal: 0, netTotal: 500, vatTotal: 0, grandTotal: 500, createdAt: "2026-07-01T00:00:00.000Z" },
  { id: "d2", number: "PR-1", type: "purchase-return", status: "posted", date: "2026-07-02", partyId: "p1", currency: "EGP", lines: [], subtotal: 100, discountTotal: 0, netTotal: 100, vatTotal: 0, grandTotal: 100, createdAt: "2026-07-02T00:00:00.000Z" },
];

describe("party 360 profile", () => {
  it("summarizes balances, overdue invoices, credit usage, and business volume", () => {
    const profile = buildPartyProfile(party, items, documents, "2026-07-13");
    expect(profile).toMatchObject({ invoiced: 1500, paid: 400, outstanding: 1100, overdue: 600, overdueCount: 1, netBusinessVolume: 400, nextDueDate: "2026-07-31", creditUtilization: 110 });
  });

  it("creates a WhatsApp Web click-to-chat URL for an Egyptian mobile", () => {
    expect(normalizeWhatsappPhone("010 1234 5678")).toBe("201012345678");
    expect(whatsappChatUrl("01012345678", "كشف حساب")).toBe("https://wa.me/201012345678?text=%D9%83%D8%B4%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8");
  });
});
