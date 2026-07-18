import type { CloseChecklistItem } from "@/types";
export const defaultCloseChecklist: CloseChecklistItem[] = [
 {id:"bank-reconciliation",titleAr:"مطابقة جميع حسابات البنوك",titleEn:"Reconcile all bank accounts",category:"bank",estimatedMinutes:45,completed:false},
 {id:"cash-count",titleAr:"مراجعة أرصدة الصندوق والعهد",titleEn:"Verify cash and petty cash",category:"bank",estimatedMinutes:25,completed:false},
 {id:"receivables-aging",titleAr:"مراجعة أعمار ديون العملاء والتحصيلات",titleEn:"Review receivables aging and collections",category:"receivables",estimatedMinutes:40,completed:false},
 {id:"payables-reconcile",titleAr:"مطابقة الموردين والفواتير غير المسجلة",titleEn:"Reconcile suppliers and missing invoices",category:"payables",estimatedMinutes:40,completed:false},
 {id:"vat-review",titleAr:"مطابقة ضريبة المدخلات والمخرجات",titleEn:"Reconcile input and output VAT",category:"tax",estimatedMinutes:35,completed:false},
 {id:"payroll-accrual",titleAr:"مراجعة الرواتب والاستقطاعات والمستحقات",titleEn:"Review payroll, deductions, and accruals",category:"payroll",estimatedMinutes:35,completed:false},
 {id:"depreciation",titleAr:"إثبات ومراجعة إهلاك الأصول",titleEn:"Post and review asset depreciation",category:"assets",estimatedMinutes:30,completed:false},
 {id:"inventory-count",titleAr:"مطابقة الجرد وتسويات المخزون",titleEn:"Reconcile stock count and adjustments",category:"inventory",estimatedMinutes:50,completed:false},
 {id:"accruals-prepayments",titleAr:"مراجعة المصروفات المستحقة والمقدمة",titleEn:"Review accruals and prepayments",category:"review",estimatedMinutes:40,completed:false},
 {id:"trial-balance",titleAr:"مراجعة ميزان المراجعة والحسابات الشاذة",titleEn:"Review trial balance and unusual accounts",category:"review",estimatedMinutes:45,completed:false},
 {id:"management-review",titleAr:"اعتماد المدير وإقفال الفترة",titleEn:"Management approval and period lock",category:"review",estimatedMinutes:20,completed:false}
];
