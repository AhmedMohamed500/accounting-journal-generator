export type DocumentKind = "supplier-invoice"|"customer-invoice"|"receipt"|"bank-statement"|"contract"|"tax"|"payroll"|"other";
export type DocumentStatus = "new"|"missing-data"|"reviewed"|"recorded"|"rejected";
export interface AccountingDocument {id:string;name:string;size:number;mimeType:string;fingerprint:string;kind:DocumentKind;status:DocumentStatus;documentDate:string;amount?:number;currency:string;party?:string;reference?:string;notes?:string;linkedEntryId?:string;linkedTaskId?:string;createdAt:string}
