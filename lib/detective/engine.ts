import type { DetectiveCase, DetectiveEvidence, DetectiveScoreRules } from "@/types";

export const DETECTIVE_SCORE_RULES: DetectiveScoreRules = {
  maxScore: 1000,
  correctConclusion: 400,
  relevantEvidence: 300,
  noHints: 150,
  efficiencyBonus: 100,
  timeBonus: 50,
  wrongEvidencePenalty: 35,
  hintPenalty: 50,
  extraAttemptPenalty: 45,
};

export interface DetectiveScoreInput {
  caseDefinition: DetectiveCase;
  selectedEvidence: string[];
  openedEvidence: string[];
  conclusionId: string;
  hintsUsed: number;
  attempts: number;
  elapsedSeconds: number;
}

const sameSet = (left: string[], right: string[]) => {
  const a = [...new Set(left)].sort(), b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

export function validateDetectiveCase(caseDefinition: DetectiveCase) {
  const evidenceIds = new Set(caseDefinition.evidence.map((item) => item.id));
  const conclusionIds = new Set(caseDefinition.conclusions.map((item) => item.id));
  const treatmentBalanced = caseDefinition.accountingTreatment.every((entry) => {
    const debit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    return Math.abs(debit - credit) < 0.01;
  });
  return {
    valid: Boolean(caseDefinition.id && caseDefinition.slug)
      && caseDefinition.correctEvidence.every((id) => evidenceIds.has(id))
      && conclusionIds.has(caseDefinition.correctConclusion)
      && caseDefinition.hints.length === 3
      && treatmentBalanced,
    treatmentBalanced,
  };
}

export function isCorrectEvidence(caseDefinition: DetectiveCase, selectedEvidence: string[]) {
  return sameSet(caseDefinition.correctEvidence, selectedEvidence);
}

export function isCorrectConclusion(caseDefinition: DetectiveCase, conclusionId: string) {
  return conclusionId === caseDefinition.correctConclusion;
}

export function resolveInvestigation(caseDefinition: DetectiveCase, selectedEvidence: string[], conclusionId: string) {
  const evidenceCorrect = isCorrectEvidence(caseDefinition, selectedEvidence);
  const conclusionCorrect = isCorrectConclusion(caseDefinition, conclusionId);
  return { solved: evidenceCorrect && conclusionCorrect, evidenceCorrect, conclusionCorrect };
}

export function nextDetectiveHint(caseDefinition: DetectiveCase, hintsUsed: number) {
  return caseDefinition.hints[Math.min(hintsUsed, caseDefinition.hints.length - 1)];
}

export function calculateEvidenceAccuracy(caseDefinition: DetectiveCase, selectedEvidence: string[]) {
  const chosen = new Set(selectedEvidence);
  const correct = caseDefinition.correctEvidence.filter((id) => chosen.has(id)).length;
  const wrong = selectedEvidence.filter((id) => !caseDefinition.correctEvidence.includes(id)).length;
  const denominator = Math.max(1, caseDefinition.correctEvidence.length + wrong);
  return Math.max(0, Math.round((correct / denominator) * 100));
}

export function calculateDetectiveScore(input: DetectiveScoreInput) {
  const rules = input.caseDefinition.scoreRules;
  if (!resolveInvestigation(input.caseDefinition, input.selectedEvidence, input.conclusionId).solved) return 0;
  const relevantFound = input.caseDefinition.correctEvidence.filter((id) => input.selectedEvidence.includes(id)).length;
  const evidencePoints = Math.round(rules.relevantEvidence * (relevantFound / Math.max(1, input.caseDefinition.correctEvidence.length)));
  const wrongSelected = input.selectedEvidence.filter((id) => !input.caseDefinition.correctEvidence.includes(id)).length;
  const unnecessaryOpened = input.openedEvidence.filter((id) => !input.caseDefinition.correctEvidence.includes(id)).length;
  const efficiency = unnecessaryOpened <= Math.max(1, input.caseDefinition.evidence.length - input.caseDefinition.correctEvidence.length) / 2 ? rules.efficiencyBonus : 0;
  const timeThreshold = input.caseDefinition.estimatedMinutes * 90;
  const time = input.elapsedSeconds <= timeThreshold ? rules.timeBonus : Math.round(rules.timeBonus / 2);
  const hintPoints = Math.max(0, rules.noHints - input.hintsUsed * rules.hintPenalty);
  const penalties = wrongSelected * rules.wrongEvidencePenalty + Math.max(0, input.attempts - 1) * rules.extraAttemptPenalty;
  return Math.max(0, Math.min(rules.maxScore, rules.correctConclusion + evidencePoints + hintPoints + efficiency + time - penalties));
}

export function evidenceByPanel(caseDefinition: DetectiveCase, panel: string): DetectiveEvidence[] {
  return caseDefinition.evidence.filter((item) => item.panel === panel);
}

export function buildDetectiveTrainingEntries(caseDefinition: DetectiveCase) {
  return caseDefinition.accountingTreatment.map((entry, index) => ({
    id: `training-detective-${caseDefinition.id}-${index + 1}`,
    source: "finora-accounting-detective" as const,
    sandbox: true as const,
    caseId: caseDefinition.id,
    ...entry,
  }));
}
