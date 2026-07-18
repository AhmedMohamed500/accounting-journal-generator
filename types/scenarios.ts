import type { FinancialStatementImpact, TransactionInput } from "./accounting";

export type DecisionType = "sale" | "purchase" | "expense" | "fixed-asset";
export type ScenarioRisk = "low" | "medium" | "high";

export interface ScenarioHorizons {
  now: number;
  day7: number;
  day30: number;
  day90: number;
}

export interface DecisionSimulationInput {
  decisionType: DecisionType;
  amount: number;
  vatRate: number;
  cashDiscountRate: number;
  creditDays: 30 | 60 | 90;
  minimumReserve: number;
  currency: string;
  baselineCash: ScenarioHorizons;
  paymentAccountCode?: string;
  paymentAccountNameAr?: string;
  paymentAccountNameEn?: string;
}

export interface DecisionAlternative {
  id: "cash" | "credit" | "split";
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  entries: TransactionInput[];
  cashEffect: ScenarioHorizons;
  projectedCash: ScenarioHorizons;
  financialImpact: FinancialStatementImpact;
  vatEffect: number;
  commercialSaving: number;
  collectionExposure: number;
  obligationExposure: number;
  minimumProjectedCash: number;
  reserveGap: number;
  risk: ScenarioRisk;
  score: number;
  reasonsAr: string[];
  reasonsEn: string[];
  recommended: boolean;
}

export interface DecisionSimulation {
  alternatives: DecisionAlternative[];
  recommendedId: DecisionAlternative["id"];
}
