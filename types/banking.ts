import type { GeneratedJournalEntry } from "./accounting";

export type BankTransactionStatus = "unmatched" | "matched" | "ignored" | "duplicate" | "invalid";

export interface BankImportSource {
  fileName: string;
  sheetName: string;
  rowNumber: number;
  importedAt: string;
}

export interface BankTransaction {
  id: string;
  companyId?: string;
  bankAccountId?: string;
  fiscalYearId?: string;
  periodId?: string;
  importId?: string;
  fingerprint?: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance?: number;
  currency: string;
  matchedEntryId?: string;
  matchConfidence?: number;
  status: BankTransactionStatus;
  source?: BankImportSource;
  validationErrors?: string[];
}

export interface BankImportBatch {
  id: string;
  companyId: string;
  bankAccountId: string;
  fiscalYearId: string;
  periodId: string;
  fileName: string;
  sheetNames: string[];
  importedAt: string;
  importedCount: number;
  duplicateCount: number;
  rejectedCount: number;
}

export interface BankColumnMapping {
  date: string;
  description?: string;
  reference?: string;
  debit?: string;
  credit?: string;
  amount?: string;
  direction?: string;
  balance?: string;
}

export interface BankImportContext {
  companyId?: string;
  bankAccountId?: string;
  fiscalYearId?: string;
  periodId?: string;
  fileName?: string;
  importId?: string;
  mapping?: BankColumnMapping;
}

export interface BankMatch { transactionId: string; entryId: string; confidence: number; reasons: string[] }
export interface ReconciliationSummary { total: number; matched: number; unmatched: number; ignored: number; matchRate: number; statementDebits: number; statementCredits: number }
export interface BankMatchInput { transactions: BankTransaction[]; entries: GeneratedJournalEntry[]; toleranceDays?: number }
