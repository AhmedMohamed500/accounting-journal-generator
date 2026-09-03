import { posProviders } from "@/data/pos";
import { servicePointCommercialConfig } from "@/data/service-point-plans";
import { servicePointOwnerConfig as thresholds } from "@/data/service-point-owner-config";
import { calculateProviderPerformance, countDuplicateRisks, isEffectivePosOperation } from "@/lib/pos/analytics";
import { calculateCashierPerformance } from "@/lib/pos/control";
import { calculatePosShiftSnapshot } from "@/lib/pos/engine";
import type { PosOperation, PosProviderId, PosShift, PosShiftSnapshot } from "@/types";
import type { LocalSubscription, PlanId, ServicePointDemoSettings } from "@/types/service-point-demo";
import type { OwnerFeature, OwnerRecommendation, OwnerRecommendationSeverity } from "@/types/pos-owner";
import { ownerFeatureMinimumPlan } from "@/types/pos-owner";

const dayMs = 86_400_000;
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const dateKey = (value: Date) => value.toISOString().slice(0, 10);
const startOfUtcDay = (value: Date) => new Date(`${dateKey(value)}T00:00:00.000Z`);
const shiftDate = (value: Date, days: number) => new Date(startOfUtcDay(value).getTime() + days * dayMs);
const providerName = (id: PosProviderId, ar: boolean) => posProviders.find((provider) => provider.id === id)?.[ar ? "nameAr" : "nameEn"] || id;

export interface PeriodSummary {
  operations: number;
  volume: number;
  revenue: number;
  expenses: number;
  providerCosts: number;
  operatingExpenses: number;
  profit: number;
  pending: number;
  failed: number;
}

export interface OwnerCommandCenterInput {
  storeId: string;
  storeName: string;
  shifts: PosShift[];
  operations: PosOperation[];
  snapshot: PosShiftSnapshot;
  settings: ServicePointDemoSettings;
  subscription: LocalSubscription;
  now?: Date;
}

export function safePercentChange(current: number, previous: number) {
  return previous === 0 ? null : round(((current - previous) / Math.abs(previous)) * 100);
}

export function summarizePeriod(operations: PosOperation[], from: Date, to: Date): PeriodSummary {
  const fromTime = startOfUtcDay(from).getTime(), toTime = startOfUtcDay(to).getTime();
  const related = operations.filter((operation) => {
    const value = new Date(`${operation.businessDate}T00:00:00.000Z`).getTime();
    return value >= fromTime && value < toTime;
  });
  const effective = related.filter(isEffectivePosOperation);
  return {
    operations: effective.length,
    volume: round(effective.reduce((sum, operation) => sum + operation.amount, 0)),
    revenue: round(effective.reduce((sum, operation) => sum + operation.revenue, 0)),
    expenses: round(effective.reduce((sum, operation) => sum + operation.expense, 0)),
    providerCosts: round(effective.filter((operation) => operation.type !== "store-expense").reduce((sum, operation) => sum + operation.providerCost, 0)),
    operatingExpenses: round(effective.filter((operation) => operation.type === "store-expense").reduce((sum, operation) => sum + operation.expense, 0)),
    profit: round(effective.reduce((sum, operation) => sum + operation.profit, 0)),
    pending: related.filter((operation) => operation.status === "pending").length,
    failed: related.filter((operation) => operation.status === "failed").length,
  };
}

export function planCanAccess(plan: PlanId, feature: OwnerFeature) {
  const rank: Record<PlanId, number> = { starter: 1, pro: 2, business: 3 };
  return rank[plan] >= rank[ownerFeatureMinimumPlan[feature]];
}

type RecommendationDraft = Omit<OwnerRecommendation, "id" | "descriptionAr" | "descriptionEn" | "reason" | "relatedStore" | "relatedProvider" | "relatedCashier" | "amount" | "actionType">;
function recommendation(input: RecommendationDraft): OwnerRecommendation {
  return { ...input, id: `${input.type}:${input.providerId || input.cashierName || input.value || "store"}`, descriptionAr: input.detailAr, descriptionEn: input.detailEn, reason: input.type, relatedStore: "", relatedProvider: input.providerId, relatedCashier: input.cashierName, amount: input.value, actionType: input.actionTarget === "backup" ? "create" : input.actionTarget === "operation" || input.actionTarget === "shift" ? "review" : "open" };
}

