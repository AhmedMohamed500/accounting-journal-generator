import { describe, expect, it } from "vitest";
import { generateJournalEntry } from "@/rules";
import { buildTrialBalance, trialBalanceTotals } from "@/lib/accounting/reports";

describe("accounting reports", () => {
  it("builds a balanced trial balance from saved entries", () => {
    const entries = [
      generateJournalEntry({ type: "cash-sale", amount: 1000, currency: "EGP" }),
      generateJournalEntry({ type: "rent-expense", amount: 200, currency: "EGP" }),
    ];
    const rows = buildTrialBalance(entries);
    const totals = trialBalanceTotals(rows);
    expect(rows.length).toBeGreaterThan(0);
    expect(totals.debit).toBe(totals.credit);
    expect(totals.debit).toBeGreaterThan(0);
  });

  it("ignores entries explicitly marked unbalanced", () => {
    const entry = generateJournalEntry({ type: "cash-sale", amount: 1000, currency: "EGP" });
    const rows = buildTrialBalance([{ ...entry, isBalanced: false }]);
    expect(rows).toEqual([]);
  });
});
