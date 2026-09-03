import type { PlanId } from "@/types/service-point-demo";
import type { SalesDemoStep } from "@/types/sales-demo";

export function nextSalesDemoStep(step: SalesDemoStep): SalesDemoStep {
  return Math.min(7, step + 1) as SalesDemoStep;
}

export function recommendedDemoPlan(featuresSeen: string[], storeCount = 1): PlanId {
  if (storeCount > 1 || featuresSeen.includes("store-comparison")) return "business";
  if (featuresSeen.some((feature) => ["owner-command-center", "smart-brief", "cashier-performance", "advanced-alerts", "profitability"].includes(feature))) return "pro";
  return "starter";
}
