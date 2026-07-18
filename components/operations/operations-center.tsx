"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, FileSearch, Search } from "lucide-react";
import { buildOperationDossier } from "@/lib/accounting/operation-dossier";
import { loadAccounts, loadEntries } from "@/lib/storage/accounting";
import { loadBusinessDocuments } from "@/lib/storage/business-documents";
import { loadDocuments } from "@/lib/storage/documents";
import { loadCustodies } from "@/lib/storage/custody";
import { loadBankTransactions } from "@/lib/storage/banking";
import { loadOpenItems, loadParties } from "@/lib/storage/parties";
import type { OperationDossier, Locale } from "@/types";

export function OperationsCenter({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [items, setItems] = useState<OperationDossier[]>([]), [query, setQuery] = useState(""), [status, setStatus] = useState("all");
  useEffect(() => { const entries = loadEntries(), accounts = loadAccounts(), businessDocuments = loadBusinessDocuments(), documents = loadDocuments(), custodies = loadCustodies(), parties = loadParties(), openItems = loadOpenItems(), periods = [...new Set(entries.map((entry) => entry.date.slice(0, 7)))], bankTransactions = periods.flatMap(loadBankTransactions); setItems(entries.map((entry) => buildOperationDossier({ entry, entries, accounts, businessDocuments, documents, custodies, parties, openItems, bankTransactions }))); }, []);
  const visible = useMemo(() => items.filter((item) => (status === "all" || (item.entry.workflowStatus || "posted") === status) && `${item.entry.entryNumber} ${item.entry.titleAr} ${item.entry.titleEn} ${item.source.reference || ""} ${item.source.partyAr || ""}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const posted = items.filter((item) => !item.entry.workflowStatus || item.entry.workflowStatus === "posted").length;
  return <div className="grid"><section className="grid four"><Metric title={ar ? "كل العمليات" : "All operations"} value={items.length} /><Metric title={ar ? "مرحّلة بالكامل" : "Fully posted"} value={posted} /><Metric title={ar ? "تنتظر استكمال الدورة" : "Cycle pending"} value={items.length - posted} /><Metric title={ar ? "مرتبطة بمصدر" : "Linked to source"} value={items.filter((item) => item.source.kind !== "manual").length} /></section>
    <section className="card no-print"><div className="grid two"><label><Search size={16} />{ar ? "بحث في العمليات" : "Search operations"}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "رقم القيد أو المستند أو اسم الطرف" : "Entry, document, or party"} /></label><label>{ar ? "حالة الدورة" : "Cycle status"}<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{ar ? "الكل" : "All"}</option><option value="draft">{ar ? "مسودة" : "Draft"}</option><option value="review">{ar ? "مراجعة" : "Review"}</option><option value="approved">{ar ? "معتمد" : "Approved"}</option><option value="posted">{ar ? "مرحّل" : "Posted"}</option></select></label></div></section>
    <section className="grid">{visible.map((item) => <article className="card" key={item.entry.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="actions"><span className={!item.entry.workflowStatus || item.entry.workflowStatus === "posted" ? "badge" : "warning"}>{workflowLabel(item.entry.workflowStatus || "posted", ar)}</span><span className="badge">{sourceLabel(item.source.kind, ar)}</span></div><h2>{ar ? item.entry.titleAr : item.entry.titleEn}</h2><p className="muted">{item.entry.entryNumber} · {item.entry.date} · {item.entry.totalDebit.toLocaleString()} {item.entry.currency}</p><p>{ar ? item.source.detailAr : item.source.detailEn}</p></div><Link className="btn btn-primary" href={`/${locale}/operations/${item.entry.id}`}><FileSearch size={17} />{ar ? "فتح بطاقة العملية الكاملة" : "Open full operation dossier"}<ArrowUpLeft size={15} /></Link></div></article>)}{!visible.length && <article className="card muted">{ar ? "لا توجد عمليات مطابقة." : "No matching operations."}</article>}</section>
  </div>;
}
function Metric({ title, value }: { title: string; value: number }) { return <div className="card"><span className="muted">{title}</span><div className="impact">{value}</div></div>; }
function workflowLabel(status: string, ar: boolean) { const labels: Record<string, string> = ar ? { draft: "مسودة", review: "مراجعة", approved: "معتمد", posted: "مرحّل", rejected: "مرفوض", reversed: "معكوس" } : { draft: "Draft", review: "Review", approved: "Approved", posted: "Posted", rejected: "Rejected", reversed: "Reversed" }; return labels[status] || status; }
function sourceLabel(kind: string, ar: boolean) { const labels: Record<string, string> = ar ? { "business-document": "دورة مستندية", "uploaded-document": "مستند مرفوع", custody: "عهدة", bank: "بنك", manual: "قيد مباشر" } : { "business-document": "Document cycle", "uploaded-document": "Upload", custody: "Custody", bank: "Bank", manual: "Direct entry" }; return labels[kind] || kind; }
