import { roundCurrency } from "@/lib/accounting/calculations";
import type { GeneratedJournalEntry, VatAnalysis, VatPeriodFrequency, VatPeriodSummary } from "@/types";

const INPUT_VAT_CODE = "1151";
const OUTPUT_VAT_CODE = "2201";
const posted = (entry: GeneratedJournalEntry) => ["approved", "posted"].includes(entry.workflowStatus || "");
const valid = (entry: GeneratedJournalEntry) => !["rejected", "reversed"].includes(entry.workflowStatus || "");
const monthEnd = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

function vatMovement(entry: GeneratedJournalEntry) {
  let inputVat = 0, outputVat = 0;
  for (const line of entry.lines) {
    if (line.accountCode === INPUT_VAT_CODE) inputVat += line.debit - line.credit;
    if (line.accountCode === OUTPUT_VAT_CODE) outputVat += line.credit - line.debit;
  }
  return { inputVat: roundCurrency(inputVat), outputVat: roundCurrency(outputVat) };
}

function periodDefinition(year: number, frequency: VatPeriodFrequency, index: number) {
  const months = frequency === "monthly" ? 1 : 3;
  const startMonth = index * months + 1;
  const endMonth = startMonth + months - 1;
  const startDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endDate = monthEnd(year, endMonth);
  const arMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return {
    id: `${year}-${String(startMonth).padStart(2, "0")}`,
    startDate,
    endDate,
    labelAr: frequency === "monthly" ? `${arMonths[startMonth - 1]} ${year}` : `الربع ${index + 1} — ${year}`,
    labelEn: frequency === "monthly" ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${startDate}T00:00:00Z`)) : `Q${index + 1} ${year}`,
  };
}

export function analyzeVat(entries: GeneratedJournalEntry[], year: number, frequency: VatPeriodFrequency): VatAnalysis {
  const periodCount = frequency === "monthly" ? 12 : 4;
  const periods: VatPeriodSummary[] = Array.from({ length: periodCount }, (_, index) => ({
    ...periodDefinition(year, frequency, index),
    inputVat: 0,
    outputVat: 0,
    netVat: 0,
    transactionCount: 0,
    pendingInputVat: 0,
    pendingOutputVat: 0,
  }));
  for (const entry of entries.filter(valid)) {
    if (!entry.date.startsWith(`${year}-`)) continue;
    const month = Number(entry.date.slice(5, 7));
    if (!month || month > 12) continue;
    const index = frequency === "monthly" ? month - 1 : Math.floor((month - 1) / 3);
    const movement = vatMovement(entry);
    if (!movement.inputVat && !movement.outputVat) continue;
    const period = periods[index];
    if (posted(entry)) {
      period.inputVat = roundCurrency(period.inputVat + movement.inputVat);
      period.outputVat = roundCurrency(period.outputVat + movement.outputVat);
      period.transactionCount++;
    } else {
      period.pendingInputVat = roundCurrency(period.pendingInputVat + movement.inputVat);
      period.pendingOutputVat = roundCurrency(period.pendingOutputVat + movement.outputVat);
    }
  }
  for (const period of periods) period.netVat = roundCurrency(period.outputVat - period.inputVat);
  const sum = (key: keyof Pick<VatPeriodSummary, "inputVat" | "outputVat" | "pendingInputVat" | "pendingOutputVat">) => roundCurrency(periods.reduce((total, period) => total + period[key], 0));
  const inputVat = sum("inputVat"), outputVat = sum("outputVat");
  return { year, frequency, inputVat, outputVat, netVat: roundCurrency(outputVat - inputVat), pendingInputVat: sum("pendingInputVat"), pendingOutputVat: sum("pendingOutputVat"), periods };
}

export function entriesForVatPeriod(entries: GeneratedJournalEntry[], period: VatPeriodSummary) {
  return entries.filter((entry) => valid(entry) && entry.date >= period.startDate && entry.date <= period.endDate && Object.values(vatMovement(entry)).some((value) => value !== 0));
}
