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
  nonDeductibleInputVat: number;
  adjustments: number;
}

export interface VatConfiguration { inputAccountCodes: string[]; outputAccountCodes: string[]; nonDeductibleAccountCodes: string[]; adjustmentAccountCodes: string[]; defaultRate: number }

export interface VatAnalysis {
  year: number;
  frequency: VatPeriodFrequency;
  inputVat: number;
  outputVat: number;
  netVat: number;
  pendingInputVat: number;
  pendingOutputVat: number;
  nonDeductibleInputVat: number;
  adjustments: number;
  configuration: VatConfiguration;
  periods: VatPeriodSummary[];
}
