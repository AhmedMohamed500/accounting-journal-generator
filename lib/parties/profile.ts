import { agingForItems, itemOutstanding } from "./aging";
import { roundCurrency } from "@/lib/accounting/calculations";
import type { BusinessDocument, OpenItem, Party } from "@/types";

export interface PartyProfileSummary {
  party: Party;
  items: OpenItem[];
  documents: BusinessDocument[];
  aging: ReturnType<typeof agingForItems>;
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  netBusinessVolume: number;
  lastTransactionDate?: string;
  nextDueDate?: string;
  averageCreditDays: number;
  creditUtilization?: number;
}

const daysBetween = (from: string, to: string) => Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));

export function buildPartyProfile(party: Party, allItems: OpenItem[], allDocuments: BusinessDocument[], asOf: string): PartyProfileSummary {
  const items = allItems.filter((item) => item.partyId === party.id).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  const documents = allDocuments.filter((document) => document.partyId === party.id).sort((a, b) => b.date.localeCompare(a.date));
  const invoiced = roundCurrency(items.reduce((sum, item) => sum + item.amount, 0));
  const paid = roundCurrency(items.reduce((sum, item) => sum + Math.min(item.amount, item.paid), 0));
  const outstanding = roundCurrency(items.reduce((sum, item) => sum + itemOutstanding(item), 0));
  const overdueItems = items.filter((item) => itemOutstanding(item) > 0 && item.dueDate < asOf);
  const overdue = roundCurrency(overdueItems.reduce((sum, item) => sum + itemOutstanding(item), 0));
  const positive = party.type === "customer" ? ["sales-invoice", "receipt-voucher"] : ["purchase-invoice", "payment-voucher"];
  const returns = party.type === "customer" ? "sales-return" : "purchase-return";
  const netBusinessVolume = roundCurrency(documents.reduce((sum, document) => sum + (positive.includes(document.type) ? document.grandTotal : document.type === returns ? -document.grandTotal : 0), 0));
  const dates = [...items.map((item) => item.invoiceDate), ...documents.map((document) => document.date)].filter(Boolean).sort().reverse();
  const upcoming = items.filter((item) => itemOutstanding(item) > 0 && item.dueDate >= asOf).map((item) => item.dueDate).sort();
  const averageCreditDays = items.length ? Math.round(items.reduce((sum, item) => sum + daysBetween(item.invoiceDate, item.dueDate), 0) / items.length) : party.creditDays;
  return { party, items, documents, aging: agingForItems(items, asOf), invoiced, paid, outstanding, overdue, overdueCount: overdueItems.length, netBusinessVolume, lastTransactionDate: dates[0], nextDueDate: upcoming[0], averageCreditDays, creditUtilization: party.creditLimit ? roundCurrency(outstanding / party.creditLimit * 100) : undefined };
}

export function normalizeWhatsappPhone(phone: string, defaultCountryCode = "20") {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `${defaultCountryCode}${digits.slice(1)}`;
  return digits;
}

export function whatsappChatUrl(phone: string, message: string, defaultCountryCode = "20") {
  const normalized = normalizeWhatsappPhone(phone, defaultCountryCode);
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : "";
}
