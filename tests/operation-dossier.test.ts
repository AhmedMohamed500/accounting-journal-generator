import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { buildOperationDossier } from "@/lib/accounting/operation-dossier";
import { issueCustody } from "@/lib/custody/settlement";
import { generateJournalEntry } from "@/rules";

describe("comprehensive accounting operation dossier", () => {
  it("shows balances before, movement, projected balance, and official balance", () => {
    const previous = { ...generateJournalEntry({ type: "cash-sale", amount: 500, date: "2026-07-12" }), workflowStatus: "posted" as const };
    const target = { ...generateJournalEntry({ type: "cash-sale", amount: 1000, date: "2026-07-13" }), workflowStatus: "posted" as const };
    const dossier = buildOperationDossier({ entry: target, entries: [previous, target], accounts: defaultAccounts });
    const cash = dossier.balances.find((balance) => balance.code === "1100");
    const sales = dossier.balances.find((balance) => balance.code === "4100");

    expect(cash).toMatchObject({ before: 500, movement: 1000, afterPosting: 1500, officialAfter: 1500, posted: true });
    expect(sales).toMatchObject({ before: 500, movement: 1000, afterPosting: 1500, officialAfter: 1500, posted: true });
  });

  it("keeps a draft movement projected until posting", () => {
    const previous = { ...generateJournalEntry({ type: "cash-sale", amount: 500, date: "2026-07-12" }), workflowStatus: "posted" as const };
    const target = { ...generateJournalEntry({ type: "cash-sale", amount: 1000, date: "2026-07-13" }), workflowStatus: "draft" as const };
    const cash = buildOperationDossier({ entry: target, entries: [previous, target], accounts: defaultAccounts }).balances.find((balance) => balance.code === "1100");

    expect(cash).toMatchObject({ before: 500, movement: 1000, afterPosting: 1500, officialAfter: 500, posted: false });
  });

  it("links a custody entry to its employee and custody reference", () => {
    const issued = issueCustody({ employee: "أحمد محمد", purpose: "شراء أدوات مكتبية", issueDate: "2026-07-13", amount: 1000, currency: "EGP", paymentAccountId: "cash" }, defaultAccounts);
    const dossier = buildOperationDossier({ entry: issued.entry, entries: [issued.entry], accounts: defaultAccounts, custodies: [issued.custody] });

    expect(dossier.source).toMatchObject({ kind: "custody", reference: issued.custody.number, partyAr: "أحمد محمد", amount: 1000 });
    expect(dossier.linkedCustodyId).toBe(issued.custody.id);
  });
});
