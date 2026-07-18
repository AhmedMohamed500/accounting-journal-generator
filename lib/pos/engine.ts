import { defaultAccounts } from "@/data/accounts";
import { posAccountCodes, posLedgerAccounts, posProviders } from "@/data/pos";
import type { GeneratedJournalEntry, JournalEntryLine, PosOperation, PosOperationType, PosProviderId, PosShift, PosShiftSnapshot } from "@/types";
import { roundCurrency } from "@/lib/accounting/calculations";

export interface PosOperationInput {
  shiftId: string;
  businessDate: string;
  type: PosOperationType;
  providerId?: PosProviderId;
  destinationProviderId?: PosProviderId;
  amount: number;
  customerFee: number;
  providerCost: number;
  reference?: string;
  notes?: string;
}

const account = (code: string) => posLedgerAccounts.find((item) => item.code === code) || defaultAccounts.find((item) => item.code === code);
const line = (code: string, debit: number, credit: number, descriptionAr: string, descriptionEn: string): JournalEntryLine => {
  const selected = account(code);
  return { id: crypto.randomUUID(), accountCode: code, accountNameAr: selected?.nameAr || code, accountNameEn: selected?.nameEn || code, debit: roundCurrency(debit), credit: roundCurrency(credit), descriptionAr, descriptionEn };
};

export function calculatePosOperation(input: PosOperationInput): PosOperation {
  const amount = roundCurrency(input.amount), customerFee = roundCurrency(input.customerFee), providerCost = roundCurrency(input.providerCost);
  if (amount <= 0) throw new Error("قيمة العملية يجب أن تكون أكبر من صفر");
  if (customerFee < 0 || providerCost < 0) throw new Error("العمولة والتكلفة لا يمكن أن تكونا بالسالب");
  if (input.type !== "store-expense" && !input.providerId) throw new Error("اختر مقدم الخدمة");
  if (input.type === "internal-provider-transfer" && !input.destinationProviderId) throw new Error("اختر المحفظة التي سيصل إليها الرصيد");
  if (input.type === "internal-provider-transfer" && input.providerId === input.destinationProviderId) throw new Error("المحفظة المصدر والوجهة يجب أن تكونا مختلفتين");
  if (input.type === "cash-withdrawal" && (customerFee > amount || providerCost > amount)) throw new Error("عمولة السحب أو تكلفته أكبر من قيمة العملية");

  let cashChange = 0, providerBalanceChange = 0, revenue = 0, expense = 0;
  if (["send-transfer", "bill-payment", "recharge"].includes(input.type)) {
    cashChange = amount + customerFee;
    providerBalanceChange = -(amount + providerCost);
    revenue = customerFee; expense = providerCost;
  } else if (input.type === "cash-withdrawal") {
    cashChange = -(amount - customerFee);
    providerBalanceChange = amount - providerCost;
    revenue = customerFee; expense = providerCost;
  } else if (input.type === "provider-topup") {
    cashChange = -amount; providerBalanceChange = amount;
  } else if (input.type === "internal-provider-transfer") {
    providerBalanceChange = -amount;
  } else {
    cashChange = -amount; expense = amount;
  }

  return {
    ...input, id: crypto.randomUUID(), at: new Date().toISOString(), amount, customerFee, providerCost,
    cashChange: roundCurrency(cashChange), providerBalanceChange: roundCurrency(providerBalanceChange),
    revenue: roundCurrency(revenue), expense: roundCurrency(expense), profit: roundCurrency(revenue - expense),
  };
}

export function isDuplicatePosOperation(existing: PosOperation[], candidate: Pick<PosOperation, "providerId" | "destinationProviderId" | "amount" | "reference">, now = Date.now()) {
  const reference = candidate.reference?.trim().toLowerCase();
  return existing.some((operation) => {
    if (["failed", "reversed"].includes(operation.status || "successful") || operation.reversalOfOperationId) return false;
    const age = now - new Date(operation.at).getTime();
    const sameRoute = operation.providerId === candidate.providerId && operation.destinationProviderId === candidate.destinationProviderId;
    const sameAmount = Math.abs(operation.amount - candidate.amount) < .01;
    if (!sameRoute || !sameAmount || age < 0) return false;
    if (reference) return operation.reference?.trim().toLowerCase() === reference && age <= 10 * 60 * 1000;
    return age <= 60 * 1000;
  });
}

