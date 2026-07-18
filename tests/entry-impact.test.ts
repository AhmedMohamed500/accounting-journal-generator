import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { analyzeEntryImpact } from "@/lib/accounting/impact";
import { issueCustody, settleCustody } from "@/lib/custody/settlement";
import { generateJournalEntry } from "@/rules";

describe("accounting entry impact engine", () => {
  it("maps a cash sale to assets, revenue, profit, and equity", () => {
    const entry = generateJournalEntry({ type: "cash-sale", amount: 1000, currency: "EGP" }), impact = analyzeEntryImpact(entry, defaultAccounts);
    expect(impact).toMatchObject({ assets: 1000, revenue: 1000, profit: 1000, totalEquity: 1000, cash: 1000, balancedEffect: true });
    expect(impact.lines.find((line) => line.code === "4100")?.section).toBe("operating-revenue");
  });

  it("maps a credit purchase to inventory and current liabilities", () => {
    const entry = generateJournalEntry({ type: "credit-purchase", amount: 1000, currency: "EGP", paymentMethod: "credit" }), impact = analyzeEntryImpact(entry, defaultAccounts);
    expect(impact).toMatchObject({ assets: 1000, liabilities: 1000, profit: 0, balancedEffect: true });
    expect(impact.lines.find((line) => line.code === "2100")?.section).toBe("current-liabilities");
  });

  it("explains custody issue as an asset reclassification", () => {
    const issued = issueCustody({ employee: "أحمد", purpose: "مشتريات", issueDate: "2026-07-13", amount: 1000, currency: "EGP", paymentAccountId: "cash" }, defaultAccounts), impact = analyzeEntryImpact(issued.entry, defaultAccounts);
    expect(impact).toMatchObject({ assets: 0, profit: 0, totalEquity: 0, cash: -1000, balancedEffect: true });
  });

  it("shows the exact profit and balance-sheet effect of custody settlement", () => {
    const issued = issueCustody({ employee: "أحمد", purpose: "أقلام", issueDate: "2026-07-13", amount: 1000, currency: "EGP", paymentAccountId: "cash" }, defaultAccounts);
    const settled = settleCustody(issued.custody, { date: "2026-07-14", description: "أقلام", expenseAccountId: "office-supplies", netAmount: 800, vatAmount: 0, returnedAmount: 200 }, defaultAccounts), impact = analyzeEntryImpact(settled.entry, defaultAccounts);
    expect(impact).toMatchObject({ assets: -800, expenses: 800, profit: -800, totalEquity: -800, cash: 200, balancedEffect: true });
    expect(impact.lines.find((line) => line.code === "5120")?.section).toBe("operating-expenses");
  });
});
