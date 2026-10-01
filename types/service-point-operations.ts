import type { PosProviderId } from "./pos";

export type ServicePointBalanceId = "cash" | PosProviderId;
export type OwnerMovementType = "capital-in" | "owner-withdrawal" | "manager-adjustment";
export type MovementDirection = "in" | "out";

export interface ServicePointMoneyMovement {
  id: string;
  shiftId: string;
  businessDate: string;
  at: string;
  type: OwnerMovementType;
  direction: MovementDirection;
  balanceId: ServicePointBalanceId;
  amount: number;
  cashChange: number;
  providerBalanceChange: number;
  authorizedBy: string;
  reference?: string;
  notes?: string;
  entryId?: string;
}

export interface ExpenseCategory { id: string; nameAr: string; nameEn: string; active: boolean; }
export interface MonthlyExpenseBudget { id: string; month: string; categoryId: string; amount: number; notes?: string; updatedAt: string; }
export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "resolved";
export interface ServicePointIncident {
  id: string;
  shiftId?: string;
  businessDate: string;
  at: string;
  category: "cash" | "provider" | "customer" | "device" | "security" | "other";
  severity: IncidentSeverity;
  title: string;
  details: string;
  reportedBy: string;
  status: IncidentStatus;
  resolvedAt?: string;
  resolution?: string;
}

export type ChecklistPhase = "opening" | "closing";
export interface ShiftChecklistItem { id: string; phase: ChecklistPhase; labelAr: string; labelEn: string; required: boolean; active: boolean; }
export interface ShiftChecklistCompletion { shiftId: string; itemId: string; completedAt: string; completedBy: string; }

export interface ServicePointOperationsData {
  schemaVersion: 1;
  movements: ServicePointMoneyMovement[];
  expenseCategories: ExpenseCategory[];
  budgets: MonthlyExpenseBudget[];
  incidents: ServicePointIncident[];
  checklistItems: ShiftChecklistItem[];
  checklistCompletions: ShiftChecklistCompletion[];
  managementNotes: Array<{ id: string; businessDate: string; at: string; text: string; author: string }>;
}
