"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Send, ShieldCheck, XCircle } from "lucide-react";
import { loadEntries, saveEntries } from "@/lib/storage/accounting";
import { assertDateOpen } from "@/lib/storage/periods";
import { AccountingCycleTrace } from "./accounting-cycle-trace";
import { EntryImpact } from "./entry-impact";
import type { EntryWorkflowStatus, GeneratedJournalEntry, Locale } from "@/types";

const transitions: Record<EntryWorkflowStatus, EntryWorkflowStatus[]> = { draft: ["review"], review: ["approved", "rejected"], approved: ["posted", "rejected"], posted: ["reversed"], rejected: ["draft"], reversed: [] };

export function ReviewCenter({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [entries, setEntries] = useState<GeneratedJournalEntry[]>([]), [filter, setFilter] = useState("all"), [message, setMessage] = useState("");
  useEffect(() => { setEntries(loadEntries()); }, []);
  const status = (entry: GeneratedJournalEntry): EntryWorkflowStatus => entry.workflowStatus || "posted";
  const labels: Record<EntryWorkflowStatus, string> = ar ? { draft: "مسودة", review: "بانتظار المراجعة", approved: "معتمد", posted: "مرحّل", rejected: "مرفوض", reversed: "معكوس" } : { draft: "Draft", review: "In review", approved: "Approved", posted: "Posted", rejected: "Rejected", reversed: "Reversed" };
  const change = (entry: GeneratedJournalEntry, next: EntryWorkflowStatus) => { try { if (next === "posted" || next === "reversed") assertDateOpen(entry.date); const updated = entries.map((item) => item.id === entry.id ? { ...item, workflowStatus: next, audit: [...(item.audit || []), { id: crypto.randomUUID(), entryId: item.id, action: next, at: new Date().toISOString(), actor: "Local user" }] } : item); setEntries(updated); saveEntries(updated); setMessage(next === "posted" ? (ar ? "تم ترحيل القيد وتحديث اليومية والأستاذ وميزان المراجعة والقوائم. في دفتر الأستاذ اختر حساب 1110 — البنوك، وتأكد أن الفترة تشمل تاريخ القيد." : "Entry posted and all reports updated. In the ledger select account 1110 — Banks and include the entry date.") : next === "approved" ? (ar ? "تم اعتماد القيد فقط، ولم يؤثر على الأستاذ والقوائم بعد. اضغط ترحيل القيد لإتمام الدورة المحاسبية." : "Entry approved only; it has not affected reports yet. Post it to complete the accounting cycle.") : next === "review" ? (ar ? "تم إرسال القيد للمراجعة، ولم يرحل إلى الدفاتر بعد." : "Entry sent for review; it has not been posted yet.") : ""); } catch (error) { setMessage(error instanceof Error ? error.message : "Period is locked"); } };
  const visible = entries.filter((entry) => filter === "all" || status(entry) === filter);
  return <div className="grid"><section className="grid four">{(["draft", "review", "approved", "posted"] as EntryWorkflowStatus[]).map((item) => <div className="card" key={item}><span className="muted">{labels[item]}</span><div className="impact">{entries.filter((entry) => status(entry) === item).length}</div></div>)}</section>
    <section className="card"><label>{ar ? "تصفية حسب الحالة" : "Filter status"}<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">{ar ? "الكل" : "All"}</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>{message && <p className="warning">{message}</p>}
      <div className="grid section">{visible.map((entry) => <article className="card" key={entry.id}><div className="actions justify-between"><div><span className="badge">{labels[status(entry)]}</span><h3>{ar ? entry.titleAr : entry.titleEn}</h3><p className="muted">{entry.entryNumber} · {entry.date} · {entry.totalDebit.toLocaleString()} {entry.currency}</p></div><div className="actions">{transitions[status(entry)].map((next) => <button className={`btn ${next === "posted" ? "btn-primary" : ""}`} key={next} onClick={() => change(entry, next)}>{next === "review" ? <Send size={16} /> : next === "rejected" ? <XCircle size={16} /> : next === "posted" ? <ShieldCheck size={16} /> : <CheckCircle2 size={16} />}{next==="posted"?(ar?"ترحيل القيد":"Post entry"):labels[next]}</button>)}</div></div>
        <details><summary>{ar ? "سجل النشاط" : "Audit trail"}</summary><ul>{(entry.audit || []).map((event) => <li key={event.id}>{new Date(event.at).toLocaleString(ar ? "ar-EG" : "en-US")} — {event.actor} — {labels[event.action as EntryWorkflowStatus] || event.action}</li>)}</ul></details>
        <details><summary><b>{ar ? "الدورة المحاسبية وتأثير القيد" : "Accounting cycle and entry impact"}</b></summary><div className="grid section"><AccountingCycleTrace entry={{ ...entry, workflowStatus: status(entry) }} locale={locale} /><EntryImpact entry={entry} locale={locale} /></div></details>
      </article>)}{!visible.length && <p className="muted">{ar ? "لا توجد قيود بهذه الحالة." : "No entries with this status."}</p>}</div>
    </section>
  </div>;
}
