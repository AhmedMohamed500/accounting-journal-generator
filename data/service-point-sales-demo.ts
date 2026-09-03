import type { PosProviderId } from "@/types";

export const servicePointSalesDemoConfig = {
  businessNameAr: "النور لخدمات الدفع",
  businessNameEn: "Al Noor Payment Services",
  cashierNameAr: "أحمد",
  cashierNameEn: "Ahmed",
  openingCash: 20_000,
  providerBalances: { fawry: 1_300, "vodafone-cash": 10_000, "orange-cash": 8_000, "etisalat-cash": 0, aman: 0, masary: 0, instapay: 12_000 } satisfies Record<PosProviderId, number>,
  fawry: { amount: 1_000, customerFee: 10, providerCost: 2, reference: "DEMO-FWR-1000" },
  vodafone: { amount: 700, customerFee: 12, providerCost: 3, reference: "DEMO-VFC-700" },
  pending: { amount: 500, customerFee: 7, providerCost: 2, reference: "DEMO-PENDING-500" },
  closingDifference: -100,
} as const;
