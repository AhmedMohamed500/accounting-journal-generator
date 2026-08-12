import { getPostingAccounts } from "@/lib/accounting/accounts";
import { normalizeJournalEntry } from "@/lib/accounting/journal";
import { roundCurrency } from "@/lib/accounting/calculations";
import type { AccountingSpreadsheetCategory, AccountingSpreadsheetMapping, AccountingSpreadsheetResult, AccountingSpreadsheetRow, ChartAccount, GeneratedJournalEntry, SheetData } from "@/types";

type CategoryRule = { category: AccountingSpreadsheetCategory; ar: string; en: string; accountCode: string; pattern: RegExp };
const rules: CategoryRule[] = [
  { category: "bank-expense", ar: "مصروفات وعمولات بنكية", en: "Bank fees", accountCode: "5600", pattern: /رسوم\s*(بنك|تحويل)|عمول.*بنك|مصاريف.*بنك|bank\s*(fee|charge)|commission/i },
  { category: "payroll", ar: "رواتب وأجور", en: "Payroll", accountCode: "5200", pattern: /رواتب|مرتبات|أجور|salary|payroll|wages/i },
  { category: "rent", ar: "إيجارات", en: "Rent", accountCode: "5100", pattern: /إيجار|ايجار|rent|lease/i },
  { category: "utilities", ar: "كهرباء ومياه ومرافق", en: "Utilities", accountCode: "5110", pattern: /كهرب|مياه|غاز|انترنت|تليفون|هاتف|مرافق|electric|water|gas|internet|utility|phone/i },
  { category: "maintenance", ar: "صيانة وإصلاح", en: "Maintenance", accountCode: "5130", pattern: /صيان|إصلاح|اصلاح|قطع غيار|maintenance|repair|spare/i },
  { category: "marketing", ar: "تسويق وإعلان", en: "Marketing", accountCode: "5400", pattern: /تسويق|إعلان|اعلان|دعاية|marketing|advert|campaign/i },
  { category: "tax", ar: "ضرائب", en: "Taxes", accountCode: "2201", pattern: /ضريب|قيمة مضافة|vat|tax/i },
  { category: "loan", ar: "قروض وتمويل", en: "Loans", accountCode: "2300", pattern: /قرض|تمويل|loan|finance/i },
  { category: "capital", ar: "رأس المال", en: "Capital", accountCode: "3100", pattern: /رأس\s*المال|راس\s*المال|مساهمة.*شريك|capital|owner contribution/i },
  { category: "asset", ar: "أصول ومعدات", en: "Assets and equipment", accountCode: "1330", pattern: /أصل|اصل|معدات|جهاز|أجهزة|سيارة|سيارات|مبنى|asset|equipment|vehicle|computer/i },
  { category: "inventory", ar: "مخزون", en: "Inventory", accountCode: "1200", pattern: /مخزون|بضاعة|inventory|stock/i },
  { category: "purchases", ar: "مشتريات", en: "Purchases", accountCode: "5000", pattern: /مشتريات|شراء|مورد|purchase|supplier/i },
  { category: "cost-of-sales", ar: "تكلفة المبيعات", en: "Cost of sales", accountCode: "5010", pattern: /تكلفة.*مبيعات|بضاعة.*مباعة|cost of (sales|goods)|cogs/i },
  { category: "revenue", ar: "إيرادات", en: "Revenue", accountCode: "4200", pattern: /إيراد|ايراد|مبيعات|تحصيل|عميل|دخل|revenue|sales|income|customer receipt/i },
  { category: "administrative-expense", ar: "مصروفات إدارية وعمومية", en: "Administrative expenses", accountCode: "5190", pattern: /مصروف|نثريات|أدوات مكتبية|ادوات مكتبية|ضيافة|انتقالات|expense|stationery|office supplies|petty cash/i },
  { category: "transfer", ar: "تحويل بين حسابات", en: "Account transfer", accountCode: "1110", pattern: /تحويل.*(حساب|خز|بنك)|transfer between|internal transfer/i },
];

export const accountingCategoryLabels: Record<AccountingSpreadsheetCategory, { ar: string; en: string }> = Object.fromEntries([
  ...rules.map((rule) => [rule.category, { ar: rule.ar, en: rule.en }]),
  ["unclassified", { ar: "تحتاج تصنيف", en: "Needs classification" }],
]) as Record<AccountingSpreadsheetCategory, { ar: string; en: string }>;
export const accountingCategoryDefaultCode = (category: AccountingSpreadsheetCategory) => rules.find((rule) => rule.category === category)?.accountCode || "1199";

