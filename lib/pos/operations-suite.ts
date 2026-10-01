import { defaultAccounts } from "@/data/accounts";
import { posAccountCodes, posLedgerAccounts, posProviders } from "@/data/pos";
import { calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { isEffectivePosOperation } from "@/lib/pos/analytics";
import { detectPosControlSignals } from "@/lib/pos/control";
import { roundCurrency } from "@/lib/accounting/calculations";
import type { GeneratedJournalEntry, JournalEntryLine, PosOperation, PosProviderId, PosShift } from "@/types";
import type { ChecklistPhase, ExpenseCategory, MonthlyExpenseBudget, ServicePointIncident, ServicePointMoneyMovement, ServicePointOperationsData, ServicePointBalanceId } from "@/types/service-point-operations";
import type { ShiftHandover } from "@/lib/storage/service-point-innovation";

const account = (code: string) => posLedgerAccounts.find((item) => item.code === code) || defaultAccounts.find((item) => item.code === code);
const journalLine = (code: string, debit: number, credit: number, descriptionAr: string, descriptionEn: string): JournalEntryLine => ({ id: crypto.randomUUID(), accountCode: code, accountNameAr: account(code)?.nameAr || code, accountNameEn: account(code)?.nameEn || code, debit: roundCurrency(debit), credit: roundCurrency(credit), descriptionAr, descriptionEn });
const balanceCode = (balanceId: ServicePointBalanceId) => balanceId === "cash" ? posAccountCodes.cash : posProviders.find((item) => item.id === balanceId)!.accountCode;
const finalOperation = (item: PosOperation) => !["pending", "failed"].includes(item.status || "successful");

export function createServicePointMovement(input: Omit<ServicePointMoneyMovement, "id" | "at" | "cashChange" | "providerBalanceChange">): ServicePointMoneyMovement {
  const amount = roundCurrency(input.amount);
  if (!input.shiftId) throw new Error("الحركة يجب أن ترتبط بوردية مفتوحة");
  if (amount <= 0) throw new Error("قيمة الحركة يجب أن تكون أكبر من صفر");
  if (!input.authorizedBy.trim()) throw new Error("اكتب اسم الشخص الذي اعتمد الحركة");
  const sign = input.direction === "in" ? 1 : -1;
  if (input.type === "capital-in" && sign < 0) throw new Error("إضافة رأس المال حركة داخلة");
  if (input.type === "owner-withdrawal" && sign > 0) throw new Error("مسحوب المالك حركة خارجة");
  return { ...input, amount, id: crypto.randomUUID(), at: new Date().toISOString(), cashChange: input.balanceId === "cash" ? sign * amount : 0, providerBalanceChange: input.balanceId === "cash" ? 0 : sign * amount };
}

export function createServicePointMovementEntry(movement: ServicePointMoneyMovement): GeneratedJournalEntry {
  const asset = balanceCode(movement.balanceId), incoming = movement.direction === "in";
  const offset = movement.type === "capital-in" ? "3100" : movement.type === "owner-withdrawal" ? "3200" : posAccountCodes.cashOverShort;
  const ar = `${movement.authorizedBy} — ${movement.notes || movement.reference || movement.type}`;
  const en = `${movement.authorizedBy} — ${movement.notes || movement.reference || movement.type}`;
  const lines = incoming
    ? [journalLine(asset, movement.amount, 0, ar, en), journalLine(offset, 0, movement.amount, ar, en)]
    : [journalLine(offset, movement.amount, 0, ar, en), journalLine(asset, 0, movement.amount, ar, en)];
  const isCapital = movement.type === "capital-in", isDraw = movement.type === "owner-withdrawal";
  const assetImpact = incoming ? movement.amount : -movement.amount;
  const profit = isCapital || isDraw ? 0 : assetImpact;
  return { id: crypto.randomUUID(), entryNumber: `POS-MOVE-${Date.now().toString().slice(-7)}`, date: movement.businessDate, transactionType: `pos-${movement.type}`, titleAr: "حركة أموال إدارية", titleEn: "Management money movement", narrationAr: ar, narrationEn: en, currency: "EGP", lines, totalDebit: movement.amount, totalCredit: movement.amount, isBalanced: true, workflowStatus: "draft", source: "service-point", reference: movement.reference, sourceReference: movement.id, linkedTransactionIds: [movement.id], cashFlowCategory: isCapital || isDraw ? "financing" : "operating", confidence: 100, explanationAr: ["الحركة منفصلة عن المبيعات والعمولات ولا تزيد عدد العمليات أو حجمها.", `تم تحديث ${movement.balanceId === "cash" ? "الخزنة" : "رصيد مقدم الخدمة"} بقيمة ${assetImpact.toLocaleString("ar-EG")} جنيه.`], explanationEn: ["This movement is separate from sales, fees, and transaction volume."], assumptionsAr: ["الحركة معتمدة من الشخص المسجل."], assumptionsEn: ["The recorded authorizer approved this movement."], warningsAr: [], warningsEn: [], accountingRuleAr: "رأس المال والمسحوبات تُثبت ضمن حقوق الملكية، والتعديل الإداري في حساب العجز والزيادة.", accountingRuleEn: "Capital and drawings post to equity; management adjustments post to over/short.", financialStatementImpact: { assets: assetImpact, liabilities: 0, equity: isCapital ? movement.amount : isDraw ? -movement.amount : profit, revenue: 0, expenses: profit ? -profit : 0, profit, cash: movement.cashChange } };
}

export function monthlyBudgetStatus(operations: PosOperation[], budgets: MonthlyExpenseBudget[], categories: ExpenseCategory[], month: string) {
  return categories.filter((item) => item.active).map((category) => {
    const budget = budgets.find((item) => item.month === month && item.categoryId === category.id)?.amount || 0;
    const actual = roundCurrency(operations.filter((item) => item.businessDate.startsWith(month) && item.type === "store-expense" && item.expenseCategoryId === category.id && finalOperation(item)).reduce((sum, item) => sum + item.expense, 0));
    return { category, budget, actual, remaining: roundCurrency(budget - actual), usage: budget > 0 ? roundCurrency(actual / budget * 100) : null };
  });
}

export function checklistProgress(data: ServicePointOperationsData, shiftId: string, phase: ChecklistPhase) {
  const items = data.checklistItems.filter((item) => item.active && item.phase === phase), completed = new Set(data.checklistCompletions.filter((item) => item.shiftId === shiftId).map((item) => item.itemId));
  return { items: items.map((item) => ({ ...item, completed: completed.has(item.id) })), done: items.filter((item) => completed.has(item.id)).length, total: items.length, requiredMissing: items.filter((item) => item.required && !completed.has(item.id)) };
}

export function providerStatement(providerId: PosProviderId, shifts: PosShift[], operations: PosOperation[], movements: ServicePointMoneyMovement[]) {
  const shiftIds = new Set(shifts.map((item) => item.id));
  const rows = [
    ...operations.filter((item) => shiftIds.has(item.shiftId) && finalOperation(item) && (item.providerId === providerId || item.destinationProviderId === providerId)).map((item) => ({ id: item.id, at: item.at, kind: "operation" as const, reference: item.reference || item.type, change: roundCurrency((item.providerId === providerId ? item.providerBalanceChange : 0) + (item.destinationProviderId === providerId ? item.amount : 0)) })),
    ...movements.filter((item) => shiftIds.has(item.shiftId) && item.balanceId === providerId).map((item) => ({ id: item.id, at: item.at, kind: "movement" as const, reference: item.reference || item.type, change: item.providerBalanceChange })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const opening = shifts.at(-1)?.providers.find((item) => item.providerId === providerId)?.openingBalance || 0;
  let running = opening;
  return { opening, rows: rows.map((item) => ({ ...item, balance: running = roundCurrency(running + item.change) })), closing: roundCurrency(running) };
}

export function reconciliationRows(shift: PosShift, operations: PosOperation[], movements: ServicePointMoneyMovement[]) {
  const snapshot = calculatePosShiftSnapshot(shift, operations, undefined, undefined, movements);
  return [{ id: "cash" as const, expected: snapshot.expectedCash, actual: shift.actualClosingCash }, ...posProviders.map((provider) => ({ id: provider.id, expected: snapshot.expectedProviders[provider.id], actual: shift.providers.find((item) => item.providerId === provider.id)?.actualClosingBalance }))].map((item) => ({ ...item, variance: item.actual === undefined ? undefined : roundCurrency(item.actual - item.expected) }));
}

export function buildShiftTimeline(shift: PosShift, operations: PosOperation[], data: ServicePointOperationsData, handovers: ShiftHandover[]) {
  return [
    { id: `open-${shift.id}`, at: shift.openedAt, kind: "shift-open", title: `فتح الوردية — ${shift.cashierName}` },
    ...operations.filter((item) => item.shiftId === shift.id).map((item) => ({ id: item.id, at: item.at, kind: "operation", title: `${item.type} · ${item.amount}` })),
    ...data.movements.filter((item) => item.shiftId === shift.id).map((item) => ({ id: item.id, at: item.at, kind: "movement", title: `${item.type} · ${item.amount}` })),
    ...data.incidents.filter((item) => item.shiftId === shift.id).map((item) => ({ id: item.id, at: item.at, kind: "incident", title: item.title })),
    ...data.checklistCompletions.filter((item) => item.shiftId === shift.id).map((item) => ({ id: `${item.shiftId}-${item.itemId}`, at: item.completedAt, kind: "checklist", title: data.checklistItems.find((entry) => entry.id === item.itemId)?.labelAr || item.itemId })),
    ...handovers.filter((item) => item.shiftId === shift.id).map((item) => ({ id: `handover-${item.shiftId}`, at: item.createdAt, kind: "handover", title: "تسليم الوردية" })),
    ...(shift.closedAt ? [{ id: `close-${shift.id}`, at: shift.closedAt, kind: "shift-close", title: "إغلاق الوردية" }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

export function buildExceptionCenter(shifts: PosShift[], operations: PosOperation[], data: ServicePointOperationsData, now = new Date()) {
  const controls = detectPosControlSignals(shifts, operations, now).map((item) => ({ id: item.id, source: "control" as const, severity: item.severity, title: item.titleAr, detail: item.detailAr }));
  const incidents = data.incidents.filter((item) => item.status === "open").map((item) => ({ id: `incident-${item.id}`, source: "incident" as const, severity: item.severity, title: item.title, detail: item.details }));
  const checklist = shifts.filter((item) => item.status === "open").flatMap((shift) => checklistProgress(data, shift.id, "opening").requiredMissing.map((item) => ({ id: `check-${shift.id}-${item.id}`, source: "checklist" as const, severity: "medium" as const, title: "بند فتح وردية غير مكتمل", detail: item.labelAr })));
  return [...controls, ...incidents, ...checklist].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
}

export function cashierAccountability(shifts: PosShift[], operations: PosOperation[], incidents: ServicePointIncident[]) {
  return shifts.map((shift) => { const related = operations.filter((item) => item.shiftId === shift.id), snapshot = calculatePosShiftSnapshot(shift, operations, shift.actualClosingCash), variance = snapshot.cashVariance || 0; return { shiftId: shift.id, cashierName: shift.cashierName, businessDate: shift.businessDate, successful: related.filter(isEffectivePosOperation).length, pending: related.filter((item) => item.status === "pending").length, failed: related.filter((item) => item.status === "failed").length, reversals: related.filter((item) => item.status === "reversed" || item.reversalOfOperationId).length, cashVariance: variance, incidents: incidents.filter((item) => item.shiftId === shift.id).length }; });
}

export function dailyOwnerPack(date: string, shifts: PosShift[], operations: PosOperation[], data: ServicePointOperationsData) {
  const dayShifts = shifts.filter((item) => item.businessDate === date), dayOps = operations.filter((item) => item.businessDate === date), effective = dayOps.filter(isEffectivePosOperation), movement = data.movements.filter((item) => item.businessDate === date);
  return { date, shifts: dayShifts.length, cashiers: [...new Set(dayShifts.map((item) => item.cashierName))], operations: effective.length, volume: roundCurrency(effective.reduce((sum, item) => sum + item.amount, 0)), fees: roundCurrency(effective.reduce((sum, item) => sum + item.revenue, 0)), providerCosts: roundCurrency(effective.reduce((sum, item) => sum + item.providerCost, 0)), storeExpenses: roundCurrency(effective.filter((item) => item.type === "store-expense").reduce((sum, item) => sum + item.expense, 0)), profit: roundCurrency(effective.reduce((sum, item) => sum + item.profit, 0)), managementCash: roundCurrency(movement.reduce((sum, item) => sum + item.cashChange, 0)), pending: dayOps.filter((item) => item.status === "pending").length, failed: dayOps.filter((item) => item.status === "failed").length, reversals: dayOps.filter((item) => item.status === "reversed" || item.reversalOfOperationId).length, openIncidents: data.incidents.filter((item) => item.businessDate === date && item.status === "open").length, notes: data.managementNotes.filter((item) => item.businessDate === date) };
}
