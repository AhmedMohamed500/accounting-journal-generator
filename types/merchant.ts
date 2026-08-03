export type MerchantStatus = "active" | "paused" | "archived";
export type MerchantSubscriptionStatus = "local-demo" | "active" | "due" | "partial" | "overdue" | "paused" | "cancelled";
export type MerchantTransactionStatus = "posted" | "reversed" | "cancelled";
export type MerchantTransactionType =
  | "cash-sale" | "credit-sale" | "cash-purchase" | "credit-purchase"
  | "expense" | "customer-collection" | "supplier-payment" | "capital"
  | "drawings" | "other-income" | "other-expense" | "cash-to-bank"
  | "bank-to-cash" | "cash-to-wallet" | "wallet-to-cash" | "opening-balance"
  | "manual-adjustment" | "sales-return" | "purchase-return";
export type MerchantPaymentMethod = "cash" | "bank" | "wallet" | "credit";

export interface SmallMerchant {
  id: string; code: string; name: string; businessName: string; activityType: string;
  phone: string; address?: string; branchCount: number; startDate: string;
  status: MerchantStatus; packageId?: string; subscriptionAmount: number;
  subscriptionFrequency: "monthly" | "quarterly" | "annual"; nextDueDate?: string;
  collectedAmount: number; assignedCashier?: string; notes?: string;
  inventoryEnabled: boolean; employeesEnabled: boolean; creditSalesEnabled: boolean;
  customersEnabled: boolean; suppliersEnabled: boolean;
  dailyReport: boolean; weeklyReport: boolean; monthlyReport: boolean;
  openingCash: number; openingBank: number; openingWallet: number;
  isDemo?: boolean; createdAt: string; updatedAt: string; archivedAt?: string;
}

export interface MerchantTransaction {
  id: string; merchantId: string; branchId?: string; date: string;
  transactionType: MerchantTransactionType; description: string; amount: number;
  costAmount?: number; paymentMethod: MerchantPaymentMethod; customerId?: string;
  supplierId?: string; categoryId?: string; reference?: string; notes?: string;
  createdBy: string; createdAt: string; updatedAt: string;
  status: MerchantTransactionStatus; originalTransactionId?: string; reversalReason?: string;
  inventoryItemId?: string; quantity?: number; isDemo?: boolean;
}

export interface MerchantCustomer { id:string; merchantId:string; name:string; phone?:string; address?:string; openingBalance:number; expectedCollectionDate?:string; notes?:string; active:boolean; isDemo?:boolean; createdAt:string; }
export interface MerchantSupplier { id:string; merchantId:string; name:string; phone?:string; address?:string; openingBalance:number; expectedPaymentDate?:string; notes?:string; active:boolean; isDemo?:boolean; createdAt:string; }
export interface MerchantInventoryItem { id:string; merchantId:string; code:string; name:string; category:string; unit:string; openingQuantity:number; unitCost:number; sellingPrice:number; reorderLevel:number; active:boolean; isDemo?:boolean; createdAt:string; }
export interface MerchantExpenseCategory { id:string; merchantId?:string; name:string; active:boolean; }
export interface MerchantPackage { id:string; name:string; description:string; price:number; active:boolean; reportsPerMonth?:number; branches?:number; localUsers?:number; features:string[]; isDemo?:boolean; createdAt:string; }
export interface MerchantSubscriptionCollection { id:string; merchantId:string; subscriptionId:string; date:string; amount:number; method:"cash"|"bank"|"wallet"; reference?:string; receiptNumber:string; collectedBy:string; notes?:string; isDemo?:boolean; }
export interface MerchantLocalSubscription { id:string; merchantId:string; packageId:string; startDate:string; endDate?:string; frequency:"monthly"|"quarterly"|"annual"; amount:number; due:number; collected:number; nextDueDate:string; status:MerchantSubscriptionStatus; assignedEmployee?:string; notes?:string; isDemo?:boolean; collections:MerchantSubscriptionCollection[]; }
export interface MerchantAlert { id:string; merchantId?:string; type:string; severity:"low"|"medium"|"high"|"critical"; description:string; reason:string; detectedAt:string; status:"new"|"reviewing"|"confirmed-error"|"corrected"|"safe"|"deferred"; reviewedBy?:string; reviewedAt?:string; reviewResult?:string; notes?:string; isDemo?:boolean; }
export interface MerchantTask { id:string; merchantId:string; title:string; dueDate:string; assignedTo?:string; status:"open"|"deferred"|"completed"; notes?:string; isDemo?:boolean; }

export interface MerchantAccountingData {
  schemaVersion: 1; storeId: string; merchants: SmallMerchant[]; transactions: MerchantTransaction[];
  customers: MerchantCustomer[]; suppliers: MerchantSupplier[]; inventory: MerchantInventoryItem[];
  categories: MerchantExpenseCategory[]; packages: MerchantPackage[];
  subscriptions: MerchantLocalSubscription[]; alerts: MerchantAlert[]; tasks: MerchantTask[];
  updatedAt: string;
}

export interface MerchantSummary {
  cash:number; bank:number; wallet:number; sales:number; purchases:number; expenses:number;
  collections:number; supplierPayments:number; receivables:number; payables:number;
  revenue:number; costOfGoods:number; estimatedProfit:number; margin:number;
  transactionCount:number; missingCostData:boolean;
}