const normalize = (value: unknown) => String(value ?? "").toLowerCase().replace(/[\u200e\u200f]/g, "").replace(/[\s_.\-/]+/g, "").trim();
const aliases: Record<keyof AccountingSpreadsheetMapping, string[]> = {
  date: ["date", "transactiondate", "postingdate", "التاريخ", "تاريخالعملية", "تاريخالقيد"],
  description: ["description", "details", "narration", "memo", "البيان", "الوصف", "التفاصيل", "العملية"],
  amount: ["amount", "value", "net", "total", "المبلغ", "القيمة", "الصافي", "الإجمالي", "الاجمالي"],
  debit: ["debit", "withdrawal", "paid", "مدين", "سحب", "منصرف", "مدفوع"],
  credit: ["credit", "deposit", "received", "دائن", "إيداع", "ايداع", "مقبوض", "وارد"],
  category: ["category", "type", "classification", "التصنيف", "الفئة", "النوع", "البند"],
  accountCode: ["accountcode", "account", "glcode", "كودالحساب", "الحساب", "حسابمدين"],
  counterAccountCode: ["counteraccount", "creditaccount", "offsetaccount", "الحسابالمقابل", "حسابدائن"],
  reference: ["reference", "ref", "documentnumber", "invoice", "المرجع", "رقمالمستند", "رقمالفاتورة"],
  party: ["party", "customer", "supplier", "name", "الطرف", "العميل", "المورد", "الاسم"],
};

export function detectAccountingMapping(headers: string[]): AccountingSpreadsheetMapping {
  const result: AccountingSpreadsheetMapping = {};
  for (const [field, names] of Object.entries(aliases) as [keyof AccountingSpreadsheetMapping, string[]][]) {
    const match = headers.find((header) => names.includes(normalize(header)) || names.some((name) => normalize(header).includes(name)));
    if (match) result[field] = match;
  }
  return result;
}

const cell = (sheet: SheetData, row: SheetData["rows"][number], header?: string) => header ? row[sheet.headers.indexOf(header)] : undefined;
const asNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : Number(String(value ?? "").replace(/,/g, "")) || 0;
function asDate(value: unknown) { if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10); const text = String(value ?? "").trim(); if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10); const parts = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if (parts) return `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`; return new Date().toISOString().slice(0, 10); }
function categoryFrom(value: string) { const text = value.trim(); const rule = rules.find((item) => item.pattern.test(text)); return rule || { category: "unclassified" as const, ar: "تحتاج تصنيف", en: "Needs classification", accountCode: "1199", pattern: /$^/ }; }
function accountCode(accounts: ChartAccount[], requested: string | undefined, fallback: string) { const posting = getPostingAccounts(accounts); return posting.find((account) => account.code === requested)?.code || posting.find((account) => account.code === fallback)?.code || posting[0]?.code || fallback; }
function directionFor(category: AccountingSpreadsheetCategory, amount: number, debit: number, credit: number, text: string): "in" | "out" {
  if (debit || credit) return credit > debit ? "in" : "out";
  if (amount < 0) return "out";
  if (["revenue", "loan", "capital"].includes(category)) return "in";
  if (/إيداع|ايداع|تحصيل|وارد|مقبوض|deposit|received|receipt|income/i.test(text)) return "in";
  return "out";
}

