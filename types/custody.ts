export type CustodyStatus = "open" | "partial" | "reimbursement-due" | "settled";
export interface CustodySettlement {
  id: string;
  date: string;
  description: string;
  expenseAccountId?: string;
  netAmount: number;
  vatAmount: number;
  returnedAmount: number;
  excessAmount?: number;
  documentReference?: string;
  entryId: string;
  createdAt: string;
}
export interface CustodyAdvance {
  id: string;
  number: string;
  employee: string;
  purpose: string;
  issueDate: string;
  amount: number;
  currency: string;
  paymentAccountId: string;
  status: CustodyStatus;
  settledAmount: number;
  returnedAmount: number;
  reimbursementAmount?: number;
  reimbursedAmount?: number;
  issueEntryId: string;
  settlements: CustodySettlement[];
  createdAt: string;
}
export interface CustodyIssueInput { employee: string; purpose: string; issueDate: string; amount: number; currency: string; paymentAccountId: string }
export interface CustodySettlementInput { date: string; description: string; expenseAccountId?: string; netAmount: number; vatAmount: number; returnedAmount: number; documentReference?: string }
