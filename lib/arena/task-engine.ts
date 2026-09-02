import { createTrainingAccountSnapshot, validateArenaJournal } from "@/lib/arena/account-adapter";
import type { ArenaProfile, ArenaTaskDefinition, ArenaTaskLine, HiringReadiness, TaskScoreDimensions } from "@/types";

const sameLine = (answer: ArenaTaskLine, expected: ArenaTaskLine) => answer.accountCode === expected.accountCode && answer.side === expected.side;

export function scoreArenaTask(task: ArenaTaskDefinition, answer: ArenaTaskLine[], hintsUsed: number, elapsedSeconds: number, recovered = false): TaskScoreDimensions {
  const validation = validateArenaJournal(answer);
  const matched = task.expectedLines.filter((expected) => answer.some((line) => sameLine(line, expected)));
  const exact = task.expectedLines.filter((expected) => answer.some((line) => sameLine(line, expected) && line.amount === expected.amount));
  const accountSelection = Math.round(matched.length / task.expectedLines.length * 100);
  const debitCreditAccuracy = accountSelection;
  const amountAccuracy = Math.round(exact.length / task.expectedLines.length * 100);
  const accountingAccuracy = validation.valid && exact.length === task.expectedLines.length ? 100 : Math.round((accountSelection + amountAccuracy) / 2);
  const efficiency = Math.max(40, Math.min(100, Math.round(task.estimatedMinutes * 60 / Math.max(1, elapsedSeconds) * 100)));
  const errorDetection = recovered ? 100 : validation.valid ? 80 : 20;
  const recovery = recovered ? 100 : 0;
  const hints = Math.max(0, 100 - hintsUsed * 20);
  const difficulty = { beginner: 60, intermediate: 80, advanced: 100 }[task.difficulty];
  const total = Math.round(accountingAccuracy * .4 + accountSelection * .12 + debitCreditAccuracy * .1 + amountAccuracy * .1 + errorDetection * .08 + hints * .05 + efficiency * .05 + recovery * .05 + difficulty * .05);
  return { accountingAccuracy, accountSelection, debitCreditAccuracy, amountAccuracy, errorDetection, hints, efficiency, recovery, difficulty, total };
}

export function financialImpactFor(lines: ArenaTaskLine[]) {
  const accounts = createTrainingAccountSnapshot();
  return lines.map((line) => { const account = accounts.find((item) => item.code === line.accountCode); const increases = account ? line.side === account.normalBalance : false; return { accountCode: line.accountCode, accountNameAr: account?.nameAr ?? line.accountCode, accountNameEn: account?.nameEn ?? line.accountCode, type: account?.type, direction: increases ? "increase" as const : "decrease" as const, amount: line.amount }; });
}

export function calculateHiringReadiness(profile: ArenaProfile): HiringReadiness {
  const rated = Object.values(profile.skills), skillCoverage = Math.round(rated.filter((skill) => skill.score >= 60).length / rated.length * 100);
  const verifiedSkills = Math.min(100, profile.verifiedSkills.length / 6 * 100), uniqueCases = Math.min(100, profile.uniqueCases / 50 * 100), closing = Math.min(100, profile.monthClosings * 50);
  const banking = profile.skills.banking.score, journal = profile.skills["journal-entries"].score;
  const score = Math.round(skillCoverage * .3 + profile.accuracy * .25 + verifiedSkills * .15 + uniqueCases * .1 + closing * .1 + banking * .05 + journal * .05);
  return { score, level: score >= 85 ? "junior-ready" : score >= 55 ? "developing" : "building", evidence: { skillCoverage, accuracy: profile.accuracy, verifiedSkills: Math.round(verifiedSkills), uniqueCases: Math.round(uniqueCases), closing, banking, journal } };
}

export const isExactTaskAnswer = (task: ArenaTaskDefinition, answer: ArenaTaskLine[]) => task.expectedLines.every((expected) => answer.some((line) => sameLine(line, expected) && line.amount === expected.amount)) && validateArenaJournal(answer).valid;
