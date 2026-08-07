import type { AccountType, ChartAccount, FinancialStatementSection, GeneratedJournalEntry, SheetData } from "@/types";
import { isPostedJournalEntry } from "./journal";
import { roundCurrency } from "./calculations";

export interface AccountBalanceSummary { balance: number; totalDebit: number; totalCredit: number; movementCount: number; lastMovement?: { date: string; entryNumber: string; narration: string } }
export interface AccountImportMapping { code: string; nameAr: string; nameEn: string; type: string; parent?: string; openingBalance?: string; description?: string }
export interface AccountImportPreviewRow { rowNumber: number; account?: ChartAccount; errors: string[]; valid: boolean }

export const getAccountByCode = (accounts: ChartAccount[], code?: string) => accounts.find((account) => account.code === code);
export const getAccountChildren = (accounts: ChartAccount[], id: string) => accounts.filter((account) => account.parentId === id).sort(accountSort);
export const isLeafAccount = (accounts: ChartAccount[], id: string) => !accounts.some((account) => account.parentId === id);
export const getPostingAccounts = (accounts: ChartAccount[]) => accounts.filter((account) => account.active && account.allowPosting !== false && isLeafAccount(accounts, account.id)).sort(accountSort);
export const getAccountsByType = (accounts: ChartAccount[], type: AccountType) => accounts.filter((account) => account.type === type).sort(accountSort);
export function accountSort(a: ChartAccount, b: ChartAccount) { return a.code.localeCompare(b.code, undefined, { numeric: true }); }

export function getAccountBalance(account: ChartAccount, entries: GeneratedJournalEntry[]): AccountBalanceSummary {
  const movements = entries.filter(isPostedJournalEntry).flatMap((entry) => entry.lines.filter((line) => line.accountCode === account.code).map((line) => ({ entry, line }))).sort((a, b) => `${a.entry.date}|${a.entry.createdAt || ""}`.localeCompare(`${b.entry.date}|${b.entry.createdAt || ""}`));
  const totalDebit = roundCurrency(movements.reduce((sum, item) => sum + item.line.debit, 0)), totalCredit = roundCurrency(movements.reduce((sum, item) => sum + item.line.credit, 0));
  const natural = account.normalBalance || (account.type === "asset" || account.type === "expense" ? "debit" : "credit"), opening = account.openingBalance || 0;
  const balance = roundCurrency(opening + (natural === "debit" ? totalDebit - totalCredit : totalCredit - totalDebit)), last = movements.at(-1)?.entry;
  return { balance, totalDebit, totalCredit, movementCount: movements.length, lastMovement: last ? { date: last.date, entryNumber: last.entryNumber, narration: last.narrationAr } : undefined };
}

export function suggestChildAccountCode(parent: ChartAccount, accounts: ChartAccount[]) {
  const width = Math.max(parent.code.length + 2, 4), prefix = parent.code, used = new Set(accounts.map((account) => account.code));
  for (let sequence = 1; sequence <= 999; sequence++) { const candidate = `${prefix}${String(sequence).padStart(width - prefix.length, "0")}`; if (!used.has(candidate)) return candidate; }
  return `${prefix}${Date.now().toString().slice(-3)}`;
}

export function hasCircularParent(accounts: ChartAccount[], accountId: string, parentId?: string) {
  const visited = new Set<string>([accountId]); let current = parentId;
  while (current) { if (visited.has(current)) return true; visited.add(current); current = accounts.find((account) => account.id === current)?.parentId; }
  return false;
}

export function validateAccount(account: ChartAccount, accounts: ChartAccount[], previous?: ChartAccount) {
  const errors: string[] = [], code = account.code.trim();
  if (!code) errors.push("Account code is required");
  if (!account.nameAr.trim() && !account.nameEn.trim()) errors.push("Arabic or English name is required");
  if (accounts.some((item) => item.id !== account.id && item.code === code)) errors.push("Duplicate account code");
  const parent = accounts.find((item) => item.id === account.parentId);
  if (account.parentId && !parent) errors.push("Invalid parent account");
  if (parent && parent.type !== account.type) errors.push("Child type must match parent type");
  if (hasCircularParent(accounts, account.id, account.parentId)) errors.push("Circular parent relationship");
  if (previous && previous.type !== account.type && accounts.some((item) => item.parentId === account.id)) errors.push("Account type cannot change while child accounts exist");
  return errors;
}

