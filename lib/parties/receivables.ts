import type { ChartAccount, GeneratedJournalEntry, OpenItem, OpenItemAllocation, Party } from "@/types";
import { roundCurrency } from "@/lib/accounting/calculations";
import { duplicateInvoice } from "@/lib/accounting/integrity";
import { generateJournalEntry } from "@/rules";
import { itemOutstanding } from "./aging";

export interface CustomerInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  netAmount: number;
  vatRate: number;
  currency: string;
  revenueAccountCode: string;
}

export interface CustomerCollectionInput {
  date: string;
  amount: number;
  paymentAccountCode: string;
  reference?: string;
}

export interface CustomerStatementRow {
  id: string;
  date: string;
  type: "invoice" | "collection";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  entryId?: string;
}

const randomId = () => crypto.randomUUID();

function customerLine(entry: GeneratedJournalEntry, party: Party) {
  return entry.lines.map((line) => line.accountCode === "1120" ? { ...line, partyId: party.id, partyName: party.nameAr } : line);
}

function receivableEntry(entry: GeneratedJournalEntry, party: Party, reference: string, transactionId: string) {
  return {
    ...entry,
    source: "customer-receivables" as const,
    workflowStatus: "draft" as const,
    reference,
    sourceReference: reference,
    partyId: party.id,
    partyName: party.nameAr,
    linkedTransactionIds: [transactionId],
    lines: customerLine(entry, party),
  };
}

export function createCustomerInvoice(
  party: Party,
  input: CustomerInvoiceInput,
  existingItems: OpenItem[],
  accounts: ChartAccount[],
) {
  if (party.type !== "customer") throw new Error("الطرف المحدد ليس عميلاً.");
  if (!party.active) throw new Error("لا يمكن تسجيل فاتورة على عميل موقوف.");
  if (!input.invoiceNumber.trim()) throw new Error("رقم الفاتورة مطلوب.");
  if (!input.invoiceDate || !input.dueDate) throw new Error("تاريخ الفاتورة والاستحقاق مطلوبان.");
  if (input.dueDate < input.invoiceDate) throw new Error("تاريخ الاستحقاق لا يمكن أن يسبق تاريخ الفاتورة.");
  if (!input.description.trim()) throw new Error("بيان الخدمة أو التوريد مطلوب.");
  if (!Number.isFinite(input.netAmount) || input.netAmount <= 0) throw new Error("صافي الفاتورة يجب أن يكون أكبر من صفر.");
  if (!Number.isFinite(input.vatRate) || input.vatRate < 0 || input.vatRate > 100) throw new Error("نسبة الضريبة غير صحيحة.");
  if (duplicateInvoice(existingItems, party.id, input.invoiceNumber)) throw new Error("رقم الفاتورة مسجل سابقًا لهذا العميل.");
  const revenue = accounts.find((account) => account.code === input.revenueAccountCode && account.active && account.type === "revenue" && account.allowPosting !== false);
  if (!revenue) throw new Error("اختر حساب إيراد صالحًا من دليل الحسابات.");

  const vatAmount = roundCurrency(input.netAmount * input.vatRate / 100), amount = roundCurrency(input.netAmount + vatAmount), itemId = randomId();
  const generated = generateJournalEntry({
    type: "credit-sale", amount: input.netAmount, date: input.invoiceDate, currency: input.currency,
    paymentMethod: "credit", vatEnabled: input.vatRate > 0, vatRate: input.vatRate,
    customer: party.nameAr, notes: `${input.invoiceNumber} — ${input.description}`,
  });
  const lines = generated.lines.map((line) => line.accountCode === "4100"
    ? { ...line, accountCode: revenue.code, accountNameAr: revenue.nameAr, accountNameEn: revenue.nameEn }
    : line.accountCode === "1120" ? { ...line, partyId: party.id, partyName: party.nameAr } : line);
  const entry = receivableEntry({
    ...generated, lines,
    titleAr: `فاتورة بيع آجل — ${party.nameAr}`,
    titleEn: `Credit invoice — ${party.nameEn}`,
    narrationAr: `إثبات فاتورة ${input.invoiceNumber} للعميل ${party.nameAr} — ${input.description}`,
    narrationEn: `Record invoice ${input.invoiceNumber} for ${party.nameEn} — ${input.description}`,
  }, party, input.invoiceNumber, itemId);
  const item: OpenItem = {
    id: itemId, partyId: party.id, kind: "receivable", invoiceNumber: input.invoiceNumber.trim(),
    invoiceDate: input.invoiceDate, dueDate: input.dueDate, description: input.description.trim(),
    currency: input.currency, netAmount: roundCurrency(input.netAmount), vatAmount, amount, paid: 0,
    status: input.dueDate < new Date().toISOString().slice(0, 10) ? "overdue" : "open",
    linkedEntryId: entry.id, invoiceEntryId: entry.id, collectionEntryIds: [], allocations: [], createdAt: new Date().toISOString(),
  };
  const projectedBalance = roundCurrency(existingItems.filter((current) => current.partyId === party.id && current.kind === "receivable").reduce((sum, current) => sum + itemOutstanding(current), 0) + amount);
  const warning = party.creditLimit && projectedBalance > party.creditLimit
    ? `الفاتورة تتجاوز حد ائتمان العميل بمبلغ ${roundCurrency(projectedBalance - party.creditLimit)} ${input.currency}.` : undefined;
  return { item, entry, warning };
}

