import { itemOutstanding } from "./aging";
import { roundCurrency } from "@/lib/accounting/calculations";
import type { OpenItem, Party } from "@/types";

export interface ScheduledCashflowItem { item: OpenItem; party: Party; outstanding: number; daysLate: number; priority: "critical" | "high" | "normal" }
export interface CashflowPlan {
  overdueReceipts: number; overduePayments: number; dueTodayReceipts: number; dueTodayPayments: number;
  receipts7: number; payments7: number; receipts30: number; payments30: number;
  projected7: number; projected30: number; shortfall7: number; shortfall30: number;
  schedule: ScheduledCashflowItem[]; collectionSuggestions: ScheduledCashflowItem[]; paymentPriorities: ScheduledCashflowItem[];
}

const dateAfter = (date: string, days: number) => { const value = new Date(date); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };
const between = (date: string, from: string, to: string) => date >= from && date <= to;
const total = (items: ScheduledCashflowItem[]) => roundCurrency(items.reduce((sum, current) => sum + current.outstanding, 0));

export function buildCashflowPlan(parties: Party[], items: OpenItem[], asOf: string, availableLiquidity: number): CashflowPlan {
  const schedule = items.flatMap((item) => { const party = parties.find((current) => current.id === item.partyId), outstanding = itemOutstanding(item); if (!party || !outstanding) return []; const daysLate = Math.max(0, Math.floor((new Date(asOf).getTime() - new Date(item.dueDate).getTime()) / 86400000)), priority = daysLate > 60 ? "critical" as const : daysLate > 0 ? "high" as const : "normal" as const; return [{ item, party, outstanding, daysLate, priority }]; }).sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate));
  const receipts = schedule.filter((current) => current.item.kind === "receivable"), payments = schedule.filter((current) => current.item.kind === "payable"), end7 = dateAfter(asOf, 7), end30 = dateAfter(asOf, 30);
  const overdueReceipts = total(receipts.filter((current) => current.item.dueDate < asOf)), overduePayments = total(payments.filter((current) => current.item.dueDate < asOf)), dueTodayReceipts = total(receipts.filter((current) => current.item.dueDate === asOf)), dueTodayPayments = total(payments.filter((current) => current.item.dueDate === asOf));
  const receipts7 = total(receipts.filter((current) => between(current.item.dueDate, asOf, end7))), payments7 = total(payments.filter((current) => between(current.item.dueDate, asOf, end7))), receipts30 = total(receipts.filter((current) => between(current.item.dueDate, asOf, end30))), payments30 = total(payments.filter((current) => between(current.item.dueDate, asOf, end30)));
  const projected7 = roundCurrency(availableLiquidity + receipts7 - payments7), projected30 = roundCurrency(availableLiquidity + receipts30 - payments30), shortfall7 = Math.max(0, -projected7), shortfall30 = Math.max(0, -projected30);
  const needed = Math.max(shortfall7, shortfall30), rankedReceipts = [...receipts].sort((a, b) => b.daysLate - a.daysLate || a.item.dueDate.localeCompare(b.item.dueDate) || b.outstanding - a.outstanding); let accumulated = 0;
  const collectionSuggestions = needed ? rankedReceipts.filter((current) => { if (accumulated >= needed) return false; accumulated += current.outstanding; return true; }) : rankedReceipts.slice(0, 5);
  const paymentPriorities = [...payments].sort((a, b) => b.daysLate - a.daysLate || a.item.dueDate.localeCompare(b.item.dueDate) || b.outstanding - a.outstanding).slice(0, 10);
  return { overdueReceipts, overduePayments, dueTodayReceipts, dueTodayPayments, receipts7, payments7, receipts30, payments30, projected7, projected30, shortfall7, shortfall30, schedule, collectionSuggestions, paymentPriorities };
}
