export type MissionDifficulty = "beginner" | "intermediate";
export type MissionInteraction = "single-choice" | "balance-fix" | "multi-select";
export type MissionImpactKey = "cash" | "bank" | "assets" | "liabilities" | "revenue" | "expenses" | "receivables" | "payables" | "profit" | "fixedAssets";
export type MissionImpactDirection = "up" | "down" | "none";

export interface MissionImpactItem {
  key: MissionImpactKey;
  labelAr: string;
  labelEn: string;
  direction: MissionImpactDirection;
  amount?: number;
  noteAr?: string;
  noteEn?: string;
  incorrect?: boolean;
}

export interface MissionChoiceConsequence {
  titleAr: string;
  titleEn: string;
  explanationAr: string;
  explanationEn: string;
  reflectionAr: string;
  reflectionEn: string;
  impacts: MissionImpactItem[];
}

export interface MissionChoice {
  id: string;
  labelAr: string;
  labelEn: string;
  consequence: MissionChoiceConsequence;
}

export interface MissionJournalLine {
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  debit: number;
  credit: number;
}

export interface MissionJournalEntry {
  narrationAr: string;
  narrationEn: string;
  lines: MissionJournalLine[];
}

export interface MissionHint {
  level: 1 | 2 | 3;
  textAr: string;
  textEn: string;
}

export interface MissionBalanceFix {
  debitAccountAr: string;
  debitAccountEn: string;
  debitAmount: number;
  creditAccountAr: string;
  creditAccountEn: string;
  initialCreditAmount: number;
  expectedCreditAmount: number;
}

export interface MissionDefinition {
  id: string;
  slug: string;
  caseNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: "journal-entries" | "account-nature" | "customers" | "cash-bank" | "profit-expenses";
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  skillsAr: string[];
  skillsEn: string[];
  scenarioAr: string;
  scenarioEn: string;
  interaction: MissionInteraction;
  questionAr: string;
  questionEn: string;
  choices?: MissionChoice[];
  correctAnswerIds: string[];
  balanceFix?: MissionBalanceFix;
  correctImpact: MissionImpactItem[];
  correctFeedbackAr: string;
  correctFeedbackEn: string;
  explanationAr: string;
  explanationEn: string;
  journalEntry?: MissionJournalEntry;
  hints: MissionHint[];
}

export interface MissionResultRecord {
  missionId: string;
  score: number;
  accuracy: number;
  attempts: number;
  hintsUsed: number;
  elapsedSeconds: number;
  completedAt: string;
  viewedSolution: boolean;
}

export interface MissionProgressRecord {
  missionId: string;
  completed: boolean;
  bestScore: number;
  bestAccuracy: number;
  attempts: number;
  completions: number;
  lastPlayedAt: string;
  lastResult?: MissionResultRecord;
}

export interface MissionsProgress {
  schemaVersion: 1;
  records: Record<string, MissionProgressRecord>;
  lastPlayedMissionId?: string;
}