export function validateAccountCatalog(accounts: ChartAccount[]) {
  const errors: string[] = [], codes = new Set<string>(), ids = new Set(accounts.map((account) => account.id));
  for (const account of accounts) {
    const code = account.code.trim();
    if (!code) errors.push(`Missing account code: ${account.id}`);
    if (codes.has(code)) errors.push(`Duplicate account code: ${code}`); else codes.add(code);
    if (account.parentId && !ids.has(account.parentId)) errors.push(`Invalid parent for account: ${code}`);
    if (hasCircularParent(accounts, account.id, account.parentId)) errors.push(`Circular parent relationship: ${code}`);
  }
  return errors;
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[\s_.-]+/g, "");
const aliases: Record<keyof AccountImportMapping, string[]> = {
  code: ["code", "accountcode", "الكود", "كودالحساب", "رقمالحساب"], nameAr: ["arabicname", "namear", "الاسمالعربي", "اسمالحساب", "الحساب"],
  nameEn: ["englishname", "nameen", "الاسمالانجليزي", "الاسمالإنجليزي"], type: ["type", "accounttype", "النوع", "نوعالحساب"],
  parent: ["parent", "parentcode", "الحسابالأب", "كودالأب"], openingBalance: ["openingbalance", "opening", "الرصيدالافتتاحي"], description: ["description", "الوصف", "البيان"],
};
export function detectAccountImportMapping(headers: string[]): Partial<AccountImportMapping> { const result: Partial<AccountImportMapping> = {}; for (const [field, values] of Object.entries(aliases) as [keyof AccountImportMapping, string[]][]) { const header = headers.find((item) => values.includes(normalizeHeader(item))); if (header) result[field] = header; } return result; }
const typeMap: Record<string, AccountType> = { asset: "asset", assets: "asset", "أصول": "asset", "الأصول": "asset", liability: "liability", liabilities: "liability", "التزامات": "liability", "الالتزامات": "liability", equity: "equity", "حقوقالملكية": "equity", revenue: "revenue", income: "revenue", "إيرادات": "revenue", expense: "expense", expenses: "expense", "مصروفات": "expense", "تكلفةالمبيعات": "expense", "تكلفةالنشاط": "expense" };
const parseType = (value: unknown) => typeMap[String(value || "").toLowerCase().replace(/\s+/g, "")];
const statementFor = (type: AccountType, text: string): FinancialStatementSection => type === "asset" ? "current-assets" : type === "liability" ? "current-liabilities" : type === "equity" ? "equity" : type === "revenue" ? (/other|أخرى/.test(text) ? "other-revenue" : "operating-revenue") : (/cost|تكلفة/.test(text) ? "cost-of-sales" : "operating-expenses");

export function previewAccountImport(sheet: SheetData, mapping: AccountImportMapping, existing: ChartAccount[]): AccountImportPreviewRow[] {
  const index = (header?: string) => header ? sheet.headers.indexOf(header) : -1, value = (row: SheetData["rows"][number], header?: string) => { const position = index(header); return position >= 0 ? row[position] : undefined; };
  const candidates = sheet.rows.map((row, rowIndex) => { const code = String(value(row, mapping.code) || "").trim(), nameAr = String(value(row, mapping.nameAr) || "").trim(), nameEn = String(value(row, mapping.nameEn) || "").trim(), type = parseType(value(row, mapping.type)), parentCode = String(value(row, mapping.parent) || "").trim(), errors: string[] = [];
    if (!code) errors.push("Missing account code"); if (!nameAr && !nameEn) errors.push("Missing account name"); if (!type) errors.push("Missing or invalid account type");
    const account: ChartAccount | undefined = type ? { id: crypto.randomUUID(), code, nameAr: nameAr || nameEn, nameEn: nameEn || nameAr, type, active: true, allowPosting: true, normalBalance: type === "asset" || type === "expense" ? "debit" : "credit", level: 1, descriptionAr: String(value(row, mapping.description) || ""), descriptionEn: String(value(row, mapping.description) || ""), openingBalance: Number(value(row, mapping.openingBalance)) || 0, statementSection: statementFor(type, `${nameAr} ${nameEn}`), parentId: parentCode || undefined } : undefined;
    return { rowNumber: (sheet.headerRowIndex || 0) + rowIndex + 2, account, errors, valid: false };
  });
  const allCodes = new Set([...existing.map((item) => item.code), ...candidates.map((item) => item.account?.code).filter(Boolean) as string[]]);
  for (const row of candidates) { if (!row.account) continue; const duplicateCount = candidates.filter((item) => item.account?.code === row.account?.code).length; if (existing.some((item) => item.code === row.account!.code) || duplicateCount > 1) row.errors.push("Duplicate account code"); const parentCode = row.account.parentId; const parent = existing.find((item) => item.code === parentCode) || candidates.find((item) => item.account?.code === parentCode)?.account; if (parentCode && !allCodes.has(parentCode)) row.errors.push("Invalid parent code"); if (parent && parent.type !== row.account.type) row.errors.push("Parent account type mismatch"); row.account.parentId = parent?.id; row.account.level = parent ? (parent.level || 1) + 1 : 1; row.valid = row.errors.length === 0; }
  const combined = [...existing, ...candidates.filter((row) => row.valid && row.account).map((row) => row.account!)]; for (const row of candidates) if (row.account && hasCircularParent(combined, row.account.id, row.account.parentId)) { row.errors.push("Circular parent relationship"); row.valid = false; }
  return candidates;
}
