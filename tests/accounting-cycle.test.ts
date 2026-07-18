import { describe, expect, it } from "vitest";
import { traceAccountingCycle } from "@/lib/accounting/cycle";
import { generateJournalEntry } from "@/rules";

const base = () => generateJournalEntry({ type: "cash-sale", amount: 1000, currency: "EGP" });

describe("accounting cycle trace", () => {
  it("keeps downstream books pending for a draft", () => {
    const trace = traceAccountingCycle({ ...base(), workflowStatus: "draft" });
    expect(trace.posted).toBe(false);
    expect(trace.stages.find((stage) => stage.id === "review")?.state).toBe("current");
    expect(trace.stages.find((stage) => stage.id === "journal")?.state).toBe("pending");
    expect(trace.stages.find((stage) => stage.id === "statements")?.state).toBe("pending");
  });

  it("completes journal, ledger, trial balance, and statements after posting", () => {
    const trace = traceAccountingCycle({ ...base(), workflowStatus: "posted" });
    expect(trace.posted).toBe(true);
    for (const id of ["journal", "ledger", "trial-balance", "statements"] as const) expect(trace.stages.find((stage) => stage.id === id)?.state).toBe("completed");
  });

  it("blocks the cycle when the entry is unbalanced", () => {
    const trace = traceAccountingCycle({ ...base(), isBalanced: false, workflowStatus: "draft" });
    expect(trace.stages.find((stage) => stage.id === "entry")?.state).toBe("blocked");
  });
});
