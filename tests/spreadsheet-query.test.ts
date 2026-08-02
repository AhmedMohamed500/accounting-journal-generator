import { describe, expect, it } from "vitest";
import { runSpreadsheetQuery } from "@/lib/spreadsheet/query";
import { bankFingerprint, parseBankSheet } from "@/lib/banking/import";

describe("dynamic spreadsheet queries", () => {
  it("filters, groups, and aggregates actual rows", () => {
    const result = runSpreadsheetQuery({ headers: ["Branch", "Type", "Amount"], rows: [["Cairo", "Sale", 100], ["Cairo", "Sale", 200], ["Giza", "Refund", 50]] }, { groupBy: "Branch", valueColumn: "Amount", aggregate: "sum", filters: [{ column: "Type", operator: "equals", value: "Sale" }] });
    expect(result.matchedRows).toBe(2);
    expect(result.rows[0]).toMatchObject({ label: "Cairo", value: 300, percentage: 100 });
  });
});

describe("bank import identity", () => {
  it("creates a stable fingerprint and keeps source metadata", () => {
    const sheet = { name: "كشف", headers: ["التاريخ", "البيان", "السحب", "الإيداع"], rows: [["02/08/2026", "رسوم بنكية", 25, null]] };
    const first = parseBankSheet(sheet, "EGP", { bankAccountId: "1110", fileName: "bank.xlsx", periodId: "2026-08" })[0];
    expect(first).toMatchObject({ date: "2026-08-02", debit: 25, periodId: "2026-08" });
    expect(first.source).toMatchObject({ fileName: "bank.xlsx", sheetName: "كشف", rowNumber: 2 });
    expect(first.fingerprint).toBe(bankFingerprint(first, "1110"));
  });
});
