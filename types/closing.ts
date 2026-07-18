import type { GeneratedJournalEntry } from "./accounting";
import type { AccountingTask } from "./tasks";
export type CloseRiskSeverity = "critical" | "high" | "medium" | "low";
export interface CloseChecklistItem { id: string; titleAr: string; titleEn: string; category: "bank" | "receivables" | "payables" | "tax" | "payroll" | "assets" | "inventory" | "review"; estimatedMinutes: number; completed: boolean; completedAt?: string }
export interface CloseRisk { id: string; severity: CloseRiskSeverity; titleAr: string; titleEn: string; detailAr: string; detailEn: string; actionHref: string }
export interface CloseAnalysis { readiness: number; estimatedMinutes: number; completedItems: number; totalItems: number; risks: CloseRisk[]; draftEntries: number; reviewEntries: number; unbalancedEntries: number; overdueTasks: number }
export interface CloseAnalysisInput { entries: GeneratedJournalEntry[]; tasks: AccountingTask[]; checklist: CloseChecklistItem[]; today: string }
