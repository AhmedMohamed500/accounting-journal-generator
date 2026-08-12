import type { EntryWorkflowStatus, GeneratedJournalEntry, JournalEntrySource } from "@/types";
import { journalTotals } from "./balance";

export const JOURNAL_STATUS_LABELS: Record<EntryWorkflowStatus, { ar: string; en: string }> = {
  draft: { ar: "مسودة", en: "Draft" }, review: { ar: "بانتظار المراجعة", en: "Pending Review" },
  approved: { ar: "معتمد", en: "Approved" }, posted: { ar: "مرحّل", en: "Posted" },
  rejected: { ar: "مرفوض", en: "Rejected" }, reversed: { ar: "معكوس", en: "Reversed" },
};
export const JOURNAL_SOURCE_LABELS: Record<JournalEntrySource, { ar: string; en: string }> = {
  manual: { ar: "إدخال يدوي", en: "Manual" }, "natural-language-generator": { ar: "مولد اللغة الطبيعية", en: "Natural Language Generator" },
  "spreadsheet-import": { ar: "تحليل Excel المحاسبي", en: "Accounting Excel Analysis" },
  "bank-import": { ar: "استيراد البنك", en: "Bank Import" }, "bank-reconciliation": { ar: "التسوية البنكية", en: "Bank Reconciliation" },
  vat: { ar: "ضريبة القيمة المضافة", en: "VAT" }, "service-point": { ar: "نقطة الخدمات", en: "Service Point" },
  "merchant-accounting": { ar: "محاسبة التجار", en: "Merchant Accounting" }, "opening-balance": { ar: "رصيد افتتاحي", en: "Opening Balance" },
  adjustment: { ar: "قيد تسوية", en: "Adjustment" }, closing: { ar: "قيد إقفال", en: "Closing" },
  "invoice-capture": { ar: "قراءة فاتورة", en: "Invoice Capture" }, legacy: { ar: "قيد سابق", en: "Legacy" },
};

const pad = (value: number) => String(value).padStart(4, "0");
export function nextJournalNumber(entries: GeneratedJournalEntry[], date: string) {
  const year = date.slice(0, 4) || String(new Date().getFullYear());
  const numbers = entries.map((entry) => entry.entryNumber.match(new RegExp(`^JE-${year}-(\\d+)$`))?.[1]).filter(Boolean).map(Number);
  return `JE-${year}-${pad((numbers.length ? Math.max(...numbers) : 0) + 1)}`;
}
export function inferJournalSource(entry: GeneratedJournalEntry): JournalEntrySource {
  if (entry.source) return entry.source;
  if (entry.transactionType.startsWith("pos-")) return "service-point";
  if (entry.transactionType.includes("bank") || entry.entryNumber.startsWith("BNK-")) return "bank-import";
  return "legacy";
}
export function normalizeJournalEntry(entry: GeneratedJournalEntry, existing: GeneratedJournalEntry[] = [], source?: JournalEntrySource): GeneratedJournalEntry {
  const now = new Date().toISOString(), totals = journalTotals(entry.lines), status = entry.workflowStatus || "draft";
  const id = entry.id || crypto.randomUUID(), createdAt = entry.createdAt || entry.audit?.find((event) => event.action === "created")?.at || now;
  return {
    ...entry, id, entryNumber: /^JE-\d{4}-\d{4}$/.test(entry.entryNumber) ? entry.entryNumber : nextJournalNumber(existing.filter((item) => item.id !== id), entry.date),
    source: source || inferJournalSource(entry), fiscalPeriodId: entry.fiscalPeriodId || entry.date.slice(0, 7), workflowStatus: status,
    createdBy: entry.createdBy || "Local user", createdAt, totalDebit: totals.debit, totalCredit: totals.credit,
    isBalanced: Math.abs(totals.debit - totals.credit) < .01,
    audit: entry.audit?.length ? entry.audit : [{ id: crypto.randomUUID(), entryId: id, action: "created", at: createdAt, actor: entry.createdBy || "Local user" }],
  };
}
export const isPostedJournalEntry = (entry: GeneratedJournalEntry) => entry.isBalanced && (!entry.workflowStatus || entry.workflowStatus === "posted" || entry.workflowStatus === "reversed");
