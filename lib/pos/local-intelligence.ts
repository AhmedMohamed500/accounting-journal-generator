import { posProviders } from "@/data/pos";
import { calculatePosShiftSnapshot } from "@/lib/pos/engine";
import type { PosOperation, PosOperationType, PosProviderId, PosShift, PosShiftSnapshot } from "@/types";

export type ServiceBalanceId = PosProviderId | "cash";
export type HealthStatus = "healthy" | "watch" | "low" | "critical";
export interface LocalRuleSettings {
  schemaVersion: 1;
  minimumCash: number;
  minimumProviders: Partial<Record<PosProviderId, number>>;
  normalFees: Partial<Record<string, number>>;
  normalCosts: Partial<Record<string, number>>;
  dailyProfitTarget: number;
  dailyTransactionTarget: number;
  maxPending: number;
  maxVariance: number;
}
export const defaultLocalRules = (): LocalRuleSettings => ({ schemaVersion: 1, minimumCash: 1000, minimumProviders: {}, normalFees: {}, normalCosts: {}, dailyProfitTarget: 0, dailyTransactionTarget: 0, maxPending: 5, maxVariance: 0 });
export const feeRuleKey = (provider: PosProviderId, type: PosOperationType) => `${provider}:${type}`;
const round = (value: number) => Math.round(value * 100) / 100;
const isFinal = (operation: PosOperation) => (operation.status || "successful") === "successful" && !operation.reversalOfOperationId;
export const effectiveOperations = (operations: PosOperation[]) => operations.filter(isFinal);
const financialOperations = (operations: PosOperation[]) => effectiveOperations(operations).filter((item) => !["provider-topup", "internal-provider-transfer", "store-expense"].includes(item.type));
const inLastDays = (value: string, now: Date, days: number) => { const time = new Date(`${value}T12:00:00`).getTime(); const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime(); return time <= end && time > end - days * 86400000; };

export interface LeakageSignal { id: string; kind: "potential-leakage" | "needs-review"; titleAr: string; titleEn: string; count: number; impact?: number; }
export function calculateProfitLeakage(operations: PosOperation[], shifts: PosShift[], rules: LocalRuleSettings, now = new Date()): LeakageSignal[] {
  const recent = financialOperations(operations).filter((item) => inLastDays(item.businessDate, now, 7));
  const signals: LeakageSignal[] = [];
  const lowFees = recent.filter((item) => item.providerId && rules.normalFees[feeRuleKey(item.providerId, item.type)] !== undefined && item.customerFee < rules.normalFees[feeRuleKey(item.providerId, item.type)]!);
  if (lowFees.length) signals.push({ id: "low-fee", kind: "potential-leakage", titleAr: "عمولات أقل من القاعدة المحددة خلال 7 أيام", titleEn: "Fees below configured rule in 7 days", count: lowFees.length, impact: round(lowFees.reduce((sum, item) => sum + rules.normalFees[feeRuleKey(item.providerId!, item.type)]! - item.customerFee, 0)) });
  const highCosts = recent.filter((item) => item.providerId && rules.normalCosts[feeRuleKey(item.providerId, item.type)] !== undefined && item.providerCost > rules.normalCosts[feeRuleKey(item.providerId, item.type)]!);
  if (highCosts.length) signals.push({ id: "high-cost", kind: "potential-leakage", titleAr: "تكاليف مقدمي الخدمة أعلى من القاعدة", titleEn: "Provider costs above configured rule", count: highCosts.length, impact: round(highCosts.reduce((sum, item) => sum + item.providerCost - rules.normalCosts[feeRuleKey(item.providerId!, item.type)]!, 0)) });
  const losses = recent.filter((item) => item.profit < 0);
  if (losses.length) signals.push({ id: "loss", kind: "potential-leakage", titleAr: "عمليات بهامش سالب", titleEn: "Transactions with negative margin", count: losses.length, impact: round(-losses.reduce((sum, item) => sum + item.profit, 0)) });
  const expenses = effectiveOperations(operations).filter((item) => item.type === "store-expense" && inLastDays(item.businessDate, now, 7));
  if (expenses.length >= 3) signals.push({ id: "expenses", kind: "needs-review", titleAr: "مصروفات محل متكررة خلال 7 أيام", titleEn: "Repeated store expenses in 7 days", count: expenses.length, impact: round(expenses.reduce((sum, item) => sum + item.amount, 0)) });
  const missing = recent.filter((item) => !item.reference?.trim());
  if (missing.length) signals.push({ id: "missing-reference", kind: "needs-review", titleAr: "عمليات بلا مرجع", titleEn: "Transactions without reference", count: missing.length });
  const reversed = operations.filter((item) => item.status === "reversed" && inLastDays(item.businessDate, now, 7));
  if (reversed.length >= 3) signals.push({ id: "reversals", kind: "needs-review", titleAr: "استردادات متكررة", titleEn: "Repeated reversals", count: reversed.length });
  const closed = shifts.filter((shift) => shift.status === "closed" && shift.actualClosingCash !== undefined && inLastDays(shift.businessDate, now, 7));
  const shortages = closed.map((shift) => calculatePosShiftSnapshot(shift, operations, shift.actualClosingCash, Object.fromEntries(shift.providers.filter((item) => item.actualClosingBalance !== undefined).map((item) => [item.providerId, item.actualClosingBalance])))).filter((item) => (item.cashVariance || 0) < -0.01);
  if (shortages.length >= 2) signals.push({ id: "cash-shortage", kind: "potential-leakage", titleAr: "عجز خزنة متكرر", titleEn: "Repeated cash shortages", count: shortages.length, impact: round(-shortages.reduce((sum, item) => sum + (item.cashVariance || 0), 0)) });
  const pending = operations.filter((item) => item.status === "pending" && inLastDays(item.businessDate, now, 7));
  if (pending.length > rules.maxPending) signals.push({ id: "pending", kind: "needs-review", titleAr: "عمليات معلقة فوق الحد المحدد", titleEn: "Pending transactions above configured limit", count: pending.length });
  const failed = operations.filter((item) => item.status === "failed" && inLastDays(item.businessDate, now, 7));
  if (failed.length >= 3 && failed.length / Math.max(1, failed.length + recent.length) >= .2) signals.push({ id: "failed", kind: "needs-review", titleAr: "معدل فشل مرتفع", titleEn: "High failed transaction rate", count: failed.length });
  return signals;
}

