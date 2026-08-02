export type OfficeClientStatus = "active" | "follow-up" | "paused" | "archived";
export type OfficePriority = "low" | "medium" | "high" | "critical";
export type MonthlyFileStatus = "not-started" | "waiting-documents" | "recording" | "adjusting" | "ready-review" | "changes-required" | "reviewed" | "ready-delivery" | "closed" | "overdue";
export type OfficeTaskStatus = "new" | "in-progress" | "waiting-client" | "ready-review" | "completed" | "carried-forward" | "cancelled";
export type RequiredDocumentStatus = "not-requested" | "requested" | "partial" | "received" | "not-required" | "overdue";
export type OfficeDeadlineLevel = "normal" | "near" | "urgent" | "overdue" | "completed";
export type ReviewStatus = "queued" | "in-review" | "changes-required" | "approved";
export type OfficeFeeStatus = "draft" | "due" | "partial" | "collected" | "overdue" | "cancelled";
export type OpportunityStatus = "new" | "contact" | "offered" | "negotiating" | "won" | "lost" | "deferred";
export type WorkloadLevel = "available" | "balanced" | "high" | "critical";

export interface AccountingOffice { id: string; nameAr: string; nameEn: string; logoDataUrl?: string; currency: string; createdAt: string }
export interface OfficeEmployee { id: string; name: string; role: "owner" | "manager" | "accountant" | "reviewer" | "assistant"; phone?: string; email?: string; hourlyCost: number; dailyCapacityHours: number; active: boolean; createdAt: string }
export interface OfficeService { id: string; nameAr: string; nameEn: string; category: string; defaultPrice: number; defaultHours: number; active: boolean }
export interface ServicePackage { id: string; nameAr: string; nameEn: string; serviceIds: string[]; monthlyFee: number; includedHours: number; active: boolean }
export interface WorkflowTemplateTask { id: string; titleAr: string; titleEn: string; order: number; relativeDueDay: number; responsibleRole: OfficeEmployee["role"]; expectedHours: number; reviewRequired: boolean; checklist: string[] }
export interface WorkflowTemplateDocument { id: string; nameAr: string; nameEn: string; required: boolean }
export interface WorkflowTemplate { id: string; nameAr: string; nameEn: string; serviceId: string; clientActivity?: string; tasks: WorkflowTemplateTask[]; documents: WorkflowTemplateDocument[]; reviewSteps: string[]; expectedHours: number; suggestedPrice: number; active: boolean }
export interface OfficeClient {
  id: string; code: string; tradeName: string; legalName: string; activity: string; entityType: string; taxNumber?: string; registrationNumber?: string;
  contactName: string; phone: string; email?: string; address?: string; contractStart: string; status: OfficeClientStatus; accountantId: string; reviewerId?: string;
  serviceFrequency: "monthly" | "quarterly" | "annual" | "one-time"; packageId?: string; workflowTemplateId?: string; feeAmount: number; feeDueDay: number;
  expectedHours: number; includedServiceIds: string[]; excludedServiceIds: string[]; notes?: string; priority: OfficePriority; risk: OfficePriority;
  responseSpeed: number; documentCommitment: number; reworkRate: number; extraMonthlyCosts: number; branches: number; employeeCount: number; bankTransactionVolume: number;
  frequentExcelAnalysis?: boolean; createdAt: string; archivedAt?: string;
}
export interface MonthlyClientFile { id: string; clientId: string; period: string; templateId?: string; accountantId: string; reviewerId?: string; startedAt?: string; dueDate: string; status: MonthlyFileStatus; expectedDocuments: number; receivedDocuments: number; notes?: string; reviewResult?: string; closedAt?: string; createdAt: string; carriedTaskIds: string[] }
export interface TaskChecklistItem { id: string; title: string; completed: boolean }
export interface OfficeTask { id: string; title: string; clientId: string; monthlyFileId?: string; serviceId?: string; assigneeId: string; reviewerId?: string; priority: OfficePriority; status: OfficeTaskStatus; startDate: string; dueDate: string; expectedHours: number; actualHours: number; hourlyCost: number; dependencyIds: string[]; checklist: TaskChecklistItem[]; notes?: string; documentId?: string; journalEntryId?: string; recurring: boolean; recurrenceRule?: string; carriedFromTaskId?: string; createdAt: string; completedAt?: string }
export interface RequiredDocument { id: string; clientId: string; monthlyFileId: string; type: string; period: string; status: RequiredDocumentStatus; requestedAt?: string; receivedAt?: string; followUpEmployeeId: string; reminderCount: number; notes?: string; createdAt: string }
export interface OfficeDeadline { id: string; clientId?: string; type: string; period: string; dueDate: string; employeeId: string; reviewerId?: string; status: OfficeDeadlineLevel; taskId?: string; monthlyFileId?: string; notes?: string; createdAt: string }
export interface ReviewChecklistItem { id: string; title: string; completed: boolean; notes?: string }
export interface ReviewItem { id: string; clientId: string; monthlyFileId?: string; taskId?: string; journalEntryId?: string; type: "monthly-file" | "journal-entry" | "document"; status: ReviewStatus; creatorId: string; reviewerId: string; createdAt: string; reviewedAt?: string; result?: string; notes?: string; checklist: ReviewChecklistItem[] }
export interface TimeEntry { id: string; clientId: string; monthlyFileId?: string; taskId?: string; employeeId: string; startedAt: string; endedAt?: string; hours: number; hourlyCost: number; billable: boolean; description: string; createdAt: string }
export interface OfficeFee { id: string; clientId: string; period: string; serviceId?: string; amount: number; dueDate: string; status: OfficeFeeStatus; collectedAmount: number; lastCollectionAt?: string; collectionMethod?: string; notes?: string; createdAt: string }
export interface OfficeCollection { id: string; feeId: string; clientId: string; amount: number; date: string; method: string; notes?: string; createdAt: string }
export interface ClientCost { clientId: string; period: string; laborCost: number; additionalCost: number; totalCost: number }
export interface ClientProfitability extends ClientCost { revenue: number; grossProfit: number; margin: number; revenuePerHour: number; agreedHours: number; actualHours: number; nonBillableHours: number; classification: "very-profitable" | "profitable" | "review" | "low" | "loss"; reasons: string[] }
export interface RevenueOpportunity { id: string; clientId: string; serviceId?: string; serviceName: string; reason: string; rule: string; expectedMonthlyRevenue: number; expectedCost: number; expectedProfit: number; priority: OfficePriority; status: OpportunityStatus; followUpDate?: string; notes?: string; createdAt: string }
export interface ClientHealthFactor { key: string; label: string; score: number; weight: number; explanation: string }
export interface ClientHealthScore { clientId: string; score: number; classification: "excellent" | "good" | "follow-up" | "at-risk"; factors: ClientHealthFactor[] }
export interface OfficeActivity { id: string; type: string; description: string; clientId?: string; employeeId?: string; entityId?: string; at: string }
export interface ProfitabilityThresholds { veryProfitable: number; profitable: number; review: number; low: number }
export interface WorkloadThresholds { balanced: number; high: number; critical: number }
export interface OfficeSettings { currency: string; dailyHours: number; workingDays: number[]; roleHourlyCosts: Record<OfficeEmployee["role"], number>; profitabilityThresholds: ProfitabilityThresholds; workloadThresholds: WorkloadThresholds; alertDaysBefore: number; clientPrefix: string; filePrefix: string; reminderTemplate: string; healthWeights: { documents: number; collections: number; delays: number; profitability: number; rework: number; completeness: number; deadlines: number; response: number } }
export interface AccountingOfficeData { schemaVersion: 2; companyId: string; office: AccountingOffice; clients: OfficeClient[]; employees: OfficeEmployee[]; services: OfficeService[]; packages: ServicePackage[]; templates: WorkflowTemplate[]; monthlyFiles: MonthlyClientFile[]; tasks: OfficeTask[]; requiredDocuments: RequiredDocument[]; deadlines: OfficeDeadline[]; reviews: ReviewItem[]; timeEntries: TimeEntry[]; fees: OfficeFee[]; collections: OfficeCollection[]; opportunities: RevenueOpportunity[]; activities: OfficeActivity[]; settings: OfficeSettings }
export interface EmployeeWorkload { employeeId: string; requiredHours: number; availableHours: number; utilization: number; urgentTasks: number; overdueTasks: number; level: WorkloadLevel; suggestion: string }
export interface OfficeDashboardMetrics { activeClients: number; openFiles: number; readyForReview: number; overdueFiles: number; dueToday: number; overdueTasks: number; upcomingDeadlines: number; missingDocuments: number; recordedHours: number; fees: number; collected: number; outstanding: number; overdueFees: number; executionCost: number; estimatedProfit: number; averageClientMargin: number; teamUtilization: number }

