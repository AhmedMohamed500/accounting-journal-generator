import type { FinancialStatementImpact, GeneratedJournalEntry, JournalEntryLine, TransactionInput } from "@/types";
import { defaultAccounts } from "@/data/accounts";
import { getTransaction } from "@/data/transactions";
import { applyDiscount, calculateVatFromNet, calculateWithholding, extractVatFromGross, roundCurrency } from "@/lib/accounting/calculations";
import { isBalanced, journalTotals } from "@/lib/accounting/balance";

const account = (code: string) => defaultAccounts.find((item) => item.code === code);
const line = (id: string, code: string | undefined, debit = 0, credit = 0, fallbackAr = "", fallbackEn = ""): JournalEntryLine => { const selected = code ? account(code) : undefined; return { id, accountCode: code, accountNameAr: selected?.nameAr || fallbackAr, accountNameEn: selected?.nameEn || fallbackEn, debit: roundCurrency(debit), credit: roundCurrency(credit) }; };

function liquidity(input: TransactionInput) {
  const code = input.paymentAccountCode || (input.paymentMethod === "bank" || input.paymentMethod === "cheque" ? "1110" : "1100"), selected = account(code);
  return { code, nameAr: input.paymentAccountNameAr || selected?.nameAr || "النقدية", nameEn: input.paymentAccountNameEn || selected?.nameEn || "Cash / Bank" };
}

function statementImpact(lines: JournalEntryLine[], paymentCode: string): FinancialStatementImpact {
  let assets = 0, liabilities = 0, equityBase = 0, revenue = 0, expenses = 0, cash = 0, inventory = 0, receivables = 0, payables = 0;
  for (const item of lines) {
    const selected = item.accountCode ? account(item.accountCode) : undefined, type = selected?.type || (item.accountCode === paymentCode ? "asset" : undefined), debitMovement = item.debit - item.credit, creditMovement = item.credit - item.debit;
    if (type === "asset") assets += debitMovement;
    if (type === "liability") liabilities += creditMovement;
    if (type === "equity") equityBase += creditMovement;
    if (type === "revenue") revenue += creditMovement;
    if (type === "expense") expenses += debitMovement;
    if (item.accountCode === "1100" || item.accountCode === "1110" || item.accountCode === paymentCode) cash += debitMovement;
    if (item.accountCode === "1200") inventory += debitMovement;
    if (item.accountCode === "1120") receivables += debitMovement;
    if (item.accountCode === "2100") payables += creditMovement;
  }
  const profit = roundCurrency(revenue - expenses);
  return { assets: roundCurrency(assets), liabilities: roundCurrency(liabilities), equity: roundCurrency(equityBase + profit), revenue: roundCurrency(revenue), expenses: roundCurrency(expenses), profit, cash: roundCurrency(cash), inventory: roundCurrency(inventory), receivables: roundCurrency(receivables), payables: roundCurrency(payables) };
}

