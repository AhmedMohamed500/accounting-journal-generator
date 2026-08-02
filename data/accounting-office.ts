import type { AccountingOfficeData, OfficeSettings, WorkflowTemplate } from "@/types";

const at = "2026-08-01T09:00:00.000Z";
const checklist = (items: string[]) => items.map((title, index) => ({ id: `check-${index + 1}`, title, completed: false }));

export const defaultOfficeSettings: OfficeSettings = {
  currency: "EGP", dailyHours: 8, workingDays: [0, 1, 2, 3, 4], alertDaysBefore: 5, clientPrefix: "CL", filePrefix: "MF",
  roleHourlyCosts: { owner: 320, manager: 250, accountant: 150, reviewer: 220, assistant: 90 },
  profitabilityThresholds: { veryProfitable: 45, profitable: 25, review: 10, low: 0 },
  workloadThresholds: { balanced: 70, high: 90, critical: 110 },
  reminderTemplate: "أستاذ/ة [الاسم]، نرجو إرسال مستندات شهر [الشهر] لاستكمال الأعمال المحاسبية قبل [التاريخ]. المستندات المتبقية: [القائمة].",
  healthWeights: { documents: 18, collections: 16, delays: 14, profitability: 16, rework: 10, completeness: 8, deadlines: 10, response: 8 },
};

