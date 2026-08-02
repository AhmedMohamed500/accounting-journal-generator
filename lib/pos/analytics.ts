import { posProviders } from "@/data/pos";
import type { PosOperation, PosProviderId, PosShiftSnapshot } from "@/types";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const isEffectivePosOperation = (operation: PosOperation) => (operation.status || "successful") === "successful" && !operation.reversalOfOperationId;

export function calculateProviderPerformance(operations: PosOperation[], balances: Record<PosProviderId, number>) {
  return posProviders.map((provider) => {
    const related = operations.filter((operation) => isEffectivePosOperation(operation) && (operation.providerId === provider.id || operation.destinationProviderId === provider.id));
    const volume = round(related.reduce((sum, operation) => sum + operation.amount, 0));
    const revenue = round(related.reduce((sum, operation) => sum + operation.revenue, 0));
    const cost = round(related.reduce((sum, operation) => sum + operation.expense, 0));
    const profit = round(revenue - cost), balance = round(balances[provider.id] || 0);
    const turnover = balance > 0 ? round(volume / balance) : volume > 0 ? 999 : 0;
    const health: "healthy" | "low" | "dormant" = related.length === 0 ? "dormant" : balance < Math.max(500, volume * .08) ? "low" : "healthy";
    return { providerId: provider.id, operations: related.length, volume, revenue, cost, profit, margin: revenue ? round(profit / revenue * 100) : 0, balance, turnover, health };
  });
}

export function countDuplicateRisks(operations: PosOperation[]) {
  const seen = new Set<string>(); let duplicates = 0;
  operations.filter(isEffectivePosOperation).forEach((operation) => {
    const key = `${operation.providerId || "cash"}|${operation.destinationProviderId || ""}|${operation.amount}|${operation.reference?.trim().toLowerCase() || ""}`;
    if (operation.reference && seen.has(key)) duplicates += 1;
    seen.add(key);
  });
  return duplicates;
}

export function calculatePosCommandCenter(snapshot: PosShiftSnapshot, operations: PosOperation[]) {
  const effective = operations.filter(isEffectivePosOperation);
  const wallets = round(Object.values(snapshot.expectedProviders).reduce((sum, value) => sum + value, 0));
  const otherExpenses = round(effective.filter((operation) => operation.type === "store-expense").reduce((sum, operation) => sum + operation.expense, 0));
  const fees = round(effective.reduce((sum, operation) => sum + operation.revenue, 0));
  const providerCosts = round(effective.reduce((sum, operation) => sum + operation.providerCost, 0));
  return {
    cash: snapshot.expectedCash, wallets, totalLiquidity: round(snapshot.expectedCash + wallets),
    moneyIn: round(effective.reduce((sum, operation) => sum + Math.max(operation.cashChange, 0), 0)),
    moneyOut: round(effective.reduce((sum, operation) => sum + Math.abs(Math.min(operation.cashChange, 0)), 0)),
    fees, providerCosts, otherExpenses, trueProfit: round(fees - providerCosts - otherExpenses),
    pending: operations.filter((operation) => operation.status === "pending").length,
    failed: operations.filter((operation) => operation.status === "failed").length,
    reversed: operations.filter((operation) => operation.status === "reversed" || operation.reversalOfOperationId).length,
    duplicateRisks: countDuplicateRisks(operations), unresolvedVariance: Math.abs(snapshot.totalVariance || 0),
  };
}

export function liquidityRecommendation(health: "healthy" | "low" | "dormant", ar: boolean) {
  if (health === "dormant") return ar ? "رصيد راكد: راجع جدوى الاحتفاظ به أو انقله لخدمة أسرع." : "Dormant balance: consider moving it to a faster service.";
  if (health === "low") return ar ? "الرصيد منخفض: غذِّ الخدمة أو أعد توزيع السيولة قبل نفاده." : "Low balance: top up or redistribute before it runs out.";
  return ar ? "الرصيد مناسب لمعدل الحركة الحالي." : "Balance suits current turnover.";
}

export const posReportCatalog = ["العمليات","الورديات","الخزنة","أرصدة المحافظ","العمولات","تكاليف مقدمي الخدمة","الربحية","الربحية حسب الشركة","الربحية حسب الخدمة","العجز والزيادة","الفروق غير المحسومة","العمليات المعلقة","العمليات الفاشلة","العمليات المستردة","التحويلات الداخلية","المصروفات الأخرى","الإيرادات الأخرى","توقع السيولة","الأرصدة الراكدة","تنبيهات التكرار","أداء الكاشير","مقارنة الفروع"] as const;
