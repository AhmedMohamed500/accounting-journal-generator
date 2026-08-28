import { describe, expect, it } from "vitest";
import { missions } from "@/data/missions";
import { buildTrainingJournalEntry, calculateMissionAccuracy, calculateMissionScore, isMissionAnswerCorrect, resolveMissionImpact, validateTrainingJournal } from "@/lib/missions/engine";

describe("FINORA Missions engine", () => {
  it("accepts the exact correct answer and rejects partial or wrong answers", () => {
    const bank = missions.find((mission) => mission.slug === "find-bank-difference")!;
    expect(isMissionAnswerCorrect(bank, ["supplier-payment", "bank-fee"])).toBe(true);
    expect(isMissionAnswerCorrect(bank, ["bank-fee"])).toBe(false);
    expect(isMissionAnswerCorrect(bank, ["bank-fee", "customer-collection"])).toBe(false);
  });

  it("applies first, second, hinted, and viewed-solution score rules", () => {
    expect(calculateMissionScore({ correct:true, attempts:1, hintsUsed:0, viewedSolution:false })).toBe(100);
    expect(calculateMissionScore({ correct:true, attempts:2, hintsUsed:0, viewedSolution:false })).toBe(80);
    expect(calculateMissionScore({ correct:true, attempts:1, hintsUsed:2, viewedSolution:false })).toBe(70);
    expect(calculateMissionScore({ correct:true, attempts:1, hintsUsed:0, viewedSolution:true })).toBe(40);
    expect(calculateMissionScore({ correct:false, attempts:1, hintsUsed:0, viewedSolution:false })).toBe(0);
  });

  it("calculates accuracy without allowing values above 100", () => {
    expect(calculateMissionAccuracy(1, 1)).toBe(100);
    expect(calculateMissionAccuracy(1, 2)).toBe(50);
    expect(calculateMissionAccuracy(2, 1)).toBe(100);
    expect(calculateMissionAccuracy(0, 0)).toBe(0);
  });

  it("returns the consequence impact for wrong choices and correct impact for success", () => {
    const mission = missions[0];
    const wrong = resolveMissionImpact(mission, ["expense"], false), right = resolveMissionImpact(mission, ["asset"], true);
    expect(wrong.find((item) => item.key === "expenses")?.direction).toBe("up");
    expect(wrong.find((item) => item.key === "profit")?.incorrect).toBe(true);
    expect(right.find((item) => item.key === "fixedAssets")?.amount).toBe(30000);
    expect(right.find((item) => item.key === "profit")?.direction).toBe("none");
  });

  it.each(missions.filter((mission) => mission.journalEntry))("keeps $slug training journal balanced", (mission) => {
    const validation = validateTrainingJournal(mission.journalEntry!, mission.id), entry = buildTrainingJournalEntry(mission.journalEntry!, mission.id);
    expect(validation.valid).toBe(true);
    expect(validation.totalDebit).toBe(validation.totalCredit);
    expect(entry.id.startsWith("training-")).toBe(true);
    expect(entry.accountingRuleEn).toContain("not saved");
  });

  it("contains exactly three progressive hints for every mission", () => {
    expect(missions).toHaveLength(5);
    missions.forEach((mission) => expect(mission.hints.map((hint) => hint.level)).toEqual([1,2,3]));
  });
});