export function analyzeAccountingSheet(sheet: SheetData, accounts: ChartAccount[], suppliedMapping?: AccountingSpreadsheetMapping): AccountingSpreadsheetResult {
  const mapping = { ...detectAccountingMapping(sheet.headers), ...suppliedMapping }, warnings: string[] = [];
  if (!mapping.description) warnings.push("description-column-missing");
  if (!mapping.amount && !mapping.debit && !mapping.credit) warnings.push("amount-columns-missing");
  const rows: AccountingSpreadsheetRow[] = [];
  sheet.rows.forEach((source, index) => {
    const description = String(cell(sheet, source, mapping.description) ?? cell(sheet, source, mapping.category) ?? source.find((value) => typeof value === "string") ?? "").trim();
    const explicitCategory = String(cell(sheet, source, mapping.category) ?? ""), debit = Math.abs(asNumber(cell(sheet, source, mapping.debit))), credit = Math.abs(asNumber(cell(sheet, source, mapping.credit))), rawAmount = asNumber(cell(sheet, source, mapping.amount));
    const amount = roundCurrency(Math.abs(debit || credit || rawAmount)); if (amount <= 0) return;
    const classified = categoryFrom(`${explicitCategory} ${description}`), direction = directionFor(classified.category, rawAmount, debit, credit, `${explicitCategory} ${description}`);
    const requestedAccount = String(cell(sheet, source, mapping.accountCode) ?? "").trim(), requestedCounter = String(cell(sheet, source, mapping.counterAccountCode) ?? "").trim();
    const primary = accountCode(accounts, requestedAccount, classified.accountCode), counter = accountCode(accounts, requestedCounter, "1110");
    const rowWarnings: string[] = []; let confidence = classified.category === "unclassified" ? 35 : explicitCategory ? 93 : 82;
    if (!description) { rowWarnings.push("missing-description"); confidence -= 20; }
    if (!mapping.date || !cell(sheet, source, mapping.date)) { rowWarnings.push("missing-date"); confidence -= 10; }
    if (classified.category === "unclassified") rowWarnings.push("unclassified");
    if (requestedAccount && requestedAccount !== primary) rowWarnings.push("invalid-account-code");
    if (primary === counter) { rowWarnings.push("same-account"); confidence -= 30; }
    rows.push({ id: `sheet-${sheet.name}-${index + 1}`, rowNumber: (sheet.headerRowIndex || 0) + index + 2, date: asDate(cell(sheet, source, mapping.date)), description: description || `Excel row ${index + 1}`, reference: String(cell(sheet, source, mapping.reference) ?? "").trim() || undefined, party: String(cell(sheet, source, mapping.party) ?? "").trim() || undefined, amount, direction, category: classified.category, categoryAr: classified.ar, categoryEn: classified.en, accountCode: primary, counterAccountCode: counter, confidence: Math.max(5, confidence), warnings: rowWarnings, source });
  });
  const categoryMap = new Map<AccountingSpreadsheetCategory, { count: number; amount: number }>();
  for (const row of rows) { const current = categoryMap.get(row.category) || { count: 0, amount: 0 }; current.count++; current.amount = roundCurrency(current.amount + row.amount); categoryMap.set(row.category, current); }
  const totalIn = roundCurrency(rows.filter((row) => row.direction === "in").reduce((sum, row) => sum + row.amount, 0)), totalOut = roundCurrency(rows.filter((row) => row.direction === "out").reduce((sum, row) => sum + row.amount, 0));
  const categories = [...categoryMap.entries()].map(([category, value]) => ({ category, labelAr: accountingCategoryLabels[category].ar, labelEn: accountingCategoryLabels[category].en, ...value })).sort((a, b) => b.amount - a.amount);
  return { mapping, rows, warnings, summary: { totalIn, totalOut, netCashFlow: roundCurrency(totalIn - totalOut), categorized: rows.filter((row) => row.category !== "unclassified").length, needsReview: rows.filter((row) => row.warnings.length > 0 || row.confidence < 70).length, categories } };
}

export function accountingRowToJournalEntry(row: AccountingSpreadsheetRow, accounts: ChartAccount[], existing: GeneratedJournalEntry[] = [], sheetName = "Excel"): GeneratedJournalEntry {
  const posting = getPostingAccounts(accounts), primary = posting.find((account) => account.code === row.accountCode), counter = posting.find((account) => account.code === row.counterAccountCode);
  if (!primary || !counter) throw new Error("One or more selected accounts are not postable");
  const debitAccount = row.direction === "out" ? primary : counter, creditAccount = row.direction === "out" ? counter : primary;
  const entry: GeneratedJournalEntry = { id: crypto.randomUUID(), entryNumber: "AUTO", date: row.date, transactionType: `spreadsheet-${row.category}`, titleAr: `قيد مقترح من Excel — ${row.categoryAr}`, titleEn: `Excel proposed entry — ${row.categoryEn}`, narrationAr: row.description, narrationEn: row.description, currency: "EGP", lines: [
    { id: crypto.randomUUID(), accountCode: debitAccount.code, accountNameAr: debitAccount.nameAr, accountNameEn: debitAccount.nameEn, debit: row.amount, credit: 0, descriptionAr: row.description, descriptionEn: row.description, partyName: row.party },
    { id: crypto.randomUUID(), accountCode: creditAccount.code, accountNameAr: creditAccount.nameAr, accountNameEn: creditAccount.nameEn, debit: 0, credit: row.amount, descriptionAr: row.description, descriptionEn: row.description, partyName: row.party },
  ], totalDebit: row.amount, totalCredit: row.amount, isBalanced: true, explanationAr: [`تم تحليل الصف ${row.rowNumber} وتصنيفه ضمن ${row.categoryAr}.`, "تم إنشاء القيد كمسودة للمراجعة ولم يتم ترحيله."], explanationEn: [`Row ${row.rowNumber} was classified as ${row.categoryEn}.`, "The entry was created as a draft for review and was not posted."], assumptionsAr: [], assumptionsEn: [], warningsAr: row.warnings, warningsEn: row.warnings, accountingRuleAr: "كل حركة مالية تُحوّل إلى قيد متوازن ثم تمر بدورة المراجعة والاعتماد والترحيل.", accountingRuleEn: "Each transaction becomes a balanced journal entry before review, approval, and posting.", financialStatementImpact: { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, profit: 0 }, confidence: row.confidence, workflowStatus: "draft", source: "spreadsheet-import", reference: row.reference || `${sheetName}-R${row.rowNumber}`, partyName: row.party, sourceReference: `${sheetName}:${row.rowNumber}` };
  return normalizeJournalEntry(entry, existing, "spreadsheet-import");
}
