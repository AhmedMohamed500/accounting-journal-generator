export type VatPeriodFrequency = "monthly" | "quarterly";

export interface VatPeriodSummary {
  id: string;
  labelAr: string;
  labelEn: string;
  startDate: string;
  endDate: string;
  inputVat: number;
  outputVat: number;
  netVat: number;
  transactionCount: number;
  pendingInputVat: number;
  pendingOutputVat: number;
}

export interface VatAnalysis {
  year: number;
  frequency: VatPeriodFrequency;
  inputVat: number;
  outputVat: number;
  netVat: number;
  pendingInputVat: number;
  pendingOutputVat: number;
  periods: VatPeriodSummary[];
}
