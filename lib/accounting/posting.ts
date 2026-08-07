import type { ChartAccount, EntryWorkflowStatus, GeneratedJournalEntry } from "@/types";
import { assertValidJournalEntry } from "./validation";

const allowed: Record<EntryWorkflowStatus, EntryWorkflowStatus[]> = { draft: ["review"], review: ["approved", "rejected"], approved: ["posted", "rejected"], posted: [], rejected: ["draft"], reversed: [] };
export interface JournalTransitionOptions { actor?: string; note?: string; accounts?: ChartAccount[]; assertPeriodOpen?: (date: string) => void; now?: string }
export function transitionJournalEntry(entry: GeneratedJournalEntry, next: EntryWorkflowStatus, options: JournalTransitionOptions = {}): GeneratedJournalEntry {
  const current = entry.workflowStatus || "draft";
  if (!allowed[current].includes(next)) throw new Error(`لا يمكن نقل القيد من ${current} إلى ${next}.`);
  if (next === "review" || next === "approved" || next === "posted") assertValidJournalEntry(entry, options.accounts);
  if (next === "posted") options.assertPeriodOpen?.(entry.date);
  if (next === "rejected" && !options.note?.trim()) throw new Error("اكتب سبب رفض القيد.");
  const at = options.now || new Date().toISOString(), actor = options.actor || "Local user";
  return { ...entry, workflowStatus: next, approvedAt: next === "approved" ? at : entry.approvedAt, postedAt: next === "posted" ? at : entry.postedAt,
    rejectedAt: next === "rejected" ? at : entry.rejectedAt, rejectionReason: next === "rejected" ? options.note : entry.rejectionReason,
    audit: [...(entry.audit || []), { id: crypto.randomUUID(), entryId: entry.id, action: next, at, actor, note: options.note }] };
}
export function editDraftEntry(entry: GeneratedJournalEntry, changes: Partial<GeneratedJournalEntry>, actor = "Local user") {
  if ((entry.workflowStatus || "draft") !== "draft") throw new Error("لا يمكن تعديل القيد إلا وهو مسودة.");
  const at = new Date().toISOString(); return { ...entry, ...changes, id: entry.id, workflowStatus: "draft" as const, audit: [...(entry.audit || []), { id: crypto.randomUUID(), entryId: entry.id, action: "edited" as const, at, actor }] };
}
