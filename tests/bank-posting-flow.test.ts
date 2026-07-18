import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { buildTrialBalance } from "@/lib/accounting/reports";
import { ledgerForAccount, statementRows } from "@/lib/accounting/statements";
import { createBankDraftEntry } from "@/lib/banking/draft-entry";

const transaction = { id: "bank-flow-1", date: "2026-01-11", description: "Credit Batch", reference: "R1", debit: 0, credit: 1_000, currency: "EGP", status: "unmatched" as const };

describe("bank posting flow", () => {
  it("keeps approved bank drafts out of official reports until posting", () => {
    const approved = { ...createBankDraftEntry(transaction), workflowStatus: "approved" as const };
    expect(ledgerForAccount([approved], "1110")).toHaveLength(0);
    expect(buildTrialBalance([approved])).toHaveLength(0);
    expect(statementRows([approved], defaultAccounts)).toHaveLength(0);
  });

  it("updates bank ledger, trial balance, and statements after posting", () => {
    const posted = { ...createBankDraftEntry(transaction), workflowStatus: "posted" as const };
    expect(ledgerForAccount([posted], "1110")[0]).toMatchObject({ debit: 1_000, balance: 1_000 });
    expect(buildTrialBalance([posted]).find((row) => row.accountCode === "1110")?.debitBalance).toBe(1_000);
    expect(statementRows([posted], defaultAccounts).find((row) => row.code === "1110")?.balance).toBe(1_000);
  });
});
