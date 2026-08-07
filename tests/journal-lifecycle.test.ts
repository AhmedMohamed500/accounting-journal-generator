import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { createBankDraftEntry } from "@/lib/banking/draft-entry";
import { normalizeJournalEntry } from "@/lib/accounting/journal";
import { transitionJournalEntry } from "@/lib/accounting/posting";
import { reversePostedEntry } from "@/lib/accounting/reversal";
import { validateJournalEntry } from "@/lib/accounting/validation";
import { buildTrialBalance } from "@/lib/accounting/reports";
import { generateJournalEntry } from "@/rules";
import type { BankTransaction, GeneratedJournalEntry, JournalEntrySource } from "@/types";

const prepared = (source: JournalEntrySource = "manual") => normalizeJournalEntry({ ...generateJournalEntry({ type: "cash-sale", amount: 1000, date: "2026-08-01" }), source, workflowStatus: "draft", reference: "INV-1" }, [], source);

describe("unified journal lifecycle", () => {
  it("accepts a balanced two-sided entry", () => { const result = validateJournalEntry(prepared(), defaultAccounts); expect(result.valid).toBe(true); expect(result.totalDebit).toBe(result.totalCredit); });
  it("rejects an unbalanced entry", () => { const entry = prepared(); entry.lines[0].debit = 900; const result = validateJournalEntry(entry, defaultAccounts); expect(result.valid).toBe(false); expect(result.errors.some((error) => error.code === "unbalanced")).toBe(true); });
  it("moves draft through review, approval, and posting", () => { let entry = prepared(); entry = transitionJournalEntry(entry, "review", { accounts: defaultAccounts }); entry = transitionJournalEntry(entry, "approved", { accounts: defaultAccounts }); entry = transitionJournalEntry(entry, "posted", { accounts: defaultAccounts, assertPeriodOpen: () => undefined }); expect(entry.workflowStatus).toBe("posted"); expect(entry.approvedAt).toBeTruthy(); expect(entry.postedAt).toBeTruthy(); });
  it("blocks posting in a closed period", () => { let entry = transitionJournalEntry(prepared(), "review", { accounts: defaultAccounts }); entry = transitionJournalEntry(entry, "approved", { accounts: defaultAccounts }); expect(() => transitionJournalEntry(entry, "posted", { accounts: defaultAccounts, assertPeriodOpen: () => { throw new Error("closed"); } })).toThrow("closed"); });
  it("creates a linked reversal without deleting the original effect", () => { let entry = transitionJournalEntry(prepared(), "review", { accounts: defaultAccounts }); entry = transitionJournalEntry(entry, "approved", { accounts: defaultAccounts }); entry = transitionJournalEntry(entry, "posted", { accounts: defaultAccounts }); const result = reversePostedEntry(entry, "تصحيح", defaultAccounts); expect(result.original.workflowStatus).toBe("reversed"); expect(result.original.reversalEntryId).toBe(result.reversal.id); expect(result.reversal.originalEntryId).toBe(result.original.id); expect(buildTrialBalance([result.original, result.reversal]).every((row) => row.debitBalance === 0 && row.creditBalance === 0)).toBe(true); });
  it("normalizes bank-created entries into the same model", () => { const transaction: BankTransaction = { id: "bank-1", date: "2026-08-01", description: "رسوم بنكية", reference: "B-1", debit: 50, credit: 0, currency: "EGP", status: "unmatched" }; const entry = normalizeJournalEntry(createBankDraftEntry(transaction), [], "bank-import"); expect(entry.source).toBe("bank-import"); expect(entry.workflowStatus).toBe("draft"); expect(validateJournalEntry(entry, defaultAccounts).valid).toBe(true); });
  it.each<[JournalEntrySource, string]>([["vat", "VAT"], ["natural-language-generator", "Natural language"]])("keeps %s entries in the shared model", (source) => { const entry: GeneratedJournalEntry = normalizeJournalEntry({ ...generateJournalEntry({ type: "cash-purchase", amount: 1000, vatEnabled: source === "vat", vatRate: 14 }), source, workflowStatus: "draft", reference: "SRC-1" }, [], source); expect(entry.source).toBe(source); expect(validateJournalEntry(entry, defaultAccounts).valid).toBe(true); });
});