export const officeWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: "tpl-trading", nameAr: "شركة تجارية شهرية", nameEn: "Monthly trading company", serviceId: "svc-bookkeeping", clientActivity: "تجارة", expectedHours: 22, suggestedPrice: 8500, active: true,
    tasks: [
      { id: "tt-1", titleAr: "استلام وفحص مستندات الشهر", titleEn: "Receive and inspect documents", order: 1, relativeDueDay: 5, responsibleRole: "assistant", expectedHours: 2, reviewRequired: false, checklist: ["تأكيد عدد الملفات", "فحص وضوح المستندات"] },
      { id: "tt-2", titleAr: "تسجيل المبيعات والمشتريات", titleEn: "Record sales and purchases", order: 2, relativeDueDay: 12, responsibleRole: "accountant", expectedHours: 8, reviewRequired: true, checklist: ["مطابقة المجاميع", "فحص الضريبة"] },
      { id: "tt-3", titleAr: "التسوية البنكية والخزينة", titleEn: "Bank and cash reconciliation", order: 3, relativeDueDay: 18, responsibleRole: "accountant", expectedHours: 5, reviewRequired: true, checklist: ["مطابقة كشف البنك", "جرد الخزينة"] },
      { id: "tt-4", titleAr: "المراجعة والإقفال الشهري", titleEn: "Review and monthly close", order: 4, relativeDueDay: 25, responsibleRole: "reviewer", expectedHours: 4, reviewRequired: true, checklist: ["ميزان المراجعة", "الحسابات المعلقة", "اعتماد الملف"] },
    ],
    documents: [
      { id: "td-1", nameAr: "فواتير المبيعات", nameEn: "Sales invoices", required: true }, { id: "td-2", nameAr: "فواتير المشتريات", nameEn: "Purchase invoices", required: true },
      { id: "td-3", nameAr: "كشف البنك", nameEn: "Bank statement", required: true }, { id: "td-4", nameAr: "المصروفات والعهد", nameEn: "Expenses and custody", required: true },
    ], reviewSteps: ["اكتمال المستندات", "توازن القيود", "مراجعة الضرائب", "مطابقة البنك والخزينة", "اعتماد الملف"],
  },
  {
    id: "tpl-services", nameAr: "شركة خدمات", nameEn: "Service company", serviceId: "svc-bookkeeping", clientActivity: "خدمات", expectedHours: 16, suggestedPrice: 6500, active: true,
    tasks: [
      { id: "ts-1", titleAr: "تجميع الإيرادات والمصروفات", titleEn: "Collect income and expenses", order: 1, relativeDueDay: 8, responsibleRole: "accountant", expectedHours: 5, reviewRequired: false, checklist: ["الإيرادات", "المصروفات"] },
      { id: "ts-2", titleAr: "مطابقة البنك والتحصيلات", titleEn: "Reconcile bank and collections", order: 2, relativeDueDay: 15, responsibleRole: "accountant", expectedHours: 4, reviewRequired: true, checklist: ["كشف البنك", "التحصيلات"] },
      { id: "ts-3", titleAr: "مراجعة الضرائب والإقفال", titleEn: "Tax review and close", order: 3, relativeDueDay: 24, responsibleRole: "reviewer", expectedHours: 3, reviewRequired: true, checklist: ["الضرائب", "الإقفال"] },
    ],
    documents: [{ id: "sd-1", nameAr: "فواتير الخدمات", nameEn: "Service invoices", required: true }, { id: "sd-2", nameAr: "كشف البنك", nameEn: "Bank statement", required: true }, { id: "sd-3", nameAr: "المصروفات", nameEn: "Expenses", required: true }],
    reviewSteps: ["اكتمال الإيرادات", "مطابقة التحصيلات", "مراجعة الضرائب", "اعتماد الملف"],
  },
  {
    id: "tpl-restaurant", nameAr: "مطعم أو كافيه", nameEn: "Restaurant or cafe", serviceId: "svc-bookkeeping", clientActivity: "مطاعم", expectedHours: 28, suggestedPrice: 10500, active: true,
    tasks: [
      { id: "tr-1", titleAr: "مطابقة نقاط البيع والتوصيل", titleEn: "Reconcile POS and delivery", order: 1, relativeDueDay: 7, responsibleRole: "accountant", expectedHours: 8, reviewRequired: true, checklist: ["نقاط البيع", "منصات التوصيل"] },
      { id: "tr-2", titleAr: "مراجعة المشتريات والهالك", titleEn: "Review purchases and waste", order: 2, relativeDueDay: 14, responsibleRole: "accountant", expectedHours: 7, reviewRequired: true, checklist: ["المشتريات", "الهالك"] },
      { id: "tr-3", titleAr: "تحليل التكلفة والإقفال", titleEn: "Cost analysis and close", order: 3, relativeDueDay: 24, responsibleRole: "reviewer", expectedHours: 5, reviewRequired: true, checklist: ["تكلفة الطعام", "هامش الربح"] },
    ],
    documents: [{ id: "rd-1", nameAr: "تقارير نقاط البيع", nameEn: "POS reports", required: true }, { id: "rd-2", nameAr: "فواتير الموردين", nameEn: "Supplier invoices", required: true }, { id: "rd-3", nameAr: "كشوف منصات التوصيل", nameEn: "Delivery statements", required: true }, { id: "rd-4", nameAr: "الرواتب", nameEn: "Payroll", required: true }],
    reviewSteps: ["مطابقة المبيعات", "مراجعة تكلفة المبيعات", "البنك والخزينة", "اعتماد الملف"],
  },
  {
    id: "tpl-medical", nameAr: "عيادة أو مركز طبي", nameEn: "Clinic or medical center", serviceId: "svc-bookkeeping", clientActivity: "طبي", expectedHours: 18, suggestedPrice: 7500, active: true,
    tasks: [{ id: "tm-1", titleAr: "تجميع إيرادات العيادة", titleEn: "Collect clinic revenue", order: 1, relativeDueDay: 8, responsibleRole: "accountant", expectedHours: 5, reviewRequired: false, checklist: ["نقدي", "تأمين"] }, { id: "tm-2", titleAr: "مراجعة المصروفات والرواتب", titleEn: "Review expenses and payroll", order: 2, relativeDueDay: 16, responsibleRole: "accountant", expectedHours: 6, reviewRequired: true, checklist: ["المصروفات", "الرواتب"] }, { id: "tm-3", titleAr: "الإقفال والمراجعة", titleEn: "Close and review", order: 3, relativeDueDay: 25, responsibleRole: "reviewer", expectedHours: 3, reviewRequired: true, checklist: ["التسويات", "الاعتماد"] }],
    documents: [{ id: "md-1", nameAr: "كشف الإيرادات", nameEn: "Revenue statement", required: true }, { id: "md-2", nameAr: "مطالبات التأمين", nameEn: "Insurance claims", required: true }, { id: "md-3", nameAr: "الرواتب والمصروفات", nameEn: "Payroll and expenses", required: true }], reviewSteps: ["الإيرادات", "المصروفات", "الضرائب", "اعتماد الملف"],
  },
];

