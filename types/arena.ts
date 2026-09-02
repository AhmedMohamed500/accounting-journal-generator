export type ArenaSkillId = "chart-of-accounts" | "account-nature" | "increase-decrease" | "debit-credit" | "journal-entries" | "posting" | "general-ledger" | "trial-balance" | "customers-ar" | "suppliers-ap" | "cash" | "banking" | "vat" | "adjustments" | "closing" | "financial-statements" | "error-detection" | "financial-impact" | "excel-analysis" | "recovery";
export type SkillConfidence = "low" | "medium" | "high" | "verified";
export type CareerRankId = "intern" | "accounting-trainee" | "junior-ready" | "junior-accountant" | "accountant" | "advanced-accountant" | "senior-challenge" | "chief-accountant-candidate";
export type ArenaDifficulty = "beginner" | "intermediate" | "advanced";
export type ArenaMode = "career" | "mission" | "money-flow" | "detective" | "work-shift" | "boss" | "daily" | "mystery";

export interface SkillRating { id: ArenaSkillId; score: number; confidence: SkillConfidence; attempts: number; uniqueCases: number; bestAccuracy: number; maxDifficulty: ArenaDifficulty; }
export interface VerifiedSkill { skillId: ArenaSkillId; verifiedAt: string; evidenceCaseIds: string[]; accuracy: number; }
export interface CareerRank { id: CareerRankId; titleAr: string; titleEn: string; requirements: { score?: number; uniqueCases?: number; accuracy?: number; workShifts?: number; bossIds?: string[]; skills?: Partial<Record<ArenaSkillId, number>> }; }
export interface ProfessionalScoreConfig { accuracy: number; difficulty: number; consistency: number; errorDetection: number; efficiency: number; }
export interface ArenaAttempt { caseId: string; mode: ArenaMode; difficulty: ArenaDifficulty; accuracy: number; score: number; hintsUsed: number; durationSeconds: number; completedAt: string; skills: ArenaSkillId[]; ranked: boolean; }
export interface CompanyHealth { cash: number; receivables: number; payables: number; profitIntegrity: number; accountingAccuracy: number; compliance: number; closingReadiness: number; }
export interface CfoTrust { value: number; }
export interface Achievement { id: string; titleAr: string; titleEn: string; earnedAt: string; }
export interface PerformanceReview { generatedAt: string; overall: number; strong: ArenaSkillId[]; needsWork: ArenaSkillId[]; commonMistakeAr: string; commonMistakeEn: string; recommendedMissionId: string; }
export interface MistakeChain { id: string; triggerCaseId: string; delayedByTasks: number; cfoMessageAr: string; cfoMessageEn: string; affectedHealth: (keyof CompanyHealth)[]; resolved: boolean; }
export interface ArenaProfile { schemaVersion: 1; displayName: string; visibility: "private" | "arena" | "companies-future"; careerRank: CareerRankId; professionalScore: number; accuracy: number; uniqueCases: number; workShifts: number; bossChallenges: string[]; monthClosings: number; currentStreak: number; lastDailyDate?: string; attempts: ArenaAttempt[]; skills: Record<ArenaSkillId, SkillRating>; verifiedSkills: VerifiedSkill[]; achievements: Achievement[]; companyHealth: CompanyHealth; cfoTrust: CfoTrust; }
export interface StoryStage { id: string; order: number; titleAr: string; titleEn: string; briefAr: string; briefEn: string; mode: ArenaMode; skillIds: ArenaSkillId[]; route: string; status?: "available" | "locked" | "complete"; }
export interface Mission { id: string; titleAr: string; titleEn: string; mode: ArenaMode; difficulty: ArenaDifficulty; skillIds: ArenaSkillId[]; unique: boolean; }
export interface WorkShift { id: string; titleAr: string; titleEn: string; taskIds: string[]; }
export interface ShiftResult { shiftId: string; accuracy: number; tasksCompleted: number; cfoTrustChange: number; }
export interface BossChallenge extends Mission { requirements: string[]; }
export interface Season { id: string; titleAr: string; titleEn: string; startsAt: string; endsAt: string; stageIds: string[]; }
export interface LeaderboardEntry { id: string; player: string; careerRank: CareerRankId; professionalScore: number; accuracy: number; topSkill: ArenaSkillId; uniqueCases: number; demo?: boolean; }
export interface GameWorld { id: string; titleAr: string; titleEn: string; companyAr: string; companyEn: string; active: boolean; stageIds: string[]; }
export interface JournalLine { accountId: string; debit: number; credit: number; }
export interface LedgerBalance { accountId: string; debit: number; credit: number; balance: number; side: "debit" | "credit"; }
export type ArenaWorkflowStep = "document" | "analysis" | "accounts" | "journal" | "impact" | "approval";
export interface ArenaDocument { type: "supplier-invoice" | "receipt" | "bank-notice" | "expense-document"; number: string; date: string; partyAr: string; partyEn: string; net: number; vat: number; total: number; currency: string; }
export interface ArenaTaskLine { accountCode: string; side: "debit" | "credit"; amount: number; }
export interface ArenaTaskDefinition { id: string; companyAr: string; companyEn: string; titleAr: string; titleEn: string; objectiveAr: string; objectiveEn: string; priority: "normal" | "important" | "urgent"; estimatedMinutes: number; difficulty: ArenaDifficulty; document: ArenaDocument; expectedLines: ArenaTaskLine[]; skillIds: ArenaSkillId[]; reward: number; }
export interface TaskScoreDimensions { accountingAccuracy: number; accountSelection: number; debitCreditAccuracy: number; amountAccuracy: number; errorDetection: number; hints: number; efficiency: number; recovery: number; difficulty: number; total: number; }
export interface HiringReadiness { score: number; level: "building" | "developing" | "junior-ready"; evidence: { skillCoverage: number; accuracy: number; verifiedSkills: number; uniqueCases: number; closing: number; banking: number; journal: number; }; }
