export const servicePointOwnerConfig = {
  lowBalanceAbsolute: 500,
  lowBalanceCoverageRatio: 0.35,
  idleBalanceAbsolute: 5_000,
  idleTurnoverRatio: 0.2,
  highCashAbsolute: 15_000,
  highCashShare: 0.65,
  differenceWarning: 25,
  differenceCritical: 150,
  pendingHours: 1,
  failedSpikeCount: 3,
  lowMarginPercent: 35,
  highMarginPercent: 70,
  profitChangePercent: 15,
  trialEndingDays: 3,
  decisionCardLimit: 5,
} as const;

