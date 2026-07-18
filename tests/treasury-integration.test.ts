import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { totalTreasuryBalance, treasuryBalances } from "@/lib/accounting/treasury";
import { generateJournalEntry } from "@/rules";
import { parseTransaction } from "@/lib/parser";

const posted = <T extends ReturnType<typeof generateJournalEntry>>(entry: T) => ({ ...entry, workflowStatus: "posted" as const });

describe("cash and bank integration", () => {
  it("posts cash and bank sales to the selected treasury account", () => {
    const cash = posted(generateJournalEntry({ type: "cash-sale", amount: 1000, paymentMethod: "cash" })), bank = posted(generateJournalEntry({ type: "cash-sale", amount: 2000, paymentMethod: "bank" }));
    const balances = treasuryBalances([cash, bank], defaultAccounts);
    expect(balances.find((item) => item.account.code === "1100")?.balance).toBe(1000);
    expect(balances.find((item) => item.account.code === "1110")?.balance).toBe(2000);
  });

  it("reflects purchases, maintenance, collections, and supplier payments", () => {
    const entries = [
      posted(generateJournalEntry({ type: "capital-contribution", amount: 10000, paymentMethod: "bank" })),
      posted(generateJournalEntry({ type: "cash-purchase", amount: 2000, paymentMethod: "bank" })),
      posted(generateJournalEntry({ type: "maintenance-expense", amount: 500, paymentMethod: "cash" })),
      posted(generateJournalEntry({ type: "customer-collection", amount: 1000, paymentMethod: "bank" })),
      posted(generateJournalEntry({ type: "supplier-payment", amount: 1500, paymentMethod: "bank" })),
    ];
    expect(totalTreasuryBalance(entries, defaultAccounts)).toBe(7000);
    expect(entries[1].lines.find((line) => line.accountCode === "1110")?.credit).toBe(2000);
    expect(entries[2].lines.find((line) => line.accountCode === "5130")?.debit).toBe(500);
  });

  it("keeps credit sales and credit purchases outside treasury until settlement", () => {
    const sale = posted(generateJournalEntry({ type: "credit-sale", amount: 1000, paymentMethod: "credit" })), purchase = posted(generateJournalEntry({ type: "credit-purchase", amount: 600, paymentMethod: "credit" }));
    expect(totalTreasuryBalance([sale, purchase], defaultAccounts)).toBe(0);
    expect(sale.lines.find((line) => line.accountCode === "1120")?.debit).toBe(1000);
    expect(purchase.lines.find((line) => line.accountCode === "2100")?.credit).toBe(600);
  });

  it("understands a maintenance payment from the bank", () => {
    const parsed = parseTransaction("دفعت مصروف صيانة 2000 جنيه من البنك");
    expect(parsed.input).toMatchObject({ type: "maintenance-expense", amount: 2000, paymentMethod: "bank" });
    const entry = generateJournalEntry(parsed.input as Parameters<typeof generateJournalEntry>[0]);
    expect(entry.lines.find((line) => line.accountCode === "5130")?.debit).toBe(2000);
    expect(entry.lines.find((line) => line.accountCode === "1110")?.credit).toBe(2000);
  });
});
