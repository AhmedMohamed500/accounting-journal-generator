import type { ChartAccount, GeneratedJournalEntry } from "@/types";
import { journalTotals } from "./balance";

export interface JournalValidationIssue { code: string; messageAr: string; messageEn: string; field?: string }
export interface JournalValidationResult { valid: boolean; errors: JournalValidationIssue[]; warnings: JournalValidationIssue[]; totalDebit: number; totalCredit: number }

export function validateJournalEntry(entry: GeneratedJournalEntry, accounts: ChartAccount[] = []): JournalValidationResult {
  const errors: JournalValidationIssue[] = [], warnings: JournalValidationIssue[] = [], totals = journalTotals(entry.lines || []);
  const error = (code: string, messageAr: string, messageEn: string, field?: string) => errors.push({ code, messageAr, messageEn, field });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "")) error("date-required", "أدخل تاريخًا صحيحًا للقيد.", "A valid entry date is required.", "date");
  if (!(entry.narrationAr || entry.narrationEn || "").trim()) error("narration-required", "بيان القيد مطلوب.", "Entry narration is required.", "narration");
  if (!entry.lines || entry.lines.length < 2) error("two-lines-required", "القيد يجب أن يحتوي على طرفين على الأقل.", "At least two entry lines are required.", "lines");
  entry.lines?.forEach((line, index) => {
    if (!line.accountCode) error("account-required", `اختر حسابًا للبند ${index + 1}.`, `Select an account for line ${index + 1}.`, `lines.${index}.accountCode`);
    if (line.debit < 0 || line.credit < 0) error("negative-amount", "لا يسمح بقيمة سالبة؛ ضع القيمة في الجانب الصحيح.", "Negative debit or credit values are not allowed.", `lines.${index}`);
    if (line.debit > 0 && line.credit > 0) error("two-sided-line", "لا يمكن أن يكون البند مدينًا ودائنًا في الوقت نفسه.", "A line cannot contain both debit and credit.", `lines.${index}`);
    if (line.debit === 0 && line.credit === 0) error("empty-line", "لا يسمح ببند قيمته صفر في الطرفين.", "A line cannot be zero on both sides.", `lines.${index}`);
    const account = accounts.find((item) => item.code === line.accountCode);
    if (accounts.length && !account) error("unknown-account", `الحساب ${line.accountCode} غير موجود في الدليل.`, `Account ${line.accountCode} does not exist.`, `lines.${index}.accountCode`);
    const hasChildren = account ? accounts.some((item) => item.parentId === account.id) : false;
    if (account && (!account.active || account.allowPosting === false || hasChildren)) error("blocked-account", `الحساب ${account.code} غير متاح للترحيل. اختر حسابًا نهائيًا نشطًا.`, `Account ${account.code} is not postable. Select an active leaf account.`, `lines.${index}.accountCode`);
  });
  if (Math.abs(totals.debit - totals.credit) >= .01) error("unbalanced", "إجمالي المدين يجب أن يساوي إجمالي الدائن.", "Debit total must equal credit total.", "totals");
  if (totals.debit <= 0 || totals.credit <= 0) error("zero-total", "إجمالي القيد يجب أن يكون أكبر من صفر.", "Entry totals must be greater than zero.", "totals");
  if (!entry.reference) warnings.push({ code: "reference-missing", messageAr: "يفضل إضافة مرجع أو رقم مستند.", messageEn: "A reference or document number is recommended.", field: "reference" });
  return { valid: errors.length === 0, errors, warnings, totalDebit: totals.debit, totalCredit: totals.credit };
}
export function assertValidJournalEntry(entry: GeneratedJournalEntry, accounts: ChartAccount[] = []) { const result = validateJournalEntry(entry, accounts); if (!result.valid) throw new Error(result.errors[0].messageAr); return result; }