export function createCustomerCollection(
  party: Party,
  item: OpenItem,
  input: CustomerCollectionInput,
  accounts: ChartAccount[],
) {
  if (party.type !== "customer" || item.kind !== "receivable" || item.partyId !== party.id) throw new Error("الفاتورة لا تخص العميل المحدد.");
  const outstanding = itemOutstanding(item);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("قيمة التحصيل يجب أن تكون أكبر من صفر.");
  if (input.amount > outstanding) throw new Error("قيمة التحصيل أكبر من الرصيد المتبقي للفاتورة.");
  const payment = accounts.find((account) => account.code === input.paymentAccountCode && account.active && account.type === "asset" && account.allowPosting !== false);
  if (!payment) throw new Error("اختر حساب صندوق أو بنك صالحًا.");
  const generated = generateJournalEntry({
    type: "customer-collection", amount: input.amount, date: input.date, currency: item.currency,
    paymentMethod: payment.code === "1100" ? "cash" : "bank", paymentAccountCode: payment.code,
    paymentAccountNameAr: payment.nameAr, paymentAccountNameEn: payment.nameEn,
    customer: party.nameAr, notes: `${item.invoiceNumber} — ${input.reference || party.nameAr}`,
  });
  const allocationId = randomId();
  const entry = receivableEntry({
    ...generated,
    titleAr: `تحصيل من العميل — ${party.nameAr}`,
    titleEn: `Customer collection — ${party.nameEn}`,
    narrationAr: `تحصيل من العميل ${party.nameAr} عن الفاتورة ${item.invoiceNumber}${input.reference ? ` — ${input.reference}` : ""}`,
    narrationEn: `Collection from ${party.nameEn} against invoice ${item.invoiceNumber}${input.reference ? ` — ${input.reference}` : ""}`,
  }, party, input.reference || item.invoiceNumber, item.id);
  const allocation: OpenItemAllocation = {
    id: allocationId, date: input.date, amount: roundCurrency(input.amount), paymentAccountCode: payment.code,
    reference: input.reference?.trim() || undefined, linkedEntryId: entry.id, createdAt: new Date().toISOString(),
  };
  const paid = roundCurrency(item.paid + input.amount);
  const updatedItem: OpenItem = {
    ...item, paid, status: paid >= item.amount ? "paid" : "partial",
    collectionEntryIds: [...(item.collectionEntryIds || []), entry.id], allocations: [...(item.allocations || []), allocation],
  };
  return { item: updatedItem, entry, allocation };
}

export function buildCustomerStatement(partyId: string, items: OpenItem[]): CustomerStatementRow[] {
  const movements = items.filter((item) => item.kind === "receivable" && item.partyId === partyId).flatMap((item) => {
    const allocations = item.allocations || [], allocated = roundCurrency(allocations.reduce((sum, allocation) => sum + allocation.amount, 0)), legacyPaid = roundCurrency(Math.max(0, item.paid - allocated));
    return [
      { id: item.id, date: item.invoiceDate, order: 0, type: "invoice" as const, reference: item.invoiceNumber, description: item.description || "فاتورة بيع آجل", debit: item.amount, credit: 0, entryId: item.invoiceEntryId || item.linkedEntryId },
      ...allocations.map((allocation) => ({ id: allocation.id, date: allocation.date, order: 1, type: "collection" as const, reference: allocation.reference || item.invoiceNumber, description: `تحصيل عن الفاتورة ${item.invoiceNumber}`, debit: 0, credit: allocation.amount, entryId: allocation.linkedEntryId })),
      ...(legacyPaid ? [{ id: `${item.id}-legacy-paid`, date: item.invoiceDate, order: 2, type: "collection" as const, reference: item.invoiceNumber, description: `رصيد محصل سابقًا عن الفاتورة ${item.invoiceNumber}`, debit: 0, credit: legacyPaid, entryId: undefined }] : []),
    ];
  }).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.id.localeCompare(b.id));
  let balance = 0;
  return movements.map((movement) => {
    balance = roundCurrency(balance + movement.debit - movement.credit);
    return { id: movement.id, date: movement.date, type: movement.type, reference: movement.reference, description: movement.description, debit: movement.debit, credit: movement.credit, balance, entryId: movement.entryId };
  });
}

export function customerEntries(partyId: string, entries: GeneratedJournalEntry[]) {
  return entries.filter((entry) => entry.partyId === partyId || entry.lines.some((line) => line.partyId === partyId));
}
