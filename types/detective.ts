export type DetectiveDifficulty = "beginner" | "intermediate" | "advanced";
export type DetectiveEvidenceType = "bank-transaction" | "journal-entry" | "invoice" | "receipt" | "customer-message" | "supplier-message" | "cash-movement" | "account-balance" | "document" | "excel-row" | "internal-note" | "asset-register" | "ledger-movement";
export type DetectivePanel = "brief" | "documents" | "bank" | "entries" | "parties" | "evidence" | "notes" | "conclusion";
export type DetectiveSkill = "bank-reconciliation" | "customer-accounts" | "journal-logic" | "account-classification" | "financial-statement-impact" | "error-detection" | "supplier-accounts" | "ledger-analysis";

export interface DetectiveEvidence {
  id: string;
  type: DetectiveEvidenceType;
  panel: DetectivePanel;
  titleAr: string;
  titleEn: string;
  date: string;
  amount?: number;
  reference?: string;
  contentAr: string;
  contentEn: string;
  relatedEntity?: string;
  isRelevant: boolean;
  importance: 1 | 2 | 3;
  metadata?: Record<string, string | number | boolean>;
}

export interface DetectiveConclusion {
  id: string;
  titleAr: string;
  titleEn: string;
  feedbackAr: string;
  feedbackEn: string;
}

export interface DetectiveHint { level: 1 | 2 | 3; textAr: string; textEn: string }
export interface DetectiveJournalLine { accountAr: string; accountEn: string; debit: number; credit: number }
export interface DetectiveTreatment { titleAr: string; titleEn: string; narrationAr: string; narrationEn: string; lines: DetectiveJournalLine[] }
export interface DetectiveImpact { labelAr: string; labelEn: string; before?: number | string; after?: number | string; direction?: "up" | "down" | "none" }

export interface DetectiveScoreRules {
  maxScore: number;
  correctConclusion: number;
  relevantEvidence: number;
  noHints: number;
  efficiencyBonus: number;
  timeBonus: number;
  wrongEvidencePenalty: number;
  hintPenalty: number;
  extraAttemptPenalty: number;
}

export interface DetectiveCase {
  id: string;
  slug: string;
  caseNumber: string;
  titleAr: string;
  titleEn: string;
  briefAr: string;
  briefEn: string;
  questionAr: string;
  questionEn: string;
  caseTypeAr: string;
  caseTypeEn: string;
  difficulty: DetectiveDifficulty;
  estimatedMinutes: number;
  skills: DetectiveSkill[];
  panels: DetectivePanel[];
  evidence: DetectiveEvidence[];
  correctEvidence: string[];
  conclusions: DetectiveConclusion[];
  correctConclusion: string;
  hints: DetectiveHint[];
  accountingTreatment: DetectiveTreatment[];
  financialImpact: DetectiveImpact[];
  explanationAr: string;
  explanationEn: string;
  checksAr: string[];
  checksEn: string[];
  notePresetsAr: string[];
  notePresetsEn: string[];
  relatedMissionSlug?: string;
  scoreRules: DetectiveScoreRules;
  educationalNoteAr?: string;
  educationalNoteEn?: string;
}

export interface DetectiveAttemptResult {
  caseId: string;
  score: number;
  accuracy: number;
  relevantEvidenceFound: number;
  hintsUsed: number;
  attempts: number;
  elapsedSeconds: number;
  completedAt: string;
}

export interface DetectiveCaseProgress {
  caseId: string;
  solved: boolean;
  bestScore: number;
  attempts: number;
  completions: number;
  lastPlayedAt: string;
  openedEvidence: string[];
  importantEvidence: string[];
  excludedEvidence: string[];
  evidenceLinks: [string, string][];
  notes: string[];
  hintsUsed: number;
  lastResult?: DetectiveAttemptResult;
}

export interface DetectiveProgress {
  schemaVersion: 1;
  records: Record<string, DetectiveCaseProgress>;
  skills: Partial<Record<DetectiveSkill, number>>;
  lastPlayedCaseId?: string;
}
