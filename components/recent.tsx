"use client";
import { useEffect, useState } from "react";
import { loadEntries, saveEntries } from "@/lib/storage/accounting";
import type { GeneratedJournalEntry, Locale } from "@/types";
import { JournalResult } from "./journal/result";
export function Recent({ locale }: { locale: Locale }) { const [items, setItems] = useState<GeneratedJournalEntry[]>([]); useEffect(() => { setItems(loadEntries()); }, []); const commit = (next: GeneratedJournalEntry[]) => { setItems(next); saveEntries(next); }; return <><button className="btn btn-danger no-print" onClick={() => commit([])}>{locale === "ar" ? "مسح الكل" : "Clear all"}</button><div className="grid section">{items.map((entry) => <div key={entry.id}><p className="badge">{entry.workflowStatus || "posted"}</p><button className="btn btn-danger no-print" onClick={() => commit(items.filter((item) => item.id !== entry.id))}>{locale === "ar" ? "حذف" : "Delete"}</button><JournalResult entry={entry} locale={locale} /></div>)}{!items.length && <div className="card">{locale === "ar" ? "لا توجد قيود محفوظة بعد." : "No saved entries yet."}</div>}</div></>; }
