import type { AccountType, FinancialStatementSection, GeneratedJournalEntry } from "./accounting";
export type OperationSourceKind = "business-document" | "uploaded-document" | "custody" | "bank" | "manual";
export interface OperationSource { kind: OperationSourceKind; titleAr: string; titleEn: string; reference?: string; partyAr?: string; partyEn?: string; date?: string; amount?: number; currency?: string; detailAr?: string; detailEn?: string }
export interface AccountBalanceSnapshot { code: string; nameAr: string; nameEn: string; type: AccountType; section?: FinancialStatementSection; before: number; movement: number; afterPosting: number; officialAfter: number; posted: boolean }
export interface OperationDossier { entry: GeneratedJournalEntry; source: OperationSource; balances: AccountBalanceSnapshot[]; linkedDocumentIds: string[]; linkedCustodyId?: string; linkedBankTransactionId?: string }
