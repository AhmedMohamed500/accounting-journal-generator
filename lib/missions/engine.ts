import { validateJournalEntry } from "@/lib/accounting/validation";
import type { GeneratedJournalEntry, MissionDefinition, MissionImpactItem, MissionJournalEntry } from "@/types";

export interface MissionScoreInput { correct: boolean; attempts: number; hintsUsed: number; viewedSolution: boolean }

export function isMissionAnswerCorrect(mission: MissionDefinition, answerIds: string[]) {
  const expected = [...mission.correctAnswerIds].sort(), actual = [...new Set(answerIds)].sort();
  return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
}

export function calculateMissionScore({ correct, attempts, hintsUsed, viewedSolution }: MissionScoreInput) {
  if (!correct) return 0;
  if (viewedSolution) return 40;
  const attemptScore = attempts <= 1 ? 100 : attempts === 2 ? 80 : 60;
  const hintPenalty = hintsUsed === 0 ? 0 : hintsUsed === 1 ? 20 : hintsUsed === 2 ? 30 : 40;
  return Math.max(40, attemptScore - hintPenalty);
}

export function calculateMissionAccuracy(correctDecisions: number, attempts: number) {
  if (attempts <= 0) return 0;
  return Math.round(Math.min(1, correctDecisions / attempts) * 100);
}

export function resolveMissionImpact(mission: MissionDefinition, answerIds: string[], correct: boolean): MissionImpactItem[] {
  if (correct) return mission.correctImpact;
  return answerIds.flatMap((answerId) => mission.choices?.find((choice) => choice.id === answerId)?.consequence.impacts || []);
}

export function missionFeedback(mission: MissionDefinition, answerIds: string[], correct: boolean, locale: "ar" | "en") {
  if (correct) return locale === "ar" ? mission.correctFeedbackAr : mission.correctFeedbackEn;
  const choice = mission.choices?.find((item) => item.id === answerIds[0]);
  return choice ? (locale === "ar" ? choice.consequence.explanationAr : choice.consequence.explanationEn) : (locale === "ar" ? "راجع الفرق وحاول مرة أخرى." : "Review the difference and try again.");
}

export function missionReflection(mission: MissionDefinition, answerIds: string[], locale: "ar" | "en") {
  const choice = mission.choices?.find((item) => item.id === answerIds[0]);
  return choice ? (locale === "ar" ? choice.consequence.reflectionAr : choice.consequence.reflectionEn) : (locale === "ar" ? "اجعل إجمالي المدين مساويًا لإجمالي الدائن." : "Make total debit equal total credit.");
}

export function buildTrainingJournalEntry(entry: MissionJournalEntry, missionId = "training"): GeneratedJournalEntry {
  const lines = entry.lines.map((line, index) => ({ id: `${missionId}-line-${index + 1}`, ...line }));
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0), totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  return {
    id: `training-${missionId}`, entryNumber: `TRAIN-${missionId}`, date: "2026-01-01", transactionType: "training-mission",
    titleAr: "قيد تدريبي", titleEn: "Training entry", narrationAr: entry.narrationAr, narrationEn: entry.narrationEn,
    currency: "EGP", lines, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < .01,
    explanationAr: [], explanationEn: [], assumptionsAr: [], assumptionsEn: [], warningsAr: [], warningsEn: [],
    accountingRuleAr: "تدريب فقط — لا يُحفظ في قيود الشركة", accountingRuleEn: "Training only — not saved to company entries",
    financialStatementImpact: { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, profit: 0 }, source: "manual", workflowStatus: "draft",
  };
}

export function validateTrainingJournal(entry: MissionJournalEntry, missionId?: string) {
  return validateJournalEntry(buildTrainingJournalEntry(entry, missionId));
}

