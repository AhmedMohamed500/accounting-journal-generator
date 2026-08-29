import { describe, expect, it } from "vitest";
import { detectiveCases } from "@/data/detective/cases";
import { buildDetectiveTrainingEntries, calculateDetectiveScore, calculateEvidenceAccuracy, isCorrectConclusion, isCorrectEvidence, nextDetectiveHint, resolveInvestigation, validateDetectiveCase } from "@/lib/detective/engine";

describe("FINORA Accounting Detective engine", () => {
  it("validates all five case definitions and balanced training treatments", () => {
    expect(detectiveCases).toHaveLength(5);
    detectiveCases.forEach((caseDefinition) => {
      expect(validateDetectiveCase(caseDefinition)).toEqual({ valid: true, treatmentBalanced: true });
      expect(caseDefinition.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
    });
  });

  it("keeps every case and evidence item bilingual", () => {
    detectiveCases.forEach((caseDefinition) => {
      expect(caseDefinition.titleAr.trim()).not.toBe("");
      expect(caseDefinition.titleEn.trim()).not.toBe("");
      expect(caseDefinition.briefAr.trim()).not.toBe("");
      expect(caseDefinition.briefEn.trim()).not.toBe("");
      caseDefinition.evidence.forEach((item) => {
        expect(item.titleAr.trim()).not.toBe("");
        expect(item.titleEn.trim()).not.toBe("");
        expect(item.contentAr.trim()).not.toBe("");
        expect(item.contentEn.trim()).not.toBe("");
      });
    });
  });

  it("accepts exact relevant evidence and rejects partial or distracting evidence", () => {
    const caseDefinition = detectiveCases[0];
    expect(isCorrectEvidence(caseDefinition, ["d001-supplier", "d001-fee"])).toBe(true);
    expect(isCorrectEvidence(caseDefinition, ["d001-fee"])).toBe(false);
    expect(isCorrectEvidence(caseDefinition, ["d001-fee", "d001-collection"])).toBe(false);
    expect(calculateEvidenceAccuracy(caseDefinition, ["d001-fee", "d001-supplier"])).toBe(100);
    expect(calculateEvidenceAccuracy(caseDefinition, ["d001-fee", "d001-collection"])).toBe(33);
  });

  it("requires both correct conclusion and exact evidence before solving", () => {
    const caseDefinition = detectiveCases[1];
    expect(isCorrectConclusion(caseDefinition, "unposted-collection")).toBe(true);
    expect(resolveInvestigation(caseDefinition, caseDefinition.correctEvidence, "unposted-collection").solved).toBe(true);
    expect(resolveInvestigation(caseDefinition, caseDefinition.correctEvidence, "bank-delay")).toEqual({ solved: false, evidenceCorrect: true, conclusionCorrect: false });
    expect(resolveInvestigation(caseDefinition, ["d002-bank"], "unposted-collection").solved).toBe(false);
  });

  it("reveals progressive hints without exceeding the final hint", () => {
    const caseDefinition = detectiveCases[0];
    expect(nextDetectiveHint(caseDefinition, 0).level).toBe(1);
    expect(nextDetectiveHint(caseDefinition, 1).level).toBe(2);
    expect(nextDetectiveHint(caseDefinition, 2).level).toBe(3);
    expect(nextDetectiveHint(caseDefinition, 9).level).toBe(3);
  });

  it("calculates a maximum first-pass score and applies hint, attempt, and efficiency costs", () => {
    const caseDefinition = detectiveCases[0], perfect = calculateDetectiveScore({ caseDefinition, selectedEvidence: caseDefinition.correctEvidence, openedEvidence: caseDefinition.correctEvidence, conclusionId: caseDefinition.correctConclusion, hintsUsed: 0, attempts: 1, elapsedSeconds: 120 });
    const assisted = calculateDetectiveScore({ caseDefinition, selectedEvidence: caseDefinition.correctEvidence, openedEvidence: caseDefinition.evidence.map((item) => item.id), conclusionId: caseDefinition.correctConclusion, hintsUsed: 2, attempts: 3, elapsedSeconds: 1000 });
    expect(perfect).toBe(1000);
    expect(assisted).toBeLessThan(perfect);
    expect(calculateDetectiveScore({ caseDefinition, selectedEvidence: ["d001-fee"], openedEvidence: ["d001-fee"], conclusionId: caseDefinition.correctConclusion, hintsUsed: 0, attempts: 1, elapsedSeconds: 20 })).toBe(0);
  });

  it("builds sandbox-only entries without a company journal adapter", () => {
    detectiveCases.forEach((caseDefinition) => buildDetectiveTrainingEntries(caseDefinition).forEach((entry) => {
      expect(entry.id).toMatch(/^training-detective-/);
      expect(entry.sandbox).toBe(true);
      expect(entry.source).toBe("finora-accounting-detective");
      expect(entry.lines.reduce((sum, line) => sum + line.debit, 0)).toBe(entry.lines.reduce((sum, line) => sum + line.credit, 0));
    }));
  });
});
