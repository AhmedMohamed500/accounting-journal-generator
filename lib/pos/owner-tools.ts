import { posProviders } from "@/data/pos";
import { effectiveOperations, type LocalRuleSettings } from "./local-intelligence";
import type { PosOperation, PosProviderId, PosShift } from "@/types";

const round = (value: number) => Math.round(value * 100) / 100;
const isService = (item: PosOperation) => !["provider-topup", "internal-provider-transfer", "store-expense"].includes(item.type);
export interface DailyTargetProgress { profit: number; transactionCount: number; profitTarget: number; transactionTarget: number; pending: number; }
export function calculateDailyTargetProgress(operations: PosOperation[], rules: LocalRuleSettings, date: string): DailyTargetProgress {
  const today = effectiveOperations(operations).filter((item) => item.businessDate === date);
  return { profit: round(today.reduce((sum, item) => sum + item.profit, 0)), transactionCount: today.filter(isService).length, profitTarget: rules.dailyProfitTarget, transactionTarget: rules.dailyTransactionTarget, pending: operations.filter((item) => item.businessDate === date && item.status === "pending").length };
}
export interface CalendarDay { date: string; profit: number; transactions: number; variance: number | null; }
export function calculateProfitCalendar(operations: PosOperation[], shifts: PosShift[], month: string): CalendarDay[] {
  const days = new Map<string, CalendarDay>();
  for (const item of effectiveOperations(operations).filter((operation) => operation.businessDate.startsWith(month))) { const day = days.get(item.businessDate) || { date: item.businessDate, profit: 0, transactions: 0, variance: null }; day.profit = round(day.profit + item.profit); if (isService(item)) day.transactions++; days.set(item.businessDate, day); }
  for (const shift of shifts.filter((item) => item.businessDate.startsWith(month) && item.status === "closed" && item.actualClosingCash !== undefined)) { const day = days.get(shift.businessDate) || { date: shift.businessDate, profit: 0, transactions: 0, variance: null }; const related = operations.filter((item) => item.shiftId === shift.id && !["pending", "failed"].includes(item.status || "successful")); const expected = shift.openingCash + related.reduce((sum, item) => sum + item.cashChange, 0); day.variance = round((day.variance || 0) + shift.actualClosingCash! - expected); days.set(shift.businessDate, day); }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function calculateHourlyActivity(operations: PosOperation[]): { hour: number; transactions: number; profit: number }[] {
  const active = effectiveOperations(operations).filter(isService);
  return Array.from({ length: 24 }, (_, hour) => { const related = active.filter((item) => new Date(item.at).getHours() === hour); return { hour, transactions: related.length, profit: round(related.reduce((sum, item) => sum + item.profit, 0)) }; });
}
export interface ScenarioInput { feeChange: number; volumeChangePercent: number; providerCostChange: number; expenseChangePercent: number; additionalShiftCost: number; }
export interface ScenarioResult { revenue: number; providerCost: number; expenses: number; operatingProfit: number; liquidityDemand: number; transactionCount: number; }
export function simulateBusiness(operations: PosOperation[], scenario: ScenarioInput): ScenarioResult | null {
  const services = effectiveOperations(operations).filter(isService), expenses = effectiveOperations(operations).filter((item) => item.type === "store-expense");
  if (services.length < 3) return null;
  const multiplier = Math.max(0, 1 + scenario.volumeChangePercent / 100);
  const count = round(services.length * multiplier), revenue = round((services.reduce((sum, item) => sum + item.customerFee, 0) + scenario.feeChange * services.length) * multiplier), providerCost = round((services.reduce((sum, item) => sum + item.providerCost, 0) + scenario.providerCostChange * services.length) * multiplier), totalExpenses = round(expenses.reduce((sum, item) => sum + item.amount, 0) * Math.max(0, 1 + scenario.expenseChangePercent / 100) + scenario.additionalShiftCost);
  return { revenue, providerCost, expenses: totalExpenses, operatingProfit: round(revenue - providerCost - totalExpenses), liquidityDemand: round(services.reduce((sum, item) => sum + Math.max(0, -item.providerBalanceChange), 0) * multiplier), transactionCount: count };
}
export interface LocalForecast { operatingDays: number; transactions: number; cashRequirement: number; providers: Record<PosProviderId, number>; }
export function forecastNextOperatingDay(operations: PosOperation[]): LocalForecast | null {
  const active = effectiveOperations(operations), days = new Set(active.map((item) => item.businessDate));
  if (days.size < 3) return null;
  const services = active.filter(isService);
  return { operatingDays: days.size, transactions: round(services.length / days.size), cashRequirement: round(active.reduce((sum, item) => sum + Math.max(0, -item.cashChange), 0) / days.size), providers: Object.fromEntries(posProviders.map((provider) => [provider.id, round(active.reduce((sum, item) => sum + (item.providerId === provider.id ? Math.max(0, -item.providerBalanceChange) : 0), 0) / days.size)])) as Record<PosProviderId, number> };
}
export function calculateShiftComparison(shifts: PosShift[], operations: PosOperation[]): { current: number; recentAverage: number; unusual: boolean } | null {
  const closed = shifts.filter((item) => item.status === "closed").sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  if (closed.length < 4) return null;
  const profit = (shift: PosShift) => round(effectiveOperations(operations).filter((item) => item.shiftId === shift.id).reduce((sum, item) => sum + item.profit, 0));
  const current = profit(closed[0]), recentAverage = round(closed.slice(1, 4).reduce((sum, item) => sum + profit(item), 0) / 3);
  return { current, recentAverage, unusual: Math.abs(current - recentAverage) > Math.max(100, Math.abs(recentAverage) * .5) };
}
