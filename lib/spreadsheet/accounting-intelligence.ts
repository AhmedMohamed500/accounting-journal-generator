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

const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[\u064b-\u065f\u0670\u200e\u200f\u202a-\u202e]/g, "")
  .replace(/[أإآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/ؤ/g, "و")
  .replace(/ئ/g, "ي")
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[^a-z0-9\u0600-\u06ff]+/g, "")
  .trim();
const aliases: Record<keyof AccountingSpreadsheetMapping, string[]> = {
  date: ["date", "transactiondate", "postingdate", "valuedate", "documentdate", "التاريخ", "تاريخالعملية", "تاريخالقيد", "تاريخالحركة", "تاريخالمستند", "تاريخالقيمة"],
  description: ["description", "details", "narration", "memo", "statement", "transactiondetails", "itemdescription", "purpose", "البيان", "الوصف", "التفاصيل", "العملية", "شرحالحركة", "بيانالحركة", "وصفالعملية", "اسمالبند", "الغرض", "الملاحظات"],
  amount: ["amount", "value", "net", "total", "transactionamount", "movementamount", "grossamount", "المبلغ", "القيمة", "الصافي", "الإجمالي", "الاجمالي", "قيمةالحركة", "مبلغالحركة", "قيمةالعملية", "مبلغالعملية", "اجماليالحركة", "صافىالحركة", "القيمةبالجنيه"],
  debit: ["debit", "withdrawal", "paid", "payment", "outflow", "debitamount", "مدين", "سحب", "منصرف", "مدفوع", "مبلغمدين", "حركةمدينة", "مدفوعات", "مصروف"],
  credit: ["credit", "deposit", "received", "receipt", "inflow", "creditamount", "دائن", "إيداع", "ايداع", "مقبوض", "وارد", "مبلغدائن", "حركةدائنة", "مقبوضات", "تحصيل"],
  category: ["category", "type", "classification", "التصنيف", "الفئة", "النوع", "البند"],
  accountCode: ["accountcode", "account", "glcode", "كودالحساب", "الحساب", "حسابمدين"],
  counterAccountCode: ["counteraccount", "creditaccount", "offsetaccount", "الحسابالمقابل", "حسابدائن"],
  reference: ["reference", "ref", "documentnumber", "invoice", "المرجع", "رقمالمستند", "رقمالفاتورة"],
  party: ["party", "customer", "supplier", "name", "الطرف", "العميل", "المورد", "الاسم"],
};

const normalizedAliases = Object.fromEntries(Object.entries(aliases).map(([field, names]) => [field, names.map(normalize)])) as Record<keyof AccountingSpreadsheetMapping, string[]>;
const mappingOrder: (keyof AccountingSpreadsheetMapping)[] = ["date", "description", "debit", "credit", "amount", "category", "accountCode", "counterAccountCode", "reference", "party"];

function headerMatchScore(header: string, alias: string) {
  const value = normalize(header), target = normalize(alias);
  if (!value || !target) return 0;
  if (value === target) return 100;
  if (value.startsWith(target) || value.endsWith(target)) return 82;
  if (value.includes(target)) return 68;
  if (target.includes(value) && value.length >= 4) return 54;
  return 0;
}

export function detectAccountingMapping(headers: string[], rows: SheetData["rows"] = []): AccountingSpreadsheetMapping {
  const result: AccountingSpreadsheetMapping = {};
  const used = new Set<string>();
  for (const field of mappingOrder) {
    const candidates = headers.map((header) => ({ header, score: Math.max(...normalizedAliases[field].map((name) => headerMatchScore(header, name))) }))
      .filter((candidate) => candidate.score > 0 && !used.has(candidate.header))
      .sort((a, b) => b.score - a.score);
    if (candidates[0]) { result[field] = candidates[0].header; used.add(candidates[0].header); }
  }
  inferMappingFromValues(headers, rows, result, used);
  return result;
}

const cell = (sheet: SheetData, row: SheetData["rows"][number], header?: string) => header ? row[sheet.headers.indexOf(header)] : undefined;
export function parseAccountingNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const raw = value.trim(); if (!raw) return 0;
  const negative = /^\(.*\)$/.test(raw) || /-$/.test(raw) || /^-/.test(raw);
  let text = raw.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[−–—]/g, "-").replace(/٫/g, ".").replace(/٬/g, ",")
    .replace(/(?:egp|usd|eur|sar|aed|ج\.?\s?م|ر\.?\s?س|جنيه|ريال|دولار)/gi, "")
    .replace(/[()\s%]/g, "").replace(/-$/g, "");
  if (text.includes(",") && text.includes(".")) text = text.lastIndexOf(",") > text.lastIndexOf(".") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  else if ((text.match(/,/g) || []).length === 1 && /,\d{1,2}$/.test(text)) text = text.replace(",", ".");
  else text = text.replace(/,/g, "");
  text = text.replace(/[^0-9.+-]/g, "");
  const number = Number(text); return Number.isFinite(number) ? (negative ? -Math.abs(number) : number) : 0;
}

function parsedDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value >= 20_000 && value <= 80_000) { const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000); return date.toISOString().slice(0, 10); }
  const western = String(value ?? "").trim().replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  if (/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(western)) { const [year, month, day] = western.slice(0, 10).split(/[\/-]/); return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; }
  const parts = western.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/); if (parts) { const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3]; return `${year}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`; }
  return undefined;
}
const asDate = (value: unknown) => parsedDate(value) || new Date().toISOString().slice(0, 10);

type ColumnProfile = { header: string; index: number; numeric: number; dates: number; text: number; longText: number; nonBlank: number; amountScore: number; descriptionScore: number };
function columnProfiles(headers: string[], rows: SheetData["rows"]): ColumnProfile[] {
  return headers.map((header, index) => {
    let numeric = 0, dates = 0, text = 0, longText = 0, nonBlank = 0;
    for (const row of rows.slice(0, 500)) { const value = row[index]; if (value === null || value === undefined || value === "") continue; nonBlank++; if (parsedDate(value)) dates++; else if (typeof value === "number" || (typeof value === "string" && parseAccountingNumber(value) !== 0)) numeric++; else { text++; if (String(value).trim().length >= 8) longText++; } }
    const h = normalize(header), ratio = (count: number) => count / Math.max(1, nonBlank);
    const identifierPenalty = /(id|code|number|no|رقم|كود|هاتف|تليفون|مرجع|reference|ref|qty|quantity|كميه|نسبه|rate|percent|سعر|price)/.test(h) ? 55 : 0;
    const amountBoost = /(amount|value|net|total|movement|transaction|مبلغ|قيمه|صافي|اجمالي|حركه|عمليه|مدفوع|مقبوض|تحصيل)/.test(h) ? 75 : 0;
    const descriptionBoost = /(description|details|narration|memo|item|purpose|note|بيان|وصف|تفاصيل|شرح|بند|ملاحظ|غرض)/.test(h) ? 75 : 0;
    return { header, index, numeric, dates, text, longText, nonBlank, amountScore: ratio(numeric) * 100 + amountBoost - identifierPenalty, descriptionScore: ratio(text) * 55 + ratio(longText) * 45 + descriptionBoost - (identifierPenalty / 2) };
  });
}

function inferMappingFromValues(headers: string[], rows: SheetData["rows"], result: AccountingSpreadsheetMapping, used: Set<string>) {
  if (!rows.length) return;
  const profiles = columnProfiles(headers, rows), available = () => profiles.filter((profile) => !used.has(profile.header));
  if (!result.date) { const best = available().sort((a, b) => (b.dates / Math.max(1, b.nonBlank)) - (a.dates / Math.max(1, a.nonBlank)))[0]; if (best && best.dates / Math.max(1, best.nonBlank) >= .45) { result.date = best.header; used.add(best.header); } }
  if (!result.description) { const best = available().sort((a, b) => b.descriptionScore - a.descriptionScore)[0]; if (best && best.descriptionScore >= 45) { result.description = best.header; used.add(best.header); } }
  if (!result.amount && !result.debit && !result.credit) { const best = available().sort((a, b) => b.amountScore - a.amountScore)[0]; if (best && best.numeric > 0 && best.amountScore >= 35) { result.amount = best.header; used.add(best.header); } }
}

function bestFallbackAmount(sheet: SheetData, row: SheetData["rows"][number], mapping: AccountingSpreadsheetMapping, profiles: ColumnProfile[]) {
  const excluded = new Set([mapping.date, mapping.description, mapping.category, mapping.accountCode, mapping.counterAccountCode, mapping.reference, mapping.party].filter(Boolean));
  const candidates = profiles.filter((profile) => !excluded.has(profile.header) && profile.numeric > 0).sort((a, b) => b.amountScore - a.amountScore);
  for (const profile of candidates) { const amount = parseAccountingNumber(row[profile.index]); if (amount !== 0) return { amount, header: profile.header }; }
  return { amount: 0, header: undefined };
}

