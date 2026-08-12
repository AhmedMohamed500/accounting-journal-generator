export type Locale = "ar" | "en";
export type TransactionCategory = "sales" | "purchases" | "expenses" | "revenues" | "assets" | "inventory" | "payroll" | "taxes" | "capital" | "loans" | "adjustments" | "closing";
export interface JournalEntryLine { id: string; accountCode?: string; accountNameAr: string; accountNameEn: string; debit: number; credit: number; descriptionAr?: string; descriptionEn?: string; costCenterId?: string; costCenterName?: string; partyId?: string; partyName?: string }
export interface FinancialStatementImpact { assets: number; liabilities: number; equity: number; revenue: number; expenses: number; profit: number; cash?: number; inventory?: number; receivables?: number; payables?: number }
export interface TransactionInput { type: string; amount: number; date?: string; currency?: string; paymentMethod?: "cash"|"bank"|"cheque"|"credit"; paymentAccountCode?: string; paymentAccountNameAr?: string; paymentAccountNameEn?: string; purchaseAccountCode?: string; vatEnabled?: boolean; vatRate?: number; vatIncluded?: boolean; commercialDiscount?: number; cashDiscount?: number; withholdingEnabled?: boolean; withholdingRate?: number; customer?: string; supplier?: string; usefulLife?: number; residualValue?: number; accumulatedDepreciation?: number; notes?: string }
export interface GeneratedJournalEntry { id: string; entryNumber: string; date: string; transactionType: string; titleAr: string; titleEn: string; narrationAr: string; narrationEn: string; currency: string; lines: JournalEntryLine[]; totalDebit: number; totalCredit: number; isBalanced: boolean; explanationAr: string[]; explanationEn: string[]; assumptionsAr: string[]; assumptionsEn: string[]; warningsAr: string[]; warningsEn: string[]; accountingRuleAr: string; accountingRuleEn: string; financialStatementImpact: FinancialStatementImpact; cashFlowCategory?: "operating"|"investing"|"financing"|"non-cash"; confidence?: number }
export interface TransactionDefinition { slug: string; type: string; category: TransactionCategory; titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string[]; debitAccountAr: string; debitAccountEn: string; creditAccountAr: string; creditAccountEn: string; payment?: "cash"|"bank"|"cheque"|"credit"; featured?: boolean }
export type EntryWorkflowStatus = "draft" | "review" | "approved" | "posted" | "rejected" | "reversed";
export type JournalEntrySource = "manual" | "natural-language-generator" | "spreadsheet-import" | "bank-import" | "bank-reconciliation" | "vat" | "service-point" | "merchant-accounting" | "opening-balance" | "adjustment" | "closing" | "invoice-capture" | "legacy";
export interface EntryAuditEvent { id: string; entryId: string; action: EntryWorkflowStatus | "created" | "edited" | "duplicated"; at: string; actor: string; note?: string }
export interface GeneratedJournalEntry {
  workflowStatus?: EntryWorkflowStatus;
  source?: JournalEntrySource;
  companyId?: string;
  fiscalPeriodId?: string;
  reference?: string;
  partyId?: string;
  partyName?: string;
  createdBy?: string;
  createdAt?: string;
  approvedAt?: string;
  postedAt?: string;
  rejectedAt?: string;
  reversedAt?: string;
  rejectionReason?: string;
  reversalReason?: string;
  originalEntryId?: string;
  reversalEntryId?: string;
  linkedTransactionIds?: string[];
  sourceReference?: string;
  audit?: EntryAuditEvent[];
  paymentAccountCode?: string;
}
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type FinancialStatementSection = "current-assets" | "non-current-assets" | "current-liabilities" | "non-current-liabilities" | "equity" | "operating-revenue" | "other-revenue" | "cost-of-sales" | "operating-expenses" | "other-expenses";
export interface ChartAccount {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  active: boolean;
  system?: boolean;
  parentId?: string;
  level?: number;
  allowPosting?: boolean;
  normalBalance?: NormalBalance;
  statementSection?: FinancialStatementSection;
  descriptionAr?: string;
  descriptionEn?: string;
  openingBalance?: number;
}
export interface TrialBalanceRow { accountCode: string; accountNameAr: string; accountNameEn: string; totalDebit: number; totalCredit: number; debitBalance: number; creditBalance: number }