export interface LiquidityRow { id: ServiceBalanceId; balance: number; minimum: number; averageDailyOutflow: number | null; runwayDays: number | null; status: HealthStatus; transactionCount: number; netFlow: number; fees: number; costs: number; profit: number; pending: number; failed: number; lastAt?: string; }
export function calculateLiquidity(snapshot: PosShiftSnapshot, operations: PosOperation[], rules: LocalRuleSettings, now = new Date()): LiquidityRow[] {
  const recent = operations.filter((item) => inLastDays(item.businessDate, now, 14));
  const days = new Set(recent.filter(isFinal).map((item) => item.businessDate)).size;
  const balances: { id: ServiceBalanceId; balance: number; minimum: number }[] = [{ id: "cash", balance: snapshot.expectedCash, minimum: rules.minimumCash }, ...posProviders.map((item) => ({ id: item.id, balance: snapshot.expectedProviders[item.id], minimum: rules.minimumProviders[item.id] || 0 }))];
  return balances.map(({ id, balance, minimum }) => {
    const related = recent.filter((item) => id === "cash" ? true : item.providerId === id || item.destinationProviderId === id);
    const active = effectiveOperations(related);
    const outgoing = active.reduce((sum, item) => { const change = id === "cash" ? item.cashChange : (item.providerId === id ? item.providerBalanceChange : 0) + (item.destinationProviderId === id ? item.amount : 0); return sum + Math.max(0, -change); }, 0);
    const daily = days >= 2 ? round(outgoing / days) : null;
    const runway = daily && daily > 0 ? round(balance / daily) : null;
    const status: HealthStatus = balance <= 0 || (minimum > 0 && balance < minimum * .5) || (runway !== null && runway < .5) ? "critical" : balance < minimum || (runway !== null && runway < 1) ? "low" : (minimum > 0 && balance < minimum * 1.5) || (runway !== null && runway < 2) ? "watch" : "healthy";
    return { id, balance, minimum, averageDailyOutflow: daily, runwayDays: runway, status, transactionCount: active.length, netFlow: round(active.reduce((sum, item) => sum + (id === "cash" ? item.cashChange : (item.providerId === id ? item.providerBalanceChange : 0) + (item.destinationProviderId === id ? item.amount : 0)), 0)), fees: round(active.reduce((sum, item) => sum + (id === "cash" ? item.revenue : item.providerId === id ? item.revenue : 0), 0)), costs: round(active.reduce((sum, item) => sum + (id === "cash" ? item.providerCost : item.providerId === id ? item.providerCost : 0), 0)), profit: round(active.reduce((sum, item) => sum + (id === "cash" ? item.profit : item.providerId === id ? item.profit : 0), 0)), pending: related.filter((item) => item.status === "pending").length, failed: related.filter((item) => item.status === "failed").length, lastAt: related.map((item) => item.at).sort().at(-1) };
  });
}

