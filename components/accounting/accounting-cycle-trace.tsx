"use client";
import Link from "next/link";
import { BookOpen, CheckCircle2, ChartNoAxesCombined, CircleX, ClipboardCheck, Clock3, FileText, LibraryBig, Scale, ShieldCheck } from "lucide-react";
import { traceAccountingCycle, type CycleStageId } from "@/lib/accounting/cycle";
import type { GeneratedJournalEntry, Locale } from "@/types";

const stageLabels: Record<CycleStageId, { ar: string; en: string }> = {
  source: { ar: "مصدر العملية أو المستند", en: "Source document" }, entry: { ar: "إنشاء القيد", en: "Journal entry creation" }, review: { ar: "المراجعة", en: "Review" }, approval: { ar: "الاعتماد", en: "Approval" },
  journal: { ar: "دفتر اليومية", en: "General journal" }, ledger: { ar: "دفتر الأستاذ", en: "General ledger" }, "trial-balance": { ar: "ميزان المراجعة", en: "Trial balance" }, statements: { ar: "القوائم المالية", en: "Financial statements" },
};
const icons: Record<CycleStageId, typeof FileText> = { source: FileText, entry: ClipboardCheck, review: BookOpen, approval: ShieldCheck, journal: LibraryBig, ledger: BookOpen, "trial-balance": Scale, statements: ChartNoAxesCombined };

export function AccountingCycleTrace({ entry, locale, title }: { entry: GeneratedJournalEntry; locale: Locale; title?: string }) {
  const ar = locale === "ar", trace = traceAccountingCycle(entry);
  return <section className="card" data-cycle-trace-id={entry.id} style={{ borderInlineStart: `5px solid ${trace.posted ? "#10b981" : "#f59e0b"}` }}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2"><LibraryBig size={21} />{title || (ar ? "ماذا حدث في الدورة المحاسبية؟" : "What happened in the accounting cycle?")}</h2><p className="muted">{ar ? trace.summaryAr : trace.summaryEn}</p></div><span className={trace.posted ? "badge" : "warning"}>{trace.posted ? (ar ? "الدورة مكتملة" : "Cycle complete") : (ar ? "الدورة لم تكتمل" : "Cycle pending")}</span></div>
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{trace.stages.map((stage, index) => { const Icon = icons[stage.id], completed = stage.state === "completed", blocked = stage.state === "blocked"; return <article className="relative rounded-xl border border-daftar-line bg-daftar-card p-4" key={stage.id}><div className="mb-3 flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: completed ? "#dff7eb" : blocked ? "#fee4e2" : "#fff5d9", color: completed ? "#087443" : blocked ? "#b42318" : "#805b00" }}><Icon size={18} /></span><span className="text-xs font-black text-daftar-muted">{index + 1}/8</span></div><h3 className="mb-1 font-black">{ar ? stageLabels[stage.id].ar : stageLabels[stage.id].en}</h3><p className="m-0 text-sm leading-6 text-daftar-muted">{ar ? stage.detailAr : stage.detailEn}</p><div className="mt-3 flex items-center gap-1 text-xs font-bold" style={{ color: completed ? "#087443" : blocked ? "#b42318" : "#805b00" }}>{completed ? <CheckCircle2 size={14} /> : blocked ? <CircleX size={14} /> : <Clock3 size={14} />}{completed ? (ar ? "تم" : "Done") : blocked ? (ar ? "متوقف" : "Blocked") : stage.state === "current" ? (ar ? "المرحلة الحالية" : "Current") : (ar ? "منتظر" : "Pending")}</div></article>; })}</div>
    <div className="actions mt-5 no-print"><Link className="btn" href={`/${locale}/review`}>{ar ? "مركز الاعتماد" : "Review center"}</Link><Link className="btn" href={`/${locale}/journal`}>{ar ? "اليومية والأستاذ" : "Journal & ledger"}</Link><Link className="btn" href={`/${locale}/trial-balance`}>{ar ? "ميزان المراجعة" : "Trial balance"}</Link><Link className="btn" href={`/${locale}/reports`}>{ar ? "القوائم المالية" : "Financial statements"}</Link></div>
  </section>;
}
