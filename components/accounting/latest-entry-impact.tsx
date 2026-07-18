"use client";
import { useEffect, useState } from "react";
import { EntryImpact } from "./entry-impact";
import { AccountingCycleTrace } from "./accounting-cycle-trace";
import type { GeneratedJournalEntry, Locale } from "@/types";

export function LatestEntryImpact({ locale }: { locale: Locale }) {
  const [entry, setEntry] = useState<GeneratedJournalEntry>(), [suppressed, setSuppressed] = useState(false);
  useEffect(() => { const handler = (event: Event) => setEntry((event as CustomEvent<GeneratedJournalEntry>).detail); window.addEventListener("accounting-entry-saved", handler); return () => window.removeEventListener("accounting-entry-saved", handler); }, []);
  useEffect(() => { setSuppressed(Boolean(entry && document.querySelector(`[data-entry-impact-id="${entry.id}"]`))); }, [entry]);
  if (!entry || suppressed) return null;
  return <div className="container section grid"><AccountingCycleTrace entry={entry} locale={locale} title={locale === "ar" ? "رسالة الدورة المحاسبية للعملية التي تمت" : "Accounting cycle status for the completed operation"} /><EntryImpact entry={entry} locale={locale} title={locale === "ar" ? "تأثير العملية التي تمت الآن" : "Impact of the completed operation"} /></div>;
}
