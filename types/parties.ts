export type PartyType = "customer" | "supplier";

export interface Party {
  id: string;
  type: PartyType;
  code: string;
  nameAr: string;
  nameEn: string;
  taxNumber?: string;
  commercialRegistration?: string;
  contactPerson?: string;
  address?: string;
  email?: string;
  phone?: string;
  creditDays: number;
  creditLimit?: number;
  accountCode: string;
  active: boolean;
  createdAt: string;
}

export interface OpenItemAllocation {
  id: string;
  date: string;
  amount: number;
  paymentAccountCode: string;
  reference?: string;
  linkedEntryId: string;
  createdAt: string;
}

export interface OpenItem {
  id: string;
  partyId: string;
  kind: "receivable" | "payable";
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  description?: string;
  currency: string;
  netAmount?: number;
  vatAmount?: number;
  amount: number;
  paid: number;
  status: "open" | "partial" | "paid" | "overdue";
  linkedEntryId?: string;
  invoiceEntryId?: string;
  collectionEntryIds?: string[];
  allocations?: OpenItemAllocation[];
  createdAt: string;
}

export interface AgingBucket { current: number; days30: number; days60: number; days90: number; over90: number; total: number }
export interface PartyBalance { party: Party; aging: AgingBucket; openItems: number }