function isUsefulDescription(value: unknown) {
  if (typeof value !== "string") return false; const text = value.trim();
  if (text.length < 2 || parsedDate(text) || /^\s*[-+]?\d[\d\s.,]*\s*$/.test(text)) return false;
  return true;
}

function rowDescription(sheet: SheetData, row: SheetData["rows"][number], mapping: AccountingSpreadsheetMapping) {
  const preferred = String(cell(sheet, row, mapping.description) ?? "").trim(), pieces: string[] = preferred ? [preferred] : [];
  const excluded = new Set([mapping.date, mapping.amount, mapping.debit, mapping.credit, mapping.accountCode, mapping.counterAccountCode, mapping.reference].filter(Boolean));
  row.forEach((value, index) => { const header = sheet.headers[index]; if (excluded.has(header) || !isUsefulDescription(value)) return; const text = String(value).trim(); if (!pieces.some((piece) => normalize(piece) === normalize(text))) pieces.push(text); });
  return pieces.slice(0, 5).join(" — ");
}
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
  const mapping = { ...detectAccountingMapping(sheet.headers, sheet.rows), ...suppliedMapping }, warnings: string[] = [];
  if (!mapping.description) warnings.push("description-column-missing");
  if (!mapping.amount && !mapping.debit && !mapping.credit) warnings.push("amount-columns-missing");
  const rows: AccountingSpreadsheetRow[] = [], profiles = columnProfiles(sheet.headers, sheet.rows);
  sheet.rows.forEach((source, index) => {
    const description = rowDescription(sheet, source, mapping), explicitCategory = String(cell(sheet, source, mapping.category) ?? "");
    const debit = Math.abs(parseAccountingNumber(cell(sheet, source, mapping.debit))), credit = Math.abs(parseAccountingNumber(cell(sheet, source, mapping.credit)));
    let rawAmount = parseAccountingNumber(cell(sheet, source, mapping.amount)), inferredAmountHeader: string | undefined;
    if (!debit && !credit && !rawAmount) { const fallback = bestFallbackAmount(sheet, source, mapping, profiles); rawAmount = fallback.amount; inferredAmountHeader = fallback.header; }
    const amount = roundCurrency(Math.abs(debit || credit || rawAmount));
    if (!description && amount <= 0) return;
    const classified = categoryFrom(`${explicitCategory} ${description}`), direction = directionFor(classified.category, rawAmount, debit, credit, `${explicitCategory} ${description}`);
    const requestedAccount = String(cell(sheet, source, mapping.accountCode) ?? "").trim(), requestedCounter = String(cell(sheet, source, mapping.counterAccountCode) ?? "").trim();
    const primary = accountCode(accounts, requestedAccount, classified.accountCode), counter = accountCode(accounts, requestedCounter, "1110");
    const rowWarnings: string[] = []; let confidence = classified.category === "unclassified" ? 48 : explicitCategory ? 93 : 82;
    if (!description) { rowWarnings.push("missing-description"); confidence -= 25; }
    else if (!mapping.description || !String(cell(sheet, source, mapping.description) ?? "").trim()) { rowWarnings.push("description-inferred"); confidence -= 6; }
    if (amount <= 0) { rowWarnings.push("missing-amount"); confidence -= 35; }
    else if (inferredAmountHeader) { rowWarnings.push("amount-inferred"); confidence -= 8; }
    if (!mapping.date || !cell(sheet, source, mapping.date)) { rowWarnings.push("missing-date"); confidence -= 10; }
    if (classified.category === "unclassified") rowWarnings.push("unclassified");
    if (requestedAccount && requestedAccount !== primary) rowWarnings.push("invalid-account-code");
    if (primary === counter) { rowWarnings.push("same-account"); confidence -= 30; }
    rows.push({ id: `sheet-${sheet.name}-${index + 1}`, rowNumber: (sheet.headerRowIndex || 0) + index + 2, date: asDate(cell(sheet, source, mapping.date)), description: description || `حركة Excel — صف ${index + 1}`, reference: String(cell(sheet, source, mapping.reference) ?? "").trim() || undefined, party: String(cell(sheet, source, mapping.party) ?? "").trim() || undefined, amount, direction, category: classified.category, categoryAr: classified.ar, categoryEn: classified.en, accountCode: primary, counterAccountCode: counter, confidence: Math.max(5, confidence), warnings: rowWarnings, source });
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