const severityRank: Record<OwnerRecommendationSeverity, number> = { critical: 5, high: 4, medium: 3, low: 2, positive: 1 };
export function sortRecommendations(items: OwnerRecommendation[]) {
  return [...items].sort((a, b) => b.priority - a.priority || severityRank[b.severity] - severityRank[a.severity] || a.id.localeCompare(b.id));
}

export function buildOwnerCommandCenter(input: OwnerCommandCenterInput) {
  const now = input.now || new Date(), todayStart = startOfUtcDay(now), tomorrow = shiftDate(now, 1), yesterday = shiftDate(now, -1);
  const weekStart = shiftDate(now, -6), priorWeekStart = shiftDate(now, -13);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const today = summarizePeriod(input.operations, todayStart, tomorrow);
  const yesterdaySummary = summarizePeriod(input.operations, yesterday, todayStart);
  const week = summarizePeriod(input.operations, weekStart, tomorrow);
  const priorWeek = summarizePeriod(input.operations, priorWeekStart, weekStart);
  const month = summarizePeriod(input.operations, monthStart, tomorrow);
  const todayOperations = input.operations.filter((operation) => operation.businessDate === dateKey(now));
  const providerPerformance = calculateProviderPerformance(todayOperations, input.snapshot.expectedProviders);
  const cashierPerformance = calculateCashierPerformance(input.shifts, input.operations).map((cashier) => {
    const absoluteVariance = Math.abs(cashier.variance);
    const status = absoluteVariance >= thresholds.differenceCritical || cashier.failed >= thresholds.failedSpikeCount ? "needs-review" : absoluteVariance >= thresholds.differenceWarning || cashier.pending > 1 ? "stable" : "excellent";
    return { ...cashier, status: status as "excellent" | "stable" | "needs-review" };
  });
  const recommendations: OwnerRecommendation[] = [];
  for (const provider of providerPerformance) {
    const lowLimit = Math.max(thresholds.lowBalanceAbsolute, provider.volume * thresholds.lowBalanceCoverageRatio);
    if (provider.balance < lowLimit && provider.volume > 0) { const coverage = round(provider.balance / provider.volume); recommendations.push(recommendation({ type: "LOW_SERVICE_BALANCE", severity: provider.balance < thresholds.lowBalanceAbsolute ? "critical" : "high", priority: 96, titleAr: `رصيد ${providerName(provider.providerId, true)} منخفض`, titleEn: `${providerName(provider.providerId, false)} balance is low`, detailAr: `الرصيد الحالي ${provider.balance.toLocaleString()} ج.م، حركة الفترة ${provider.volume.toLocaleString()} ج.م، والتغطية التقديرية ${coverage} يوم. تقدير مبني على حركة الفترة الحالية.`, detailEn: `Current balance is ${provider.balance.toLocaleString()} EGP, period usage is ${provider.volume.toLocaleString()} EGP, and estimated coverage is ${coverage} day(s), based on current-period activity.`, actionAr: "غذِّ الرصيد قبل العملية التالية", actionEn: "Top up before the next operation", actionTarget: "providers", providerId: provider.providerId, value: provider.balance })); }
    if (provider.balance >= thresholds.idleBalanceAbsolute && provider.turnover < thresholds.idleTurnoverRatio) recommendations.push(recommendation({ type: "IDLE_SERVICE_BALANCE", severity: "medium", priority: 66, titleAr: `سيولة راكدة في ${providerName(provider.providerId, true)}`, titleEn: `Idle balance in ${providerName(provider.providerId, false)}`, detailAr: `الرصيد ${provider.balance.toLocaleString()} ج.م والحركة محدودة اليوم.`, detailEn: `${provider.balance.toLocaleString()} EGP is held with limited movement today.`, actionAr: "أعد توزيع جزء من السيولة", actionEn: "Redistribute part of the liquidity", actionTarget: "providers", providerId: provider.providerId, value: provider.balance }));
    if (provider.operations >= 2 && provider.margin < thresholds.lowMarginPercent) recommendations.push(recommendation({ type: "LOW_MARGIN_PROVIDER", severity: "medium", priority: 60, titleAr: `هامش ${providerName(provider.providerId, true)} يحتاج مراجعة`, titleEn: `${providerName(provider.providerId, false)} margin needs review`, detailAr: `الهامش الحالي ${provider.margin}% عبر ${provider.operations} عمليات.`, detailEn: `Current margin is ${provider.margin}% across ${provider.operations} operations.`, actionAr: "راجع العمولة وتكلفة الخدمة", actionEn: "Review fees and provider cost", actionTarget: "report", providerId: provider.providerId, value: provider.margin }));
    if (provider.operations >= 2 && provider.margin >= thresholds.highMarginPercent) recommendations.push(recommendation({ type: "HIGH_MARGIN_PROVIDER", severity: "positive", priority: 28, titleAr: `${providerName(provider.providerId, true)} يحقق هامشًا قويًا`, titleEn: `${providerName(provider.providerId, false)} has a strong margin`, detailAr: `هامش ${provider.margin}% وربح ${provider.profit.toLocaleString()} ج.م اليوم.`, detailEn: `${provider.margin}% margin and ${provider.profit.toLocaleString()} EGP profit today.`, actionAr: "حافظ على توافر الخدمة", actionEn: "Keep the service available", actionTarget: "providers", providerId: provider.providerId, value: provider.margin }));
  }
  const totalLiquidity = input.snapshot.expectedCash + Object.values(input.snapshot.expectedProviders).reduce((sum, value) => sum + value, 0);
  const cashShare = totalLiquidity > 0 ? input.snapshot.expectedCash / totalLiquidity : 0;
  if (input.snapshot.expectedCash >= thresholds.highCashAbsolute && cashShare >= thresholds.highCashShare) recommendations.push(recommendation({ type: "HIGH_CASH_EXPOSURE", severity: "high", priority: 91, titleAr: "تعرض نقدي مرتفع داخل الخزنة", titleEn: "High cash exposure", detailAr: `${Math.round(cashShare * 100)}% من السيولة موجودة نقدًا في الخزنة.`, detailEn: `${Math.round(cashShare * 100)}% of liquidity is held as cash.`, actionAr: "راجع الإيداع أو توزيع السيولة", actionEn: "Review deposit or liquidity allocation", actionTarget: "providers", value: input.snapshot.expectedCash }));
  const closedSnapshots = input.shifts.filter((shift) => shift.status === "closed").map((shift) => ({ shift, snapshot: calculatePosShiftSnapshot(shift, input.operations, shift.actualClosingCash, Object.fromEntries(shift.providers.map((provider) => [provider.providerId, provider.actualClosingBalance])) as Partial<Record<PosProviderId, number>>) }));
  for (const item of closedSnapshots.filter((item) => Math.abs(item.snapshot.totalVariance || 0) >= thresholds.differenceWarning)) recommendations.push(recommendation({ type: "SHIFT_DIFFERENCE", severity: Math.abs(item.snapshot.totalVariance || 0) >= thresholds.differenceCritical ? "critical" : "medium", priority: 88, titleAr: "فرق وردية يحتاج متابعة", titleEn: "Shift difference needs follow-up", detailAr: `وردية ${item.shift.cashierName}: فرق ${Math.abs(item.snapshot.totalVariance || 0).toLocaleString()} ج.م.`, detailEn: `${item.shift.cashierName}'s shift has a ${Math.abs(item.snapshot.totalVariance || 0).toLocaleString()} EGP difference.`, actionAr: "افتح تفاصيل الإقفال وراجع الإثباتات", actionEn: "Review closeout details and evidence", actionTarget: "shift", relatedShift: item.shift.id, cashierName: item.shift.cashierName, value: Math.abs(item.snapshot.totalVariance || 0) }));
  const oldPending = todayOperations.filter((operation) => operation.status === "pending" && now.getTime() - new Date(operation.at).getTime() >= thresholds.pendingHours * 3_600_000);
  if (oldPending.length) recommendations.push(recommendation({ type: "PENDING_TOO_LONG", severity: "high", priority: 94, titleAr: "عمليات معلقة منذ وقت طويل", titleEn: "Operations pending too long", detailAr: `${oldPending.length} عملية تجاوزت ساعة دون حسم.`, detailEn: `${oldPending.length} operation(s) have been unresolved for over an hour.`, actionAr: "تحقق من مقدم الخدمة ثم احسم الحالة", actionEn: "Verify with the provider and resolve status", actionTarget: "operation", value: oldPending.length }));
  if (today.failed >= thresholds.failedSpikeCount) recommendations.push(recommendation({ type: "FAILED_OPERATION_SPIKE", severity: "critical", priority: 98, titleAr: "ارتفاع مفاجئ في العمليات الفاشلة", titleEn: "Failed operation spike", detailAr: `${today.failed} عمليات فاشلة اليوم.`, detailEn: `${today.failed} failed operations today.`, actionAr: "أوقف التكرار وراجع مقدم الخدمة", actionEn: "Pause retries and review the provider", actionTarget: "operation", value: today.failed }));
  const duplicateRisks = countDuplicateRisks(todayOperations);
  if (duplicateRisks) recommendations.push(recommendation({ type: "DUPLICATE_RISK", severity: "high", priority: 93, titleAr: "احتمال تكرار عمليات", titleEn: "Possible duplicate operations", detailAr: `${duplicateRisks} حالة لها نفس المسار والقيمة والمرجع.`, detailEn: `${duplicateRisks} case(s) share the same route, amount, and reference.`, actionAr: "راجع المراجع قبل أي إعادة تنفيذ", actionEn: "Review references before retrying", actionTarget: "operation", value: duplicateRisks }));
  for (const cashier of cashierPerformance.filter((item) => item.status === "needs-review")) recommendations.push(recommendation({ type: "CASHIER_DIFFERENCE_RISK", severity: "high", priority: 87, titleAr: `وردية ${cashier.cashierName} تحتاج مراجعة`, titleEn: `${cashier.cashierName}'s shift needs review`, detailAr: `فرق ${Math.abs(cashier.variance).toLocaleString()} ج.م مع ${cashier.failed} عملية فاشلة.`, detailEn: `${Math.abs(cashier.variance).toLocaleString()} EGP variance with ${cashier.failed} failed operation(s).`, actionAr: "راجع الوردية بهدوء مع الكاشير", actionEn: "Review the shift constructively with the cashier", actionTarget: "shift", relatedShift: cashier.shiftId, cashierName: cashier.cashierName, value: Math.abs(cashier.variance) }));
  const profitChange = safePercentChange(today.profit, yesterdaySummary.profit);
  if (profitChange !== null && profitChange <= -thresholds.profitChangePercent) recommendations.push(recommendation({ type: "PROFIT_DROP", severity: "high", priority: 84, titleAr: "ربح اليوم أقل من أمس", titleEn: "Profit is down from yesterday", detailAr: `انخفاض ${Math.abs(profitChange)}% مقارنة بأمس.`, detailEn: `Profit is down ${Math.abs(profitChange)}% versus yesterday.`, actionAr: "راجع حجم الحركة وهوامش الخدمات", actionEn: "Review volume and provider margins", actionTarget: "report", value: profitChange }));
  if (profitChange !== null && profitChange >= thresholds.profitChangePercent) recommendations.push(recommendation({ type: "PROFIT_IMPROVEMENT", severity: "positive", priority: 24, titleAr: "تحسن واضح في الربح", titleEn: "Profit improved", detailAr: `زيادة ${profitChange}% مقارنة بأمس.`, detailEn: `Profit is up ${profitChange}% versus yesterday.`, actionAr: "حدد الخدمات التي صنعت التحسن", actionEn: "Identify the services driving the gain", actionTarget: "report", value: profitChange }));
  const backupAgeDays = input.settings.lastBackupAt ? (now.getTime() - new Date(input.settings.lastBackupAt).getTime()) / dayMs : Infinity;
  if (backupAgeDays >= servicePointCommercialConfig.backupReminderDays) recommendations.push(recommendation({ type: "BACKUP_OVERDUE", severity: "medium", priority: 72, titleAr: "النسخة الاحتياطية متأخرة", titleEn: "Backup is overdue", detailAr: "بيانات هذا الجهاز تحتاج Backup محليًا جديدًا.", detailEn: "This device needs a fresh local backup.", actionAr: "نزّل Backup الآن", actionEn: "Download a backup now", actionTarget: "backup" }));
  const trialDays = Math.max(0, Math.ceil((new Date(input.subscription.trialEndsAt).getTime() - now.getTime()) / dayMs));
  if (input.subscription.subscriptionStatus === "trial" && trialDays <= thresholds.trialEndingDays) recommendations.push(recommendation({ type: "TRIAL_ENDING", severity: trialDays <= 1 ? "high" : "medium", priority: 70, titleAr: "التجربة تقترب من الانتهاء", titleEn: "Trial is ending soon", detailAr: `متبقي ${trialDays} يوم في التجربة المحلية.`, detailEn: `${trialDays} day(s) remain in the local trial.`, actionAr: "راجع الباقات وخطة التفعيل", actionEn: "Review plans and activation", actionTarget: "plans", value: trialDays }));
  const sorted = sortRecommendations(recommendations).map((item) => ({ ...item, relatedStore: input.storeId }));
  const urgent = sorted.filter((item) => item.severity === "critical" || item.severity === "high");
  const brief = {
    happenedAr: `تم تنفيذ ${today.operations} عملية بحجم ${today.volume.toLocaleString()} ج.م وربح ${today.profit.toLocaleString()} ج.م اليوم.`,
    happenedEn: `${today.operations} operations moved ${today.volume.toLocaleString()} EGP and generated ${today.profit.toLocaleString()} EGP today.`,
    attentionAr: urgent.length ? `هناك ${urgent.length} نقطة ذات أولوية؛ أهمها: ${urgent[0].titleAr}.` : "لا توجد إشارات حرجة في بيانات اليوم.",
    attentionEn: urgent.length ? `${urgent.length} priority item(s); first: ${urgent[0].titleEn}.` : "No critical signals in today's data.",
    actionsAr: sorted.slice(0, 3).map((item) => item.actionAr),
    actionsEn: sorted.slice(0, 3).map((item) => item.actionEn),
  };
  const monthProviders = calculateProviderPerformance(input.operations.filter((operation) => new Date(`${operation.businessDate}T00:00:00.000Z`) >= monthStart && new Date(`${operation.businessDate}T00:00:00.000Z`) < tomorrow), input.snapshot.expectedProviders);
  const bestMonthlyProvider = [...monthProviders].sort((a, b) => b.profit - a.profit)[0];
  const highestMonthlyMargin = [...monthProviders].filter((item) => item.operations > 0).sort((a, b) => b.margin - a.margin)[0];
  const largestMonthDifference = closedSnapshots.filter((item) => item.shift.businessDate >= dateKey(monthStart)).reduce((max, item) => Math.max(max, Math.abs(item.snapshot.totalVariance || 0)), 0);
  const elapsedMonthDays = Math.max(1, now.getUTCDate());
  const rankedCashiers = [...cashierPerformance].sort((a, b) => b.profitPerHour - a.profitPerHour || b.profit - a.profit);
  const topCashier = rankedCashiers[0];
  return {
    today,
    yesterday: yesterdaySummary,
    week,
    priorWeek,
    month,
    comparisons: { todayProfit: safePercentChange(today.profit, yesterdaySummary.profit), todayOperations: safePercentChange(today.operations, yesterdaySummary.operations), todayAverageProfit: safePercentChange(today.operations ? today.profit / today.operations : 0, yesterdaySummary.operations ? yesterdaySummary.profit / yesterdaySummary.operations : 0), weekProfit: safePercentChange(week.profit, priorWeek.profit), weekOperations: safePercentChange(week.operations, priorWeek.operations), weekAverageProfit: safePercentChange(week.operations ? week.profit / week.operations : 0, priorWeek.operations ? priorWeek.profit / priorWeek.operations : 0), todayVolume: safePercentChange(today.volume, yesterdaySummary.volume) },
    monthlyInsights: { bestProviderId: bestMonthlyProvider?.operations ? bestMonthlyProvider.providerId : undefined, highestMarginProviderId: highestMonthlyMargin?.providerId, largestShiftDifference: round(largestMonthDifference), averageDailyProfit: round(month.profit / elapsedMonthDays) },
    providerPerformance: [...providerPerformance].sort((a, b) => b.profit - a.profit || b.margin - a.margin),
    cashierPerformance: rankedCashiers,
    cashierInsight: topCashier ? { cashierName: topCashier.cashierName, titleAr: `${topCashier.cashierName} حقق أعلى ربح لكل ساعة في البيانات الحالية.`, titleEn: `${topCashier.cashierName} generated the highest profit per hour in the current data.` } : undefined,
    recommendations: sorted,
    brief,
  };
}

export function compareStores(stores: OwnerCommandCenterInput[]) {
  return stores.map((store) => {
    const model = buildOwnerCommandCenter(store);
    return { storeId: store.storeId, storeName: store.storeName, profit: model.today.profit, volume: model.today.volume, operations: model.today.operations, difference: model.monthlyInsights.largestShiftDifference, topCashier: model.cashierInsight?.cashierName, prioritySignals: model.recommendations.filter((item) => item.severity === "critical" || item.severity === "high").length };
  }).sort((a, b) => b.profit - a.profit || b.volume - a.volume);
}