export function generateJournalEntry(input: TransactionInput): GeneratedJournalEntry {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be greater than zero");
  const def = getTransaction(input.type); if (!def) throw new Error("Unsupported transaction type");
  const discounted = applyDiscount(input.amount, input.commercialDiscount || 0), rate = input.vatEnabled ? (input.vatRate ?? 14) : 0;
  const net = input.vatEnabled && input.vatIncluded ? roundCurrency(discounted - extractVatFromGross(discounted, rate)) : discounted;
  const vat = input.vatEnabled ? (input.vatIncluded ? extractVatFromGross(discounted, rate) : calculateVatFromNet(discounted, rate)) : 0;
  const gross = roundCurrency(net + vat), withholding = input.withholdingEnabled ? calculateWithholding(net, input.withholdingRate ?? 0) : 0, payment = liquidity(input);
  let lines: JournalEntryLine[] = [];

  if (["cash-sale", "credit-sale", "revenue"].includes(input.type)) {
    const debitCode = input.type === "credit-sale" || (input.type === "revenue" && input.paymentMethod === "credit") ? "1120" : payment.code, revenueCode = input.type === "revenue" ? "4200" : "4100";
    lines = [line("1", debitCode, gross - withholding, 0, def.debitAccountAr, def.debitAccountEn), line("2", revenueCode, 0, net, def.creditAccountAr, def.creditAccountEn)];
    if (vat) lines.push(line("3", "2201", 0, vat));
    if (withholding) lines.push(line("4", "1150", withholding, 0));
  } else if (["cash-purchase", "credit-purchase", "fixed-asset-purchase"].includes(input.type)) {
    const debitCode = input.purchaseAccountCode || (input.type === "fixed-asset-purchase" ? "1330" : "1200"), creditCode = input.type === "credit-purchase" || input.paymentMethod === "credit" ? "2100" : payment.code;
    lines = [line("1", debitCode, net, 0, def.debitAccountAr, def.debitAccountEn)];
    if (vat) lines.push(line("2", "1151", vat, 0));
    if (withholding) lines.push(line("3", "2202", 0, withholding));
    lines.push(line("4", creditCode, 0, gross - withholding, def.creditAccountAr, def.creditAccountEn));
  } else if (input.type === "depreciation") {
    const life = input.usefulLife ?? 0; if (life <= 0) throw new Error("Useful life must be greater than zero"); if ((input.residualValue ?? 0) > input.amount) throw new Error("Residual value cannot exceed asset cost"); const depreciation = roundCurrency((input.amount - (input.residualValue ?? 0)) / life);
    lines = [line("1", "5300", depreciation), line("2", "1390", 0, depreciation)];
  } else {
    const mapping: Record<string, [string, string]> = {
      "customer-collection": [payment.code, "1120"], "supplier-payment": ["2100", payment.code], "rent-expense": ["5100", input.paymentMethod === "credit" ? "2210" : payment.code], "electricity-expense": ["5110", input.paymentMethod === "credit" ? "2210" : payment.code], "maintenance-expense": ["5130", input.paymentMethod === "credit" ? "2210" : payment.code],
      "salary-accrual": ["5200", "2210"], "salary-payment": ["2210", payment.code], "loan-receipt": [payment.code, "2300"], "loan-payment": ["2300", payment.code], "accrued-expense": ["5500", "2210"], "prepaid-expense": ["1140", payment.code], "capital-contribution": [payment.code, "3100"], "drawings": ["3200", payment.code], "bank-charges": ["5600", input.paymentAccountCode || "1110"], "vat-payment": ["2201", input.paymentAccountCode || "1110"], "inventory-adjustment": ["5010", "1200"], "asset-sale": [payment.code, "1330"]
    };
    const codes = mapping[input.type];
    lines = codes ? [line("1", codes[0], input.amount, 0, def.debitAccountAr, def.debitAccountEn), line("2", codes[1], 0, input.amount, def.creditAccountAr, def.creditAccountEn)] : [line("1", undefined, input.amount, 0, def.debitAccountAr, def.debitAccountEn), line("2", undefined, 0, input.amount, def.creditAccountAr, def.creditAccountEn)];
  }

  const totals = journalTotals(lines), balanced = isBalanced(lines), impact = statementImpact(lines, payment.code), usesPaymentAccount = lines.some((item) => item.accountCode === payment.code);
  return { id: crypto.randomUUID(), entryNumber: `JE-${Date.now().toString().slice(-6)}`, date: input.date || new Date().toISOString().slice(0, 10), transactionType: input.type, titleAr: def.titleAr, titleEn: def.titleEn, narrationAr: `إثبات ${def.titleAr}${input.notes ? ` — ${input.notes}` : ""}`, narrationEn: `To record ${def.titleEn}${input.notes ? ` — ${input.notes}` : ""}`, currency: input.currency || "EGP", lines, totalDebit: totals.debit, totalCredit: totals.credit, isBalanced: balanced, explanationAr: lines.map((item) => `${item.debit ? "مدين" : "دائن"}: ${item.accountNameAr} بمبلغ ${item.debit || item.credit}.`), explanationEn: lines.map((item) => `${item.debit ? "Debit" : "Credit"}: ${item.accountNameEn} by ${item.debit || item.credit}.`), assumptionsAr: ["تم اختيار حساب الصندوق أو البنك وفق طريقة السداد والحساب المحدد."], assumptionsEn: ["The cash or bank account follows the selected payment method and account."], warningsAr: input.withholdingEnabled ? ["راجع المعالجة الضريبية ونسبة الخصم وفق التشريع المطبق."] : [], warningsEn: input.withholdingEnabled ? ["Review withholding treatment under the applicable rules."] : [], accountingRuleAr: "كل معاملة تؤثر بالتساوي على طرفي القيد المزدوج، وتنعكس الحركة النقدية على حساب الصندوق أو البنك المحدد.", accountingRuleEn: "Every transaction has equal debit and credit effects, and cash movement posts to the selected cash or bank account.", financialStatementImpact: impact, cashFlowCategory: input.type === "fixed-asset-purchase" ? "investing" : input.type.includes("loan") || input.type.includes("capital") ? "financing" : input.type === "depreciation" ? "non-cash" : "operating", confidence: 1, paymentAccountCode: usesPaymentAccount ? payment.code : undefined };
}
