export type PosProviderId = "fawry" | "vodafone-cash" | "orange-cash" | "etisalat-cash" | "aman" | "masary" | "instapay";
export type PosOperationType = "send-transfer" | "cash-withdrawal" | "bill-payment" | "recharge" | "provider-topup" | "internal-provider-transfer" | "store-expense";
export type PosOperationStatus = "successful" | "pending" | "failed" | "reversed";

export interface PosStore {
  id: string;
  name: string;
  createdAt: string;
  active: boolean;
  logoDataUrl?: string;
}

export interface PosProviderBalance {
  providerId: PosProviderId;
  openingBalance: number;
  actualClosingBalance?: number;
}

export interface PosShift {
  id: string;
  storeName: string;
  cashierName: string;
  businessDate: string;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed";
  openingCash: number;
  actualClosingCash?: number;
  providers: PosProviderBalance[];
  notes?: string;
}

export interface PosOperation {
  id: string;
  shiftId: string;
  at: string;
  businessDate: string;
  providerId?: PosProviderId;
  destinationProviderId?: PosProviderId;
  type: PosOperationType;
  amount: number;
  customerFee: number;
  providerCost: number;
  cashChange: number;
  providerBalanceChange: number;
  revenue: number;
  expense: number;
  profit: number;
  reference?: string;
  notes?: string;
  entryId?: string;
  status?: PosOperationStatus;
  reversalOfOperationId?: string;
  reversedByOperationId?: string;
}

export interface PosShiftSnapshot {
  expectedCash: number;
  expectedProviders: Record<PosProviderId, number>;
  revenue: number;
  expenses: number;
  profit: number;
  operationCount: number;
  cashVariance?: number;
  providerVariances?: Partial<Record<PosProviderId, number>>;
  totalVariance?: number;
}
