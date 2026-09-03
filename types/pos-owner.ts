import type { PlanId } from "./service-point-demo";
import type { PosProviderId } from "./pos";

export type OwnerRecommendationType =
  | "LOW_SERVICE_BALANCE"
  | "IDLE_SERVICE_BALANCE"
  | "HIGH_CASH_EXPOSURE"
  | "SHIFT_DIFFERENCE"
  | "PENDING_TOO_LONG"
  | "FAILED_OPERATION_SPIKE"
  | "DUPLICATE_RISK"
  | "LOW_MARGIN_PROVIDER"
  | "HIGH_MARGIN_PROVIDER"
  | "CASHIER_DIFFERENCE_RISK"
  | "PROFIT_DROP"
  | "PROFIT_IMPROVEMENT"
  | "BACKUP_OVERDUE"
  | "TRIAL_ENDING";

export type OwnerRecommendationSeverity = "critical" | "high" | "medium" | "low" | "positive";
export type OwnerFeature = "summary" | "dailyBrief" | "recommendations" | "liquidity" | "cashiers" | "alerts" | "storeComparison" | "advancedComparison";

export interface OwnerRecommendation {
  id: string;
  type: OwnerRecommendationType;
  severity: OwnerRecommendationSeverity;
  priority: number;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  descriptionAr: string;
  descriptionEn: string;
  reason: string;
  relatedStore: string;
  relatedProvider?: PosProviderId;
  relatedCashier?: string;
  relatedShift?: string;
  amount?: number;
  actionAr: string;
  actionEn: string;
  actionType: "open" | "review" | "create";
  actionTarget: "operation" | "shift" | "backup" | "plans" | "providers" | "report";
  providerId?: PosProviderId;
  cashierName?: string;
  value?: number;
}

export const ownerFeatureMinimumPlan: Record<OwnerFeature, PlanId> = {
  summary: "starter",
  dailyBrief: "starter",
  recommendations: "pro",
  liquidity: "pro",
  cashiers: "pro",
  alerts: "pro",
  storeComparison: "business",
  advancedComparison: "business",
};
