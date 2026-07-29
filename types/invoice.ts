export interface ExtractedInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  net: number;
  vat: number;
  total: number;
}

export interface ExtractedInvoice {
  supplier: string;
  invoiceNumber: string;
  taxNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  lines: ExtractedInvoiceLine[];
  subtotal: number;
  discount: number;
  withholdingTax: number;
  withholdingRate: number;
  net: number;
  vatRate: number;
  vat: number;
  total: number;
  confidence: number;
  rawText: string;
  warnings: string[];
}