export function createPosReversal(operation: PosOperation): PosOperation {
  const internal = operation.type === "internal-provider-transfer";
  return {
    ...operation,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    providerId: internal ? operation.destinationProviderId : operation.providerId,
    destinationProviderId: internal ? operation.providerId : undefined,
    cashChange: -operation.cashChange,
    providerBalanceChange: internal ? -operation.amount : -operation.providerBalanceChange,
    revenue: -operation.revenue,
    expense: -operation.expense,
    profit: -operation.profit,
    reference: `REV-${operation.reference || operation.id.slice(0, 8)}`,
    notes: "عكس عملية مسجلة",
    entryId: undefined,
    status: "successful",
    reversalOfOperationId: operation.id,
    reversedByOperationId: undefined,
  };
}

export function createPosReversalJournalEntry(original: GeneratedJournalEntry, reversal: PosOperation): GeneratedJournalEntry {
  const lines=original.lines.map((item)=>({...item,id:crypto.randomUUID(),debit:item.credit,credit:item.debit,descriptionAr:`عكس: ${item.descriptionAr||original.narrationAr}`,descriptionEn:`Reversal: ${item.descriptionEn||original.narrationEn}`}));
  return {...original,id:crypto.randomUUID(),entryNumber:`POS-REV-${Date.now().toString().slice(-7)}`,transactionType:"pos-operation-reversal",titleAr:"عكس عملية نقطة خدمات",titleEn:"Service point operation reversal",narrationAr:`عكس القيد ${original.entryNumber}`,narrationEn:`Reversal of ${original.entryNumber}`,lines,totalDebit:original.totalCredit,totalCredit:original.totalDebit,financialStatementImpact:{assets:-original.financialStatementImpact.assets,liabilities:-original.financialStatementImpact.liabilities,equity:-original.financialStatementImpact.equity,revenue:-original.financialStatementImpact.revenue,expenses:-original.financialStatementImpact.expenses,profit:-original.financialStatementImpact.profit,cash:-(original.financialStatementImpact.cash||0)},explanationAr:[`تم عكس العملية الأصلية والمرجع ${reversal.reference}.`],explanationEn:[`Original operation reversed. Reference ${reversal.reference}.`]};
}