export function createOfficeSeed(companyId: string): AccountingOfficeData {
  const employees = [
    { id: "emp-1", name: "أحمد حسن", role: "manager" as const, phone: "01000000001", email: "ahmed@finora.demo", hourlyCost: 250, dailyCapacityHours: 8, active: true, createdAt: at },
    { id: "emp-2", name: "سارة محمود", role: "reviewer" as const, phone: "01000000002", email: "sara@finora.demo", hourlyCost: 220, dailyCapacityHours: 8, active: true, createdAt: at },
    { id: "emp-3", name: "محمد فوزي", role: "accountant" as const, phone: "01000000003", email: "mohamed@finora.demo", hourlyCost: 150, dailyCapacityHours: 8, active: true, createdAt: at },
    { id: "emp-4", name: "مريم علي", role: "assistant" as const, phone: "01000000004", email: "mariam@finora.demo", hourlyCost: 90, dailyCapacityHours: 7, active: true, createdAt: at },
  ];
  const services = [
    { id: "svc-bookkeeping", nameAr: "إمساك الدفاتر والإقفال", nameEn: "Bookkeeping and close", category: "accounting", defaultPrice: 7000, defaultHours: 18, active: true },
    { id: "svc-vat", nameAr: "القيمة المضافة والامتثال", nameEn: "VAT and compliance", category: "tax", defaultPrice: 3500, defaultHours: 7, active: true },
    { id: "svc-payroll", nameAr: "الرواتب والتأمينات", nameEn: "Payroll and insurance", category: "payroll", defaultPrice: 3000, defaultHours: 6, active: true },
    { id: "svc-bank", nameAr: "التسوية البنكية", nameEn: "Bank reconciliation", category: "banking", defaultPrice: 2500, defaultHours: 5, active: true },
    { id: "svc-management", nameAr: "تقارير الإدارة والتحليل", nameEn: "Management reporting", category: "advisory", defaultPrice: 5000, defaultHours: 8, active: true },
    { id: "svc-digitization", nameAr: "رقمنة وأرشفة المستندات", nameEn: "Document digitization", category: "documents", defaultPrice: 2200, defaultHours: 5, active: true },
  ];
  const packages = [
    { id: "pkg-basic", nameAr: "الباقة الأساسية", nameEn: "Essential", serviceIds: ["svc-bookkeeping"], monthlyFee: 6000, includedHours: 16, active: true },
    { id: "pkg-growth", nameAr: "باقة النمو", nameEn: "Growth", serviceIds: ["svc-bookkeeping", "svc-vat", "svc-bank"], monthlyFee: 10500, includedHours: 28, active: true },
    { id: "pkg-pro", nameAr: "الباقة المتكاملة", nameEn: "Professional", serviceIds: ["svc-bookkeeping", "svc-vat", "svc-bank", "svc-payroll", "svc-management"], monthlyFee: 17000, includedHours: 44, active: true },
  ];
  const clients = [
    { id: "client-1", code: "CL-101", tradeName: "شركة النيل للتوريدات", legalName: "شركة النيل للتوريدات والتجارة ش.م.م", activity: "تجارة وتوزيع", entityType: "شركة ذات مسؤولية محدودة", taxNumber: "123-456-789", registrationNumber: "45821", contactName: "كريم محمود", phone: "201001112233", email: "finance@nile.demo", address: "مدينة نصر، القاهرة", contractStart: "2025-01-01", status: "active" as const, accountantId: "emp-3", reviewerId: "emp-2", serviceFrequency: "monthly" as const, packageId: "pkg-growth", workflowTemplateId: "tpl-trading", feeAmount: 10500, feeDueDay: 10, expectedHours: 28, includedServiceIds: ["svc-bookkeeping", "svc-vat", "svc-bank"], excludedServiceIds: ["svc-payroll", "svc-management"], notes: "عميل منتظم", priority: "high" as const, risk: "low" as const, responseSpeed: 90, documentCommitment: 94, reworkRate: 5, extraMonthlyCosts: 350, branches: 2, employeeCount: 18, bankTransactionVolume: 420, frequentExcelAnalysis: true, createdAt: at },
    { id: "client-2", code: "CL-102", tradeName: "مركز الصفوة الطبي", legalName: "مركز الصفوة للخدمات الطبية", activity: "خدمات طبية", entityType: "منشأة فردية", taxNumber: "222-333-444", registrationNumber: "55102", contactName: "د. منى سمير", phone: "201002223344", email: "admin@safwa.demo", address: "المعادي، القاهرة", contractStart: "2025-06-01", status: "active" as const, accountantId: "emp-3", reviewerId: "emp-2", serviceFrequency: "monthly" as const, packageId: "pkg-basic", workflowTemplateId: "tpl-medical", feeAmount: 7500, feeDueDay: 5, expectedHours: 18, includedServiceIds: ["svc-bookkeeping"], excludedServiceIds: ["svc-payroll", "svc-vat"], notes: "تحتاج متابعة مطالبات التأمين", priority: "medium" as const, risk: "medium" as const, responseSpeed: 72, documentCommitment: 78, reworkRate: 12, extraMonthlyCosts: 200, branches: 1, employeeCount: 22, bankTransactionVolume: 170, createdAt: at },
    { id: "client-3", code: "CL-103", tradeName: "مصنع دلتا للبلاستيك", legalName: "دلتا للصناعات البلاستيكية ش.م.م", activity: "تصنيع", entityType: "شركة مساهمة", taxNumber: "345-678-901", registrationNumber: "11892", contactName: "محمود رفعت", phone: "201003334455", email: "accounts@delta.demo", address: "العاشر من رمضان", contractStart: "2024-09-01", status: "active" as const, accountantId: "emp-1", reviewerId: "emp-2", serviceFrequency: "monthly" as const, packageId: "pkg-pro", workflowTemplateId: "tpl-trading", feeAmount: 18000, feeDueDay: 12, expectedHours: 46, includedServiceIds: ["svc-bookkeeping", "svc-vat", "svc-bank", "svc-payroll", "svc-management"], excludedServiceIds: [], notes: "حجم معاملات مرتفع", priority: "critical" as const, risk: "medium" as const, responseSpeed: 82, documentCommitment: 88, reworkRate: 8, extraMonthlyCosts: 900, branches: 3, employeeCount: 95, bankTransactionVolume: 980, frequentExcelAnalysis: true, createdAt: at },
    { id: "client-4", code: "CL-104", tradeName: "مطاعم بيت المذاق", legalName: "بيت المذاق للأغذية", activity: "مطاعم وضيافة", entityType: "شركة تضامن", taxNumber: "456-789-012", registrationNumber: "80774", contactName: "حسام صبري", phone: "201004445566", email: "owner@bayt.demo", address: "الدقي، الجيزة", contractStart: "2026-01-01", status: "follow-up" as const, accountantId: "emp-4", reviewerId: "emp-1", serviceFrequency: "monthly" as const, packageId: "pkg-growth", workflowTemplateId: "tpl-restaurant", feeAmount: 9000, feeDueDay: 1, expectedHours: 28, includedServiceIds: ["svc-bookkeeping", "svc-vat"], excludedServiceIds: ["svc-bank", "svc-payroll"], notes: "المستندات تصل متأخرة", priority: "critical" as const, risk: "high" as const, responseSpeed: 42, documentCommitment: 40, reworkRate: 24, extraMonthlyCosts: 850, branches: 4, employeeCount: 48, bankTransactionVolume: 560, createdAt: at },
    { id: "client-5", code: "CL-105", tradeName: "رواد للمقاولات", legalName: "رواد للمقاولات العامة", activity: "مقاولات", entityType: "شركة ذات مسؤولية محدودة", taxNumber: "567-890-123", registrationNumber: "33661", contactName: "عمرو نبيل", phone: "201005556677", email: "office@rowad.demo", address: "التجمع الخامس، القاهرة", contractStart: "2025-03-01", status: "active" as const, accountantId: "emp-1", reviewerId: "emp-2", serviceFrequency: "monthly" as const, packageId: "pkg-growth", workflowTemplateId: "tpl-trading", feeAmount: 12000, feeDueDay: 15, expectedHours: 32, includedServiceIds: ["svc-bookkeeping", "svc-vat", "svc-bank"], excludedServiceIds: ["svc-management"], notes: "مستخلصات متعددة", priority: "high" as const, risk: "high" as const, responseSpeed: 68, documentCommitment: 70, reworkRate: 15, extraMonthlyCosts: 700, branches: 2, employeeCount: 35, bankTransactionVolume: 330, createdAt: at },
    { id: "client-6", code: "CL-106", tradeName: "حلول تك الرقمية", legalName: "حلول تك للبرمجيات", activity: "خدمات وبرمجيات", entityType: "شركة شخص واحد", taxNumber: "678-901-234", registrationNumber: "92017", contactName: "ياسمين عادل", phone: "201006667788", email: "finance@tech.demo", address: "الشيخ زايد، الجيزة", contractStart: "2026-02-01", status: "active" as const, accountantId: "emp-3", reviewerId: "emp-2", serviceFrequency: "monthly" as const, packageId: "pkg-basic", workflowTemplateId: "tpl-services", feeAmount: 6500, feeDueDay: 8, expectedHours: 16, includedServiceIds: ["svc-bookkeeping"], excludedServiceIds: ["svc-vat", "svc-payroll", "svc-management"], notes: "نمو سريع", priority: "medium" as const, risk: "low" as const, responseSpeed: 96, documentCommitment: 92, reworkRate: 4, extraMonthlyCosts: 100, branches: 1, employeeCount: 14, bankTransactionVolume: 240, frequentExcelAnalysis: true, createdAt: at },
  ];
  const monthlyFiles = clients.map((client, index) => ({ id: `file-${index + 1}`, clientId: client.id, period: "2026-08", templateId: client.workflowTemplateId, accountantId: client.accountantId, reviewerId: client.reviewerId, startedAt: index === 3 ? undefined : "2026-08-01", dueDate: `2026-08-${[25, 24, 27, 18, 26, 23][index]}`, status: (["recording", "waiting-documents", "ready-review", "overdue", "adjusting", "reviewed"] as const)[index], expectedDocuments: [4, 3, 4, 4, 4, 3][index], receivedDocuments: [4, 2, 4, 1, 3, 3][index], notes: index === 3 ? "العميل لم يرسل كشف نقاط البيع" : "", createdAt: at, carriedTaskIds: [] }));
  const tasks = [
    { id: "task-1", title: "مراجعة إقرار القيمة المضافة", clientId: "client-1", monthlyFileId: "file-1", serviceId: "svc-vat", assigneeId: "emp-2", reviewerId: "emp-1", priority: "critical" as const, status: "ready-review" as const, startDate: "2026-08-01", dueDate: "2026-08-05", expectedHours: 4, actualHours: 3.5, hourlyCost: 220, dependencyIds: [], checklist: checklist(["مراجعة المدخلات", "مراجعة المخرجات"]), recurring: true, recurrenceRule: "monthly", createdAt: at },
    { id: "task-2", title: "مطابقة كشف بنك CIB", clientId: "client-3", monthlyFileId: "file-3", serviceId: "svc-bank", assigneeId: "emp-3", reviewerId: "emp-2", priority: "high" as const, status: "in-progress" as const, startDate: "2026-08-01", dueDate: "2026-08-09", expectedHours: 7, actualHours: 5.25, hourlyCost: 150, dependencyIds: [], checklist: checklist(["استيراد الكشف", "مراجعة غير المطابق"]), recurring: true, recurrenceRule: "monthly", createdAt: at },
    { id: "task-3", title: "استكمال تقارير نقاط البيع", clientId: "client-4", monthlyFileId: "file-4", serviceId: "svc-bookkeeping", assigneeId: "emp-4", reviewerId: "emp-1", priority: "critical" as const, status: "waiting-client" as const, startDate: "2026-07-28", dueDate: "2026-08-01", expectedHours: 6, actualHours: 2, hourlyCost: 90, dependencyIds: [], checklist: checklist(["فوري", "منصات التوصيل"]), recurring: true, recurrenceRule: "monthly", createdAt: at },
    { id: "task-4", title: "إقفال رواتب يوليو", clientId: "client-2", monthlyFileId: "file-2", serviceId: "svc-payroll", assigneeId: "emp-3", reviewerId: "emp-2", priority: "medium" as const, status: "in-progress" as const, startDate: "2026-08-01", dueDate: "2026-08-12", expectedHours: 5, actualHours: 2.5, hourlyCost: 150, dependencyIds: [], checklist: checklist(["الحضور", "الاستقطاعات"]), recurring: true, recurrenceRule: "monthly", createdAt: at },
    { id: "task-5", title: "تجهيز ميزان المراجعة", clientId: "client-5", monthlyFileId: "file-5", serviceId: "svc-bookkeeping", assigneeId: "emp-1", reviewerId: "emp-2", priority: "high" as const, status: "new" as const, startDate: "2026-08-02", dueDate: "2026-08-14", expectedHours: 8, actualHours: 0, hourlyCost: 250, dependencyIds: [], checklist: checklist(["الأستاذ", "الحسابات المعلقة"]), recurring: true, recurrenceRule: "monthly", createdAt: at },
    { id: "task-6", title: "إعداد تقرير الإدارة الشهري", clientId: "client-3", monthlyFileId: "file-3", serviceId: "svc-management", assigneeId: "emp-1", reviewerId: "emp-2", priority: "high" as const, status: "completed" as const, startDate: "2026-07-28", dueDate: "2026-08-02", expectedHours: 6, actualHours: 6.5, hourlyCost: 250, dependencyIds: [], checklist: [{ ...checklist(["قائمة الدخل"])[0], completed: true }], recurring: true, recurrenceRule: "monthly", createdAt: at, completedAt: "2026-08-02" },
    { id: "task-7", title: "تحليل المصروفات غير المعتادة", clientId: "client-6", monthlyFileId: "file-6", serviceId: "svc-management", assigneeId: "emp-3", reviewerId: "emp-2", priority: "medium" as const, status: "ready-review" as const, startDate: "2026-08-01", dueDate: "2026-08-08", expectedHours: 3, actualHours: 3, hourlyCost: 150, dependencyIds: [], checklist: checklist(["التصنيف", "المقارنة"]), recurring: false, createdAt: at },
  ];
  const requiredDocuments = monthlyFiles.flatMap((file) => {
    const template = officeWorkflowTemplates.find((item) => item.id === file.templateId) || officeWorkflowTemplates[0];
    return template.documents.map((document, index) => ({ id: `${file.id}-doc-${index + 1}`, clientId: file.clientId, monthlyFileId: file.id, type: document.nameAr, period: file.period, status: index < file.receivedDocuments ? "received" as const : file.clientId === "client-4" ? "overdue" as const : "requested" as const, requestedAt: "2026-08-01", receivedAt: index < file.receivedDocuments ? "2026-08-02" : undefined, followUpEmployeeId: file.accountantId, reminderCount: index < file.receivedDocuments ? 0 : file.clientId === "client-4" ? 3 : 1, createdAt: at }));
  });
  const deadlines = [
    { id: "deadline-1", clientId: "client-1", type: "مراجعة ضريبة القيمة المضافة", period: "2026-07", dueDate: "2026-08-05", employeeId: "emp-2", reviewerId: "emp-1", status: "urgent" as const, taskId: "task-1", monthlyFileId: "file-1", createdAt: at },
    { id: "deadline-2", clientId: "client-4", type: "تسليم تقرير الشهر", period: "2026-07", dueDate: "2026-08-01", employeeId: "emp-4", reviewerId: "emp-1", status: "overdue" as const, taskId: "task-3", monthlyFileId: "file-4", createdAt: at },
    { id: "deadline-3", clientId: "client-3", type: "تقرير الإدارة", period: "2026-07", dueDate: "2026-08-10", employeeId: "emp-1", reviewerId: "emp-2", status: "near" as const, monthlyFileId: "file-3", createdAt: at },
  ];
  const reviews = [
    { id: "review-1", clientId: "client-1", monthlyFileId: "file-1", taskId: "task-1", type: "monthly-file" as const, status: "queued" as const, creatorId: "emp-3", reviewerId: "emp-2", createdAt: at, checklist: ["اكتمال المستندات", "توازن القيود", "مراجعة الضرائب", "مطابقة البنك والخزينة", "اعتماد الملف"].map((title, index) => ({ id: `review-1-${index}`, title, completed: index < 2 })) },
    { id: "review-2", clientId: "client-6", monthlyFileId: "file-6", taskId: "task-7", type: "monthly-file" as const, status: "in-review" as const, creatorId: "emp-3", reviewerId: "emp-2", createdAt: at, checklist: ["اكتمال المستندات", "مراجعة المصروفات", "اعتماد الملف"].map((title, index) => ({ id: `review-2-${index}`, title, completed: index === 0 })) },
  ];
  const timeEntries = [
    { id: "time-1", clientId: "client-1", monthlyFileId: "file-1", taskId: "task-1", employeeId: "emp-2", startedAt: "2026-08-01T09:00:00.000Z", endedAt: "2026-08-01T12:30:00.000Z", hours: 3.5, hourlyCost: 220, billable: true, description: "مراجعة الإقرار", createdAt: at },
    { id: "time-2", clientId: "client-3", monthlyFileId: "file-3", taskId: "task-2", employeeId: "emp-3", startedAt: "2026-08-01T08:00:00.000Z", endedAt: "2026-08-01T13:15:00.000Z", hours: 5.25, hourlyCost: 150, billable: true, description: "مطابقة البنك", createdAt: at },
    { id: "time-3", clientId: "client-4", monthlyFileId: "file-4", taskId: "task-3", employeeId: "emp-4", startedAt: "2026-08-01T10:00:00.000Z", endedAt: "2026-08-01T12:00:00.000Z", hours: 2, hourlyCost: 90, billable: false, description: "متابعة المستندات", createdAt: at },
    { id: "time-4", clientId: "client-3", monthlyFileId: "file-3", taskId: "task-6", employeeId: "emp-1", startedAt: "2026-08-01T08:00:00.000Z", endedAt: "2026-08-01T14:30:00.000Z", hours: 6.5, hourlyCost: 250, billable: true, description: "تقرير الإدارة", createdAt: at },
    { id: "time-5", clientId: "client-2", monthlyFileId: "file-2", taskId: "task-4", employeeId: "emp-3", startedAt: "2026-08-02T09:00:00.000Z", endedAt: "2026-08-02T11:30:00.000Z", hours: 2.5, hourlyCost: 150, billable: true, description: "تجهيز الرواتب", createdAt: at },
    { id: "time-6", clientId: "client-6", monthlyFileId: "file-6", taskId: "task-7", employeeId: "emp-3", startedAt: "2026-08-01T14:00:00.000Z", endedAt: "2026-08-01T17:00:00.000Z", hours: 3, hourlyCost: 150, billable: true, description: "تحليل Excel", createdAt: at },
  ];
  const fees = clients.map((client, index) => ({ id: `fee-${index + 1}`, clientId: client.id, period: "2026-08", serviceId: "svc-bookkeeping", amount: client.feeAmount, dueDate: `2026-08-${String(client.feeDueDay).padStart(2, "0")}`, status: (["collected", "partial", "due", "overdue", "due", "collected"] as const)[index], collectedAmount: [10500, 3000, 0, 0, 0, 6500][index], lastCollectionAt: ["2026-08-01", "2026-08-01", undefined, undefined, undefined, "2026-08-02"][index], collectionMethod: index === 0 || index === 5 ? "تحويل بنكي" : index === 1 ? "نقدي" : undefined, createdAt: at }));
  const collections = [{ id: "collection-1", feeId: "fee-1", clientId: "client-1", amount: 10500, date: "2026-08-01", method: "تحويل بنكي", createdAt: at }, { id: "collection-2", feeId: "fee-2", clientId: "client-2", amount: 3000, date: "2026-08-01", method: "نقدي", createdAt: at }, { id: "collection-3", feeId: "fee-6", clientId: "client-6", amount: 6500, date: "2026-08-02", method: "تحويل بنكي", createdAt: at }];
  return {
    schemaVersion: 2, companyId, office: { id: `office-${companyId}`, nameAr: "مكتب رؤية للمحاسبة والاستشارات", nameEn: "Vision Accounting & Advisory", currency: "EGP", createdAt: at },
    clients, employees, services, packages, templates: officeWorkflowTemplates, monthlyFiles, tasks, requiredDocuments, deadlines, reviews, timeEntries, fees, collections, opportunities: [],
    activities: [{ id: "activity-1", type: "review", description: "سارة بدأت مراجعة ملف شركة النيل", clientId: "client-1", employeeId: "emp-2", entityId: "review-1", at }, { id: "activity-2", type: "document", description: "تم استلام كشف بنك مصنع دلتا", clientId: "client-3", employeeId: "emp-3", entityId: "file-3-doc-3", at }, { id: "activity-3", type: "reminder", description: "تم تسجيل تذكير مستندات مطاعم بيت المذاق", clientId: "client-4", employeeId: "emp-4", at }],
    settings: defaultOfficeSettings,
  };
}

