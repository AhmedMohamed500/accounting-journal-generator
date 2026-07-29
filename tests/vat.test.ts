import { describe, expect, it } from "vitest";
import { analyzeVat } from "@/lib/tax/vat";
import type { GeneratedJournalEntry } from "@/types";

const entry = (id: string, date: string, status: GeneratedJournalEntry["workflowStatus"], input = 0, output = 0): GeneratedJournalEntry => ({
  id, entryNumber: id, date, transactionType: "test", titleAr: "", titleEn: "", narrationAr: "", narrationEn: "", currency: "EGP",
  lines: [
    { id: `${id}-i`, accountCode: "1151", accountNameAr: "مدخلات", accountNameEn: "Input VAT", debit: input, credit: 0 },
    { id: `${id}-o`, accountCode: "2201", accountNameAr: "مخرجات", accountNameEn: "Output VAT", debit: 0, credit: output },
  ],
  totalDebit: input, totalCredit: output, isBalanced: true, explanationAr: [], explanationEn: [], assumptionsAr: [], assumptionsEn: [], warningsAr: [], warningsEn: [], accountingRuleAr: "", accountingRuleEn: "",
  financialStatementImpact: { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, profit: 0 }, workflowStatus: status,
});

describe("VAT periods", () => {
  it("separates approved movements from pending review", () => {
    const result = analyzeVat([entry("1", "2026-01-10", "posted", 140), entry("2", "2026-01-20", "approved", 0, 280), entry("3", "2026-01-25", "draft", 70)], 2026, "monthly");
    expect(result.inputVat).toBe(140);
    expect(result.outputVat).toBe(280);
    expect(result.netVat).toBe(140);
    expect(result.periods[0].pendingInputVat).toBe(70);
  });
});