export function createPosJournalEntry(operation: PosOperation): GeneratedJournalEntry {
  const provider = posProviders.find((item) => item.id === operation.providerId);
  const descriptionAr = `${provider?.nameAr || "المحل"} — ${operation.reference || operation.type}`;
  const descriptionEn = `${provider?.nameEn || "Store"} — ${operation.reference || operation.type}`;
  const lines: JournalEntryLine[] = [];
  if (["send-transfer", "bill-payment", "recharge"].includes(operation.type)) {
    lines.push(line(posAccountCodes.cash, operation.amount + operation.customerFee, 0, descriptionAr, descriptionEn));
    if (operation.providerCost) lines.push(line(posAccountCodes.providerFees, operation.providerCost, 0, descriptionAr, descriptionEn));
    lines.push(line(provider!.accountCode, 0, operation.amount + operation.providerCost, descriptionAr, descriptionEn));
    if (operation.customerFee) lines.push(line(posAccountCodes.commissionRevenue, 0, operation.customerFee, descriptionAr, descriptionEn));
  } else if (operation.type === "cash-withdrawal") {
    lines.push(line(provider!.accountCode, operation.amount - operation.providerCost, 0, descriptionAr, descriptionEn));
    if (operation.providerCost) lines.push(line(posAccountCodes.providerFees, operation.providerCost, 0, descriptionAr, descriptionEn));
    lines.push(line(posAccountCodes.cash, 0, operation.amount - operation.customerFee, descriptionAr, descriptionEn));
    if (operation.customerFee) lines.push(line(posAccountCodes.commissionRevenue, 0, operation.customerFee, descriptionAr, descriptionEn));
  } else if (operation.type === "provider-topup") {
    lines.push(line(provider!.accountCode, operation.amount, 0, descriptionAr, descriptionEn));
    lines.push(line(posAccountCodes.cash, 0, operation.amount, descriptionAr, descriptionEn));
  } else if (operation.type === "internal-provider-transfer") {
    const destination = posProviders.find((item) => item.id === operation.destinationProviderId)!;
    lines.push(line(destination.accountCode, operation.amount, 0, `تحويل داخلي إلى ${destination.nameAr}`, `Internal transfer to ${destination.nameEn}`));
    lines.push(line(provider!.accountCode, 0, operation.amount, `تحويل داخلي من ${provider!.nameAr}`, `Internal transfer from ${provider!.nameEn}`));
  } else {
    lines.push(line(posAccountCodes.storeExpense, operation.amount, 0, descriptionAr, descriptionEn));
    lines.push(line(posAccountCodes.cash, 0, operation.amount, descriptionAr, descriptionEn));
  }
  const totalDebit = roundCurrency(lines.reduce((sum, item) => sum + item.debit, 0));
  const totalCredit = roundCurrency(lines.reduce((sum, item) => sum + item.credit, 0));
  return {
    id: crypto.randomUUID(), entryNumber: `POS-${Date.now().toString().slice(-8)}`, date: operation.businessDate,
    transactionType: `pos-${operation.type}`, titleAr: "عملية نقطة خدمات مالية", titleEn: "Financial service point transaction",
    narrationAr: descriptionAr, narrationEn: descriptionEn, currency: "EGP", lines, totalDebit, totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < .01, workflowStatus: "posted", cashFlowCategory: "operating", confidence: 100,
    explanationAr: operation.type === "internal-provider-transfer" ? [
      `تم تحويل ${operation.amount.toLocaleString()} جنيه من ${provider?.nameAr} إلى ${posProviders.find((item) => item.id === operation.destinationProviderId)?.nameAr}.`,
      "لم تتحرك الخزنة ولم ينتج عن التحويل إيراد أو مصروف أو ربح.",
    ] : [
      `تحركت خزينة المحل بمبلغ ${operation.cashChange.toLocaleString()} جنيه.`,
      operation.providerId ? `تحرك رصيد ${provider?.nameAr} بمبلغ ${operation.providerBalanceChange.toLocaleString()} جنيه.` : "تم تسجيل مصروف تشغيل المحل.",
      `إيراد العمولة ${operation.revenue.toLocaleString()}، تكلفة الخدمة ${operation.expense.toLocaleString()}، وصافي الربح ${operation.profit.toLocaleString()} جنيه.`,
    ],
    explanationEn: ["Store cash and provider balance were updated.", `Net profit: ${operation.profit.toLocaleString()} EGP.`],
    assumptionsAr: ["الأرصدة الافتتاحية تمثل الرصيد الفعلي عند فتح الوردية."], assumptionsEn: ["Opening balances match the physical balances."],
    warningsAr: [], warningsEn: [], accountingRuleAr: "كل حركة خدمة تُثبت بين خزينة المحل ورصيد مقدم الخدمة مع فصل العمولة والتكلفة.", accountingRuleEn: "Each service movement separates cash, provider balance, commission revenue, and provider cost.",
    financialStatementImpact: { assets: operation.type === "internal-provider-transfer" ? 0 : roundCurrency(operation.cashChange + operation.providerBalanceChange), liabilities: 0, equity: operation.profit, revenue: operation.revenue, expenses: operation.expense, profit: operation.profit, cash: operation.cashChange },
  };
}

