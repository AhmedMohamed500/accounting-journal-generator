import type { EntryWorkflowStatus, GeneratedJournalEntry } from "@/types";

export type CycleStageId = "source" | "entry" | "review" | "approval" | "journal" | "ledger" | "trial-balance" | "statements";
export type CycleStageState = "completed" | "current" | "pending" | "blocked";
export interface AccountingCycleStage { id: CycleStageId; state: CycleStageState; detailAr: string; detailEn: string }
export interface AccountingCycleTrace { workflowStatus: EntryWorkflowStatus; stages: AccountingCycleStage[]; posted: boolean; summaryAr: string; summaryEn: string }

export function traceAccountingCycle(entry: GeneratedJournalEntry): AccountingCycleTrace {
  const status = entry.workflowStatus || "draft", posted = status === "posted", reviewed = ["review", "approved", "posted", "reversed"].includes(status), approved = ["approved", "posted", "reversed"].includes(status);
  const stage = (id: CycleStageId, state: CycleStageState, detailAr: string, detailEn: string): AccountingCycleStage => ({ id, state, detailAr, detailEn });
  const downstreamState: CycleStageState = posted ? "completed" : status === "reversed" ? "blocked" : "pending";
  const accountCount = new Set(entry.lines.map((line) => line.accountCode || line.accountNameEn)).size;
  const stages = [
    stage("source", "completed", `تم تسجيل مصدر العملية وبياناتها بتاريخ ${entry.date}.`, `Source transaction recorded on ${entry.date}.`),
    stage("entry", entry.isBalanced ? "completed" : "blocked", entry.isBalanced ? `تم إنشاء القيد ${entry.entryNumber} متوازنًا بإجمالي ${entry.totalDebit.toLocaleString()} ${entry.currency}.` : "القيد غير متوازن ولا يمكن استكمال الدورة.", entry.isBalanced ? `Balanced entry ${entry.entryNumber} created for ${entry.totalDebit.toLocaleString()} ${entry.currency}.` : "Entry is unbalanced and cannot continue."),
    stage("review", reviewed ? "completed" : status === "draft" ? "current" : "pending", reviewed ? "تمت إحالة القيد للمراجعة." : "القيد مسودة وينتظر الإرسال للمراجعة.", reviewed ? "Entry passed into review." : "Draft entry awaits review submission."),
    stage("approval", approved ? "completed" : status === "review" ? "current" : "pending", approved ? "تم اعتماد القيد محاسبيًا." : "لم يتم اعتماد القيد بعد.", approved ? "Entry was approved." : "Entry has not been approved yet."),
    stage("journal", downstreamState, posted ? "تم ترحيل القيد إلى دفتر اليومية العام." : status === "reversed" ? "تم عكس القيد وإيقاف أثره من القيود المرحلة." : "لم يُرحّل إلى اليومية بعد؛ لا يوجد أثر مالي رسمي.", posted ? "Posted to the general journal." : status === "reversed" ? "Entry was reversed and its posted effect stopped." : "Not posted to the journal; no official financial effect yet."),
    stage("ledger", downstreamState, posted ? `تم تحديث أرصدة ${accountCount} حساب في دفتر الأستاذ تلقائيًا.` : "دفتر الأستاذ لن يتغير قبل الترحيل.", posted ? `${accountCount} general-ledger account balances updated automatically.` : "The general ledger will not change until posting."),
    stage("trial-balance", downstreamState, posted ? "ظهر القيد تلقائيًا في ميزان المراجعة ضمن أرصدة حساباته." : "ميزان المراجعة لم يتأثر بعد.", posted ? "Entry is included automatically in the trial balance." : "The trial balance is not affected yet."),
    stage("statements", downstreamState, posted ? "انعكس القيد تلقائيًا على قائمة الدخل أو الميزانية حسب الحسابات المستخدمة." : "القوائم المالية لم تتأثر؛ ستتحدث بعد الترحيل.", posted ? "Financial statements updated automatically according to the accounts used." : "Financial statements are unchanged and will update after posting."),
  ];
  const summaryAr = posted ? `اكتملت الدورة: القيد ${entry.entryNumber} وصل من العملية إلى اليومية والأستاذ وميزان المراجعة والقوائم المالية.` : status === "draft" ? `تم إنشاء مسودة ${entry.entryNumber} فقط؛ لن تظهر في اليومية أو التقارير قبل المراجعة والاعتماد والترحيل.` : `القيد ${entry.entryNumber} في مرحلة ${status}، والمراحل التالية ما زالت منتظرة.`;
  const summaryEn = posted ? `Cycle complete: ${entry.entryNumber} reached the journal, ledger, trial balance, and financial statements.` : status === "draft" ? `Only draft ${entry.entryNumber} was created; it will not affect reports until reviewed, approved, and posted.` : `${entry.entryNumber} is at ${status}; downstream stages are pending.`;
  return { workflowStatus: status, stages, posted, summaryAr, summaryEn };
}
