// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DETECTIVE_STORAGE_KEY, loadDetectiveProgress, recordDetectiveResult, saveDetectiveDraft } from "@/lib/storage/detective";

describe("FINORA Accounting Detective progress and isolation", () => {
  beforeEach(() => localStorage.clear());

  it("saves notebook and investigation state only in the training key", () => {
    saveDetectiveDraft("detective-d001", { openedEvidence: ["d001-fee"], importantEvidence: ["d001-fee"], excludedEvidence: ["d001-transfer"], evidenceLinks: [["d001-fee", "d001-supplier"]], notes: ["Bank movement is unposted."], hintsUsed: 1 });
    const record = loadDetectiveProgress().records["detective-d001"];
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe(DETECTIVE_STORAGE_KEY);
    expect(record.openedEvidence).toEqual(["d001-fee"]);
    expect(record.evidenceLinks).toEqual([["d001-fee", "d001-supplier"]]);
    expect(record.notes).toHaveLength(1);
  });

  it("keeps best case score and advances each case skill", () => {
    const makeResult = (score: number) => ({ caseId: "detective-d001", score, accuracy: 100, relevantEvidenceFound: 2, hintsUsed: 0, attempts: 1, elapsedSeconds: 100, completedAt: "2026-08-29T10:00:00.000Z" });
    recordDetectiveResult(makeResult(900), ["bank-reconciliation", "error-detection"]);
    const progress = recordDetectiveResult(makeResult(700), ["bank-reconciliation", "error-detection"]);
    expect(progress.records["detective-d001"].bestScore).toBe(900);
    expect(progress.records["detective-d001"].completions).toBe(2);
    expect(progress.skills["bank-reconciliation"]).toBeGreaterThan(0);
    expect(progress.skills["error-detection"]).toBeGreaterThan(0);
  });

  it("never modifies real journals, customers, banks, reports, or workspace storage", () => {
    const protectedKeys = ["saved-accounting-entries:company:branch:year", "finora-parties-v1", "finora-bank-reconciliation-v1", "finora-reports-v1", "finora-workspaces-v1"];
    protectedKeys.forEach((key) => localStorage.setItem(key, `sentinel:${key}`));
    saveDetectiveDraft("detective-d002", { notes: ["Training note"] });
    recordDetectiveResult({ caseId: "detective-d002", score: 1000, accuracy: 100, relevantEvidenceFound: 4, hintsUsed: 0, attempts: 1, elapsedSeconds: 90, completedAt: "2026-08-29T10:00:00.000Z" }, ["customer-accounts"]);
    protectedKeys.forEach((key) => expect(localStorage.getItem(key)).toBe(`sentinel:${key}`));
    expect(localStorage.getItem(DETECTIVE_STORAGE_KEY)).toBeTruthy();
  });

  it("uses a Detective-only key distinct from Missions and the accounting workspace", () => {
    expect(DETECTIVE_STORAGE_KEY).toBe("finora-training-detective-v1");
    expect(DETECTIVE_STORAGE_KEY).not.toBe("finora-training-missions-v1");
    expect(DETECTIVE_STORAGE_KEY).not.toBe("accountant-workspace");
  });
});
