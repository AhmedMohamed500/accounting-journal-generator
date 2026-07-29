export type CustodyKind = "temporary" | "permanent";
export type CustodyStatus = "open" | "partial" | "reimbursement-due" | "settled" | "permanent-active";
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
export interface CustodyReplenishment { id: string; date: string; amount: number; topUp: number; employeeDue: number; paymentAccountId: string; entryId: string; createdAt: string }
export interface CustodyAdvance {
  id: string;
  number: string;
  employee: string;
  purpose: string;
  issueDate: string;
  amount: number;
  kind?: CustodyKind;
  replenishmentPolicy?: "on-settlement" | "weekly" | "monthly";
  replenishedAmount?: number;
  lastReplenishedAt?: string;
  currency: string;
  paymentAccountId: string;
  status: CustodyStatus;
  settledAmount: number;
  returnedAmount: number;
  reimbursementAmount?: number;
  reimbursedAmount?: number;
  issueEntryId: string;
  settlements: CustodySettlement[];
  replenishments?: CustodyReplenishment[];
  createdAt: string;
}
export interface CustodyIssueInput { employee: string; purpose: string; issueDate: string; amount: number; currency: string; paymentAccountId: string; kind?: CustodyKind; replenishmentPolicy?: "on-settlement" | "weekly" | "monthly" }
export interface CustodySettlementInput { date: string; description: string; expenseAccountId?: string; netAmount: number; vatAmount: number; returnedAmount: number; documentReference?: string }