export function createEmptyOffice(companyId: string, input?: { nameAr?: string; nameEn?: string; currency?: string; ownerName?: string; dailyHours?: number; clientPrefix?: string; filePrefix?: string }): AccountingOfficeData {
  const base = createOfficeSeed(companyId), createdAt = new Date().toISOString();
  const dailyHours = Math.max(1, Math.min(16, input?.dailyHours || defaultOfficeSettings.dailyHours));
  const ownerName = input?.ownerName?.trim();
  return {
    ...base,
    office: {
      id: `office-${companyId}`,
      nameAr: input?.nameAr?.trim() || "مكتبي المحاسبي",
      nameEn: input?.nameEn?.trim() || "My Accounting Office",
      currency: input?.currency || "EGP",
      createdAt,
    },
    clients: [],
    employees: ownerName ? [{ id: officeIdForSeed("employee"), name: ownerName, role: "owner", hourlyCost: defaultOfficeSettings.roleHourlyCosts.owner, dailyCapacityHours: dailyHours, active: true, createdAt }] : [],
    monthlyFiles: [], tasks: [], requiredDocuments: [], deadlines: [], reviews: [], timeEntries: [], fees: [], collections: [], opportunities: [], activities: [],
    settings: {
      ...defaultOfficeSettings,
      currency: input?.currency || "EGP",
      dailyHours,
      clientPrefix: input?.clientPrefix?.trim().toUpperCase() || "CL",
      filePrefix: input?.filePrefix?.trim().toUpperCase() || "MF",
    },
  };
}

function officeIdForSeed(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
