import type { AccountType } from "./accounting";

export type MoneyFlowDifficulty = "beginner" | "intermediate" | "advanced";
export type MoneyFlowDirection = "increase" | "decrease" | "none";
export type MoneyFlowSkill = "account-nature" | "increase-decrease" | "debit-credit" | "receivables" | "payables" | "revenue-recognition" | "expense-recognition" | "cash-movement" | "financial-impact";

export interface MoneyFlowAccount {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  plainAr: string;
  plainEn: string;
  type: AccountType;
  balance: number;
  icon: "bank" | "cash" | "customer" | "supplier" | "capital" | "revenue" | "expense" | "equipment" | "inventory";
  initiallyHiddenType?: boolean;
}

export interface MoneyFlowMovement {
  tokenId: string;
  sourceAccountId?: string;
  destinationAccountId: string;
  amount: number;
  accountChanges: Record<string, number>;
}

export interface MoneyFlowToken { id: string; amount: number; currency: string; sourceAccountId?: string }
export interface MoneyFlowChoice { id: string; labelAr: string; labelEn: string }
export interface MoneyFlowQuestion { id: string; promptAr: string; promptEn: string; choices: MoneyFlowChoice[]; correctChoiceId: string; feedbackAr: string; feedbackEn: string }
export interface MoneyFlowJournalLine { accountId: string; accountCode: string; accountNameAr: string; accountNameEn: string; debit: number; credit: number; whyAr: string; whyEn: string }
export interface MoneyFlowImpact { key: string; labelAr: string; labelEn: string; direction: MoneyFlowDirection; amount?: number; noteAr?: string; noteEn?: string }
export interface MoneyFlowConsequence { targetAccountId: string; titleAr: string; titleEn: string; explanationAr: string; explanationEn: string; reflectionAr: string; reflectionEn: string; impacts: MoneyFlowImpact[] }
export interface MoneyFlowVariation { promptAr: string; promptEn: string; changedWordAr: string; changedWordEn: string; fromAccountAr: string; fromAccountEn: string; toAccountAr: string; toAccountEn: string; explanationAr: string; explanationEn: string }
export interface MoneyFlowReverseQuestion { promptAr: string; promptEn: string; choices: MoneyFlowChoice[]; correctChoiceId: string }

export interface MoneyFlowScenario {
  id: string;
  slug: string;
  number: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  scenarioAr: string;
  scenarioEn: string;
  difficulty: MoneyFlowDifficulty;
  learningStage: MoneyFlowDifficulty;
  estimatedMinutes: number;
  accounts: MoneyFlowAccount[];
  tokens: MoneyFlowToken[];
  movementPromptAr: string;
  movementPromptEn: string;
  correctMovement: MoneyFlowMovement;
  questions: MoneyFlowQuestion[];
  journalEntry: { narrationAr: string; narrationEn: string; lines: MoneyFlowJournalLine[] };
  financialImpact: MoneyFlowImpact[];
  wrongConsequences: MoneyFlowConsequence[];
  hintsAr: string[];
  hintsEn: string[];
  variations: MoneyFlowVariation[];
  reverseQuestion: MoneyFlowReverseQuestion;
  skills: MoneyFlowSkill[];
  noteAr?: string;
  noteEn?: string;
}

export interface MoneyFlowAttemptResult { scenarioId: string; completedAt: string; mode: MoneyFlowDifficulty; attempts: number; mistakes: number; hintsUsed: number; score: number; masteredSkills: MoneyFlowSkill[] }
export interface MoneyFlowScenarioProgress { scenarioId: string; completed: boolean; bestScore: number; attempts: number; mistakes: number; hintsUsed: number; lastCompletedAt?: string; lastResult?: MoneyFlowAttemptResult }
export interface MoneyFlowProgress { schemaVersion: 1; records: Record<string, MoneyFlowScenarioProgress>; skills: Partial<Record<MoneyFlowSkill, number>>; currentLearningStage: MoneyFlowDifficulty }
