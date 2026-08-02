import { normalizeArabicNumbers } from "@/lib/parser/normalize";
import { readSpreadsheet } from "@/lib/spreadsheet/reader";
import type { BankColumnMapping, BankImportContext, BankTransaction, CellValue, SheetData } from "@/types";

const aliases = {
  date: ["date", "transaction date", "value date", "posting date", "التاريخ", "تاريخ العملية", "تاريخ الحركة"],
  description: ["description", "details", "narration", "transaction details", "البيان", "الوصف", "التفاصيل", "تفاصيل العملية"],
  reference: ["reference", "ref", "transaction id", "رقم العملية", "المرجع", "مرجع"],
  debit: ["debit", "withdrawal", "withdrawals", "paid out", "مدين", "سحب", "مسحوبات", "خصم"],
  credit: ["credit", "deposit", "deposits", "paid in", "دائن", "ايداع", "إيداع", "اضافة", "إضافة"],
  amount: ["amount", "transaction amount", "value", "المبلغ", "مبلغ", "قيمة العملية"],
  direction: ["type", "transaction type", "direction", "dr cr", "نوع", "نوع العملية", "الحركة"],
  balance: ["balance", "running balance", "available balance", "الرصيد", "رصيد", "الرصيد المتاح"],
} as const;

export const normalizeBankHeader = (value: unknown) => normalizeArabicNumbers(String(value ?? ""))
  .toLowerCase().replace(/[أإآ]/g, "ا").replace(/[ً-ٟ]/g, "").replace(/[_./\\-]+/g, " ").replace(/\s+/g, " ").trim();

const findColumn = (headers: string[], names: readonly string[]) => {
  const wanted = names.map(normalizeBankHeader);
  return headers.findIndex((header) => wanted.some((name) => header === name || header.includes(name) || name.includes(header)));
};

export const bankNumberValue = (value: CellValue | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const source = normalizeArabicNumbers(String(value ?? "")).trim();
  const negative = /^\(.*\)$/.test(source) || /-$/.test(source);
  const parsed = Number(source.replace(/[(),،\s]/g, "").replace(/-$/, "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : 0;
};

export const bankDateValue = (value: CellValue | undefined) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20_000 && value < 80_000) return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000).toISOString().slice(0, 10);
  const text = normalizeArabicNumbers(String(value ?? "")).trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (local) return `${local[3].length === 2 ? `20${local[3]}` : local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
};

export const bankFingerprint = (value: Pick<BankTransaction, "date" | "description" | "reference" | "debit" | "credit">, bankAccountId = "bank") =>
  hash([bankAccountId, value.date, normalizeBankHeader(value.description), normalizeBankHeader(value.reference), value.debit.toFixed(2), value.credit.toFixed(2)].join("|"));

function resolvedIndexes(sheet: SheetData, mapping?: BankColumnMapping) {
  const normalized = sheet.headers.map(normalizeBankHeader);
  const manual = (name?: string) => name ? sheet.headers.findIndex((header) => header === name) : -1;
  return {
    date: mapping ? manual(mapping.date) : findColumn(normalized, aliases.date),
    description: mapping ? manual(mapping.description) : findColumn(normalized, aliases.description),
    reference: mapping ? manual(mapping.reference) : findColumn(normalized, aliases.reference),
    debit: mapping ? manual(mapping.debit) : findColumn(normalized, aliases.debit),
    credit: mapping ? manual(mapping.credit) : findColumn(normalized, aliases.credit),
    amount: mapping ? manual(mapping.amount) : findColumn(normalized, aliases.amount),
    direction: mapping ? manual(mapping.direction) : findColumn(normalized, aliases.direction),
    balance: mapping ? manual(mapping.balance) : findColumn(normalized, aliases.balance),
  };
}

export function parseBankSheet(sheet: SheetData, currency = "EGP", context: BankImportContext = {}): BankTransaction[] {
  const columns = resolvedIndexes(sheet, context.mapping);
  if (columns.date < 0 || (columns.debit < 0 && columns.credit < 0 && columns.amount < 0)) return [];
  const importedAt = new Date().toISOString();
  return sheet.rows.map((row, index): BankTransaction => {
    let debit = columns.debit >= 0 ? Math.abs(bankNumberValue(row[columns.debit])) : 0;
    let credit = columns.credit >= 0 ? Math.abs(bankNumberValue(row[columns.credit])) : 0;
    if (!debit && !credit && columns.amount >= 0) {
      const signed = bankNumberValue(row[columns.amount]);
      const direction = columns.direction >= 0 ? normalizeBankHeader(row[columns.direction]) : "";
      const isDebit = signed < 0 || ["debit", "withdrawal", "dr", "مدين", "سحب", "خصم"].some((word) => direction.includes(normalizeBankHeader(word)));
      const isCredit = ["credit", "deposit", "cr", "دائن", "ايداع", "إيداع", "اضافة", "إضافة"].some((word) => direction.includes(normalizeBankHeader(word)));
      if (isDebit && !isCredit) debit = Math.abs(signed); else credit = Math.abs(signed);
    }
    const date = bankDateValue(row[columns.date]);
    const description = columns.description >= 0 ? String(row[columns.description] ?? "").trim() : "حركة بنكية";
    const reference = columns.reference >= 0 ? String(row[columns.reference] ?? "").trim() : "";
    const validationErrors = [...(!date ? ["invalid-date"] : []), ...(!debit && !credit ? ["missing-amount"] : []), ...(debit > 0 && credit > 0 ? ["both-debit-credit"] : [])];
    const base = { date, description, reference, debit, credit };
    const fingerprint = bankFingerprint(base, context.bankAccountId);
    return {
      id: `bank-${fingerprint}`,
      ...base,
      companyId: context.companyId,
      bankAccountId: context.bankAccountId,
      fiscalYearId: context.fiscalYearId,
      periodId: context.periodId || date.slice(0, 7),
      importId: context.importId,
      fingerprint,
      balance: columns.balance >= 0 ? bankNumberValue(row[columns.balance]) : undefined,
      currency,
      status: validationErrors.length ? "invalid" : "unmatched",
      validationErrors,
      source: { fileName: context.fileName || "", sheetName: sheet.name, rowNumber: index + 2, importedAt },
    };
  }).filter((transaction) => transaction.date || transaction.debit > 0 || transaction.credit > 0);
}

export async function importBankStatement(file: File, currency = "EGP", context: BankImportContext = {}) {
  if (!/\.(csv|xlsx)$/i.test(file.name)) throw new Error("unsupported-bank-file");
  const sheets = await readSpreadsheet(file);
  const importId = context.importId || `import-${Date.now()}`;
  const transactions = sheets.flatMap((sheet) => parseBankSheet(sheet, currency, { ...context, importId, fileName: file.name }));
  if (!transactions.length) throw new Error("unrecognized-bank-columns");
  return { transactions, sheetsRead: sheets.length, sheetNames: sheets.map((sheet) => sheet.name), importId };
}
