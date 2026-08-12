import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { accountingRowToJournalEntry, analyzeAccountingSheet, detectAccountingMapping } from "@/lib/spreadsheet/accounting-intelligence";
import { validateJournalEntry } from "@/lib/accounting/validation";
import type { SheetData } from "@/types";

const sheet: SheetData = { name: "الحركات", headers: ["التاريخ", "البيان", "المبلغ", "المرجع"], rows: [
  ["2026-08-01", "مصروف أدوات مكتبية", 500, "EXP-1"],
  ["2026-08-02", "رسوم وعمولات بنكية", 75, "BNK-1"],
  ["2026-08-03", "تحصيل إيراد خدمات من عميل", 2500, "REV-1"],
  ["2026-08-04", "دفع رواتب شهر أغسطس", 4000, "PAY-1"],
] };

describe("accounting spreadsheet intelligence", () => {
  it("detects common Arabic accounting columns", () => expect(detectAccountingMapping(sheet.headers)).toMatchObject({ date: "التاريخ", description: "البيان", amount: "المبلغ", reference: "المرجع" }));
  it("classifies administrative and bank expenses", () => { const result = analyzeAccountingSheet(sheet, defaultAccounts); expect(result.rows[0]).toMatchObject({ category: "administrative-expense", accountCode: "5190", direction: "out" }); expect(result.rows[1]).toMatchObject({ category: "bank-expense", accountCode: "5600", direction: "out" }); });
  it("classifies revenue as inflow and payroll as outflow", () => { const result = analyzeAccountingSheet(sheet, defaultAccounts); expect(result.rows[2]).toMatchObject({ category: "revenue", direction: "in", amount: 2500 }); expect(result.rows[3]).toMatchObject({ category: "payroll", direction: "out", accountCode: "5200" }); expect(result.summary).toMatchObject({ totalIn: 2500, totalOut: 4575, netCashFlow: -2075 }); });
  it("supports separate debit and credit bank-style columns", () => { const result = analyzeAccountingSheet({ name: "Bank", headers: ["Date", "Description", "Debit", "Credit"], rows: [["2026-08-05", "Bank fee", 20, 0], ["2026-08-06", "Service revenue", 0, 800]] }, defaultAccounts); expect(result.rows.map((row) => row.direction)).toEqual(["out", "in"]); expect(result.summary.totalIn).toBe(800); });
  it("allows manual mapping for arbitrary headers", () => { const result = analyzeAccountingSheet({ name: "Custom", headers: ["A", "B", "C"], rows: [["2026-08-07", "Rent", 1000]] }, defaultAccounts, { date: "A", description: "B", amount: "C" }); expect(result.rows[0]).toMatchObject({ category: "rent", accountCode: "5100" }); });
  it("creates a balanced draft in the unified journal model", () => { const row = analyzeAccountingSheet(sheet, defaultAccounts).rows[0], entry = accountingRowToJournalEntry(row, defaultAccounts, [], sheet.name); expect(entry).toMatchObject({ workflowStatus: "draft", source: "spreadsheet-import", isBalanced: true, totalDebit: 500, totalCredit: 500 }); expect(validateJournalEntry(entry, defaultAccounts).valid).toBe(true); });
  it("keeps unrecognized rows under review instead of guessing", () => { const result = analyzeAccountingSheet({ name: "Unknown", headers: ["Description", "Amount"], rows: [["عملية غير مفهومة 123", 100]] }, defaultAccounts); expect(result.rows[0]).toMatchObject({ category: "unclassified" }); expect(result.rows[0].warnings).toContain("unclassified"); expect(result.summary.needsReview).toBe(1); });
  it("flags transfers that need a second distinct account", () => { const result = analyzeAccountingSheet({ name: "Transfers", headers: ["Description", "Amount"], rows: [["Transfer between bank accounts", 1000]] }, defaultAccounts); expect(result.rows[0]).toMatchObject({ category: "transfer", accountCode: "1110", counterAccountCode: "1110" }); expect(result.rows[0].warnings).toContain("same-account"); });
});
