import { beforeEach, describe, expect, it } from "vitest";
import { createPosJournalEntry, calculatePosOperation } from "@/lib/pos/engine";
import { createPosStore, loadPosEntries, loadPosOperations, savePosEntry, savePosOperation } from "@/lib/storage/pos";

describe("service point store isolation", () => {
  beforeEach(() => localStorage.clear());

  it("keeps every store's operations and entries in a separate ledger", () => {
    const first = createPosStore("المحل الأول"), second = createPosStore("المحل الثاني");
    const operation = calculatePosOperation({ shiftId: "shift-1", businessDate: "2026-07-15", type: "send-transfer", providerId: "vodafone-cash", amount: 500, customerFee: 10, providerCost: 2 });
    const entry = createPosJournalEntry(operation);
    savePosOperation(first.id, operation);
    savePosEntry(first.id, entry);
    expect(loadPosOperations(first.id)).toHaveLength(1);
    expect(loadPosEntries(first.id)).toHaveLength(1);
    expect(loadPosOperations(second.id)).toHaveLength(0);
    expect(loadPosEntries(second.id)).toHaveLength(0);
  });
});
