import { normalizeArabicNumbers } from "@/lib/parser/normalize";
import { readSpreadsheet } from "@/lib/spreadsheet/reader";
import type { BankTransaction, CellValue, SheetData } from "@/types";

const aliases = {
  date: ["date", "transaction date", "value date", "تاريخ", "تاريخ العملية", "تاريخ الحركة"],
  description: ["description", "details", "narration", "transaction details", "بيان", "الوصف", "تفاصيل", "تفاصيل العملية"],
  reference: ["reference", "ref", "transaction id", "رقم العملية", "مرجع", "المرجع"],
  debit: ["debit", "withdrawal", "withdrawals", "paid out", "مدين", "سحب", "مسحوبات", "خصم"],
  credit: ["credit", "deposit", "deposits", "paid in", "دائن", "ايداع", "إيداع", "اضافة", "إضافة"],
  amount: ["amount", "transaction amount", "value", "مبلغ", "المبلغ", "قيمة العملية"],
  direction: ["type", "transaction type", "direction", "dr cr", "نوع", "نوع العملية", "الحركة"],
  balance: ["balance", "running balance", "available balance", "رصيد", "الرصيد", "الرصيد المتاح"],
} as const;

const normalize = (value: unknown) => normalizeArabicNumbers(String(value ?? ""))
  .toLowerCase()
  .replace(/[أإآ]/g, "ا")
  .replace(/[ً-ٟ]/g, "")
  .replace(/[_./\\-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const findColumn = (headers: string[], names: readonly string[]) => {
  const wanted = names.map(normalize);
  return headers.findIndex((header) => wanted.some((name) => header === name || header.includes(name) || name.includes(header)));
};

const numberValue = (value: CellValue | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const source = normalizeArabicNumbers(String(value ?? "")).trim();
  const negative = /^\(.*\)$/.test(source) || /-$/.test(source);
  const parsed = Number(source.replace(/[(),\s]/g, "").replace(/-$/, "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : 0;
};

const dateValue = (value: CellValue | undefined) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20_000 && value < 80_000) {
    const excelDate = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return excelDate.toISOString().slice(0, 10);
  }
  const text = normalizeArabicNumbers(String(value ?? "")).trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (local) {
    const year = local[3].length === 2 ? `20${local[3]}` : local[3];
    return `${year}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

export function parseBankSheet(sheet: SheetData, currency = "EGP"): BankTransaction[] {
  const headers = sheet.headers.map(normalize);
  const date = findColumn(headers, aliases.date);
  const description = findColumn(headers, aliases.description);
  const reference = findColumn(headers, aliases.reference);
  const debit = findColumn(headers, aliases.debit);
  const credit = findColumn(headers, aliases.credit);
  const amount = findColumn(headers, aliases.amount);
  const direction = findColumn(headers, aliases.direction);
  const balance = findColumn(headers, aliases.balance);
  if (date < 0 || (debit < 0 && credit < 0 && amount < 0)) return [];

  return sheet.rows.map((row, index): BankTransaction => {
    let debitValue = debit >= 0 ? Math.abs(numberValue(row[debit])) : 0;
    let creditValue = credit >= 0 ? Math.abs(numberValue(row[credit])) : 0;
    if (!debitValue && !creditValue && amount >= 0) {
      const signed = numberValue(row[amount]);
      const type = direction >= 0 ? normalize(row[direction]) : "";
      const isDebit = signed < 0 || ["debit", "withdrawal", "dr", "مدين", "سحب", "خصم"].some((word) => type.includes(normalize(word)));
      const isCredit = ["credit", "deposit", "cr", "دائن", "ايداع", "إيداع", "اضافة", "إضافة"].some((word) => type.includes(normalize(word)));
      if (isDebit && !isCredit) debitValue = Math.abs(signed);
      else creditValue = Math.abs(signed);
    }
    return {
      id: `bank-${Date.now()}-${sheet.name}-${index}`,
      date: dateValue(row[date]),
      description: description >= 0 ? String(row[description] ?? "") : "Bank transaction",
      reference: reference >= 0 ? String(row[reference] ?? "") : "",
      debit: debitValue,
      credit: creditValue,
      balance: balance >= 0 ? numberValue(row[balance]) : undefined,
      currency,
      status: "unmatched",
    };
  }).filter((transaction) => transaction.date && (transaction.debit > 0 || transaction.credit > 0));
}

export async function importBankStatement(file: File, currency = "EGP") {
  const lower = file.name.toLowerCase();
  if (!/\.(csv|xlsx)$/.test(lower)) throw new Error("unsupported-bank-file");
  const sheets = await readSpreadsheet(file);
  const transactions = sheets.flatMap((sheet) => parseBankSheet(sheet, currency));
  if (!transactions.length) throw new Error("unrecognized-bank-columns");
  return { transactions, sheetsRead: sheets.length };
}
