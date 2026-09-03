export type SalesDemoStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface SalesDemoProgress {
  version: 1;
  status: "active" | "completed";
  locale: "ar" | "en";
  storeId: string;
  demoStartedAt: string;
  demoCompletedAt?: string;
  demoStep: SalesDemoStep;
}