export const DEFAULT_DENOMINATIONS = [200, 100, 50, 20, 10, 5, 1] as const;
export function countCash(quantities: Record<number, number>): number { return round(Object.entries(quantities).reduce((sum, [value, quantity]) => sum + (Number(value) > 0 && Number.isInteger(quantity) && quantity >= 0 ? Number(value) * quantity : 0), 0)); }

export interface ProfitabilityRow { providerId: PosProviderId; type: PosOperationType; count: number; averageAmount: number; averageFee: number; averageCost: number; averageProfit: number; totalProfit: number; margin: number | null; label: "high-profit" | "low-margin" | "potential-loss" | "insufficient" | "standard"; }
export function calculateProfitability(operations: PosOperation[]): ProfitabilityRow[] {
  const groups = new Map<string, PosOperation[]>();
  for (const item of financialOperations(operations)) { if (!item.providerId) continue; const key = feeRuleKey(item.providerId, item.type); groups.set(key, [...(groups.get(key) || []), item]); }
  return [...groups.entries()].map(([key, items]) => { const [providerId, type] = key.split(":") as [PosProviderId, PosOperationType]; const count = items.length, totalProfit = round(items.reduce((sum, item) => sum + item.profit, 0)), fees = items.reduce((sum, item) => sum + item.customerFee, 0); const margin = fees > 0 ? round(totalProfit / fees * 100) : null; return { providerId, type, count, averageAmount: round(items.reduce((sum, item) => sum + item.amount, 0) / count), averageFee: round(fees / count), averageCost: round(items.reduce((sum, item) => sum + item.providerCost, 0) / count), averageProfit: round(totalProfit / count), totalProfit, margin, label: count < 3 ? "insufficient" as const : totalProfit < 0 ? "potential-loss" as const : margin !== null && margin < 20 ? "low-margin" as const : totalProfit >= 100 ? "high-profit" as const : "standard" as const }; }).sort((a, b) => b.totalProfit - a.totalProfit);
}
export function calculateBreakEven(monthlyExpenses: number, averageProfit: number): number | null { return monthlyExpenses >= 0 && averageProfit > 0 ? Math.ceil(monthlyExpenses / averageProfit) : null; }

export function previewOperationRisk(input: { operation: PosOperation; snapshot: PosShiftSnapshot; operations: PosOperation[]; rules: LocalRuleSettings }): { blocking: string[]; warnings: string[]; nextCash: number; nextProvider?: number } {
  const { operation, snapshot, operations, rules } = input;
  const nextCash = round(snapshot.expectedCash + operation.cashChange);
  const nextProvider = operation.providerId ? round(snapshot.expectedProviders[operation.providerId] + operation.providerBalanceChange) : undefined;
  const blocking: string[] = [], warnings: string[] = [];
  if (nextCash < 0) blocking.push("insufficient-cash");
  if (nextProvider !== undefined && nextProvider < 0) blocking.push("insufficient-provider");
  if (nextCash >= 0 && nextCash < rules.minimumCash) warnings.push("low-cash");
  if (operation.providerId && nextProvider !== undefined && nextProvider >= 0 && nextProvider < (rules.minimumProviders[operation.providerId] || 0)) warnings.push("low-provider");
  if (!operation.reference?.trim() && !["store-expense", "provider-topup"].includes(operation.type)) warnings.push("missing-reference");
  if (operation.reference && operations.some((item) => item.id !== operation.id && item.reference?.trim().toLowerCase() === operation.reference?.trim().toLowerCase() && item.status !== "failed" && item.status !== "reversed" && !item.reversalOfOperationId)) warnings.push("duplicate-reference");
  if (operation.providerId && rules.normalFees[feeRuleKey(operation.providerId, operation.type)] !== undefined && operation.customerFee < rules.normalFees[feeRuleKey(operation.providerId, operation.type)]!) warnings.push("low-fee");
  if (operation.profit < 0) warnings.push("negative-margin");
  return { blocking, warnings, nextCash, nextProvider };
}
