import type { JournalEntryLine } from "@/types";
import { roundCurrency } from "./calculations";
export const journalTotals = (lines: JournalEntryLine[]) => ({ debit: roundCurrency(lines.reduce((s,l)=>s+l.debit,0)), credit: roundCurrency(lines.reduce((s,l)=>s+l.credit,0)) });
export const isBalanced = (lines: JournalEntryLine[]) => { const t=journalTotals(lines); return t.debit > 0 && Math.abs(t.debit-t.credit)<0.005 };