export function calculatePosShiftSnapshot(shift: PosShift, operations: PosOperation[], actualCash?: number, actualProviders?: Partial<Record<PosProviderId, number>>): PosShiftSnapshot {
  const related = operations.filter((item) => item.shiftId === shift.id && !["pending", "failed"].includes(item.status || "successful"));
  const expectedProviders = Object.fromEntries(posProviders.map((provider) => [provider.id, roundCurrency(
    (shift.providers.find((item) => item.providerId === provider.id)?.openingBalance || 0)
    + related.filter((item) => item.providerId === provider.id).reduce((sum, item) => sum + item.providerBalanceChange, 0)
    + related.filter((item) => item.destinationProviderId === provider.id).reduce((sum, item) => sum + item.amount, 0)
  )])) as Record<PosProviderId, number>;
  const expectedCash = roundCurrency(shift.openingCash + related.reduce((sum, item) => sum + item.cashChange, 0));
  const revenue = roundCurrency(related.reduce((sum, item) => sum + item.revenue, 0));
  const expenses = roundCurrency(related.reduce((sum, item) => sum + item.expense, 0));
  const providerVariances = actualProviders ? Object.fromEntries(posProviders.map((provider) => [provider.id, roundCurrency((actualProviders[provider.id] ?? expectedProviders[provider.id]) - expectedProviders[provider.id])])) as Record<PosProviderId, number> : undefined;
  const cashVariance = actualCash === undefined ? undefined : roundCurrency(actualCash - expectedCash);
  const totalVariance = cashVariance === undefined ? undefined : roundCurrency(cashVariance + Object.values(providerVariances || {}).reduce((sum, value) => sum + value, 0));
  return { expectedCash, expectedProviders, revenue, expenses, profit: roundCurrency(revenue - expenses), operationCount: related.length, cashVariance, providerVariances, totalVariance };
}

export function createPosVarianceEntry(shift: PosShift, snapshot: PosShiftSnapshot): GeneratedJournalEntry | undefined {
  const variance = roundCurrency(snapshot.totalVariance || 0);
  const movements = [
    { code: posAccountCodes.cash, variance: roundCurrency(snapshot.cashVariance || 0), nameAr: "الخزنة", nameEn: "Cash" },
    ...posProviders.map((provider) => ({ code: provider.accountCode, variance: roundCurrency(snapshot.providerVariances?.[provider.id] || 0), nameAr: provider.nameAr, nameEn: provider.nameEn })),
  ].filter((item) => Math.abs(item.variance) >= .01);
  if (!movements.length) return undefined;
  const lines = movements.map((item) => line(item.code, item.variance > 0 ? item.variance : 0, item.variance < 0 ? Math.abs(item.variance) : 0, `فرق جرد ${item.nameAr}`, `${item.nameEn} count variance`));
  if (variance > 0) lines.push(line(posAccountCodes.cashOverShort, 0, variance, "زيادة صافية في جرد الوردية", "Net shift overage"));
  if (variance < 0) lines.push(line(posAccountCodes.cashOverShort, Math.abs(variance), 0, "عجز صافٍ في جرد الوردية", "Net shift shortage"));
  const totalDebit = roundCurrency(lines.reduce((sum, item) => sum + item.debit, 0)), totalCredit = roundCurrency(lines.reduce((sum, item) => sum + item.credit, 0));
  return { id: crypto.randomUUID(), entryNumber: `POS-CLOSE-${Date.now().toString().slice(-6)}`, date: shift.businessDate, transactionType: "pos-shift-variance", titleAr: "تسوية عجز أو زيادة الوردية", titleEn: "Shift over/short adjustment", narrationAr: `${shift.storeName} — ${shift.cashierName}`, narrationEn: `${shift.storeName} — ${shift.cashierName}`, currency: "EGP", lines, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < .01, workflowStatus: "posted", cashFlowCategory: "operating", confidence: 100, explanationAr: [`تمت مطابقة الخزنة وكل رصيد خدمة منفصلًا وإثبات فرق صافٍ قدره ${variance.toLocaleString()} جنيه.`], explanationEn: [`Cash and every provider were reconciled separately. Net variance: ${variance.toLocaleString()} EGP.`], assumptionsAr: ["تم إدخال الأرصدة الفعلية بعد العد والمراجعة."], assumptionsEn: ["Actual balances were counted and reviewed."], warningsAr: [], warningsEn: [], accountingRuleAr: "فرق كل رصيد يُثبت في حسابه، ويُقفل صافي الفرق في حساب عجز وزيادة الوردية.", accountingRuleEn: "Each balance variance is posted to its own account and the net closes to cash over and short.", financialStatementImpact: { assets: variance, liabilities: 0, equity: variance, revenue: 0, expenses: -variance, profit: variance, cash: snapshot.cashVariance || 0 } };
}
