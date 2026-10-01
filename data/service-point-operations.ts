import type { ExpenseCategory, ShiftChecklistItem } from "@/types/service-point-operations";

export const defaultExpenseCategories: ExpenseCategory[] = [
  ["rent", "الإيجار", "Rent"], ["electricity", "الكهرباء", "Electricity"], ["water", "المياه", "Water"],
  ["internet", "الإنترنت والاتصالات", "Internet & telecom"], ["wages", "الأجور", "Wages"], ["transport", "النقل", "Transport"],
  ["maintenance", "الصيانة", "Maintenance"], ["marketing", "التسويق", "Marketing"], ["bank-fees", "رسوم بنكية", "Bank fees"],
  ["other", "أخرى", "Other"],
].map(([id, nameAr, nameEn]) => ({ id, nameAr, nameEn, active: true }));

export const defaultShiftChecklist: ShiftChecklistItem[] = [
  { id: "open-cash", phase: "opening", labelAr: "عد الخزنة وتأكيد رصيد البداية", labelEn: "Count cash and confirm opening balance", required: true, active: true },
  { id: "open-providers", phase: "opening", labelAr: "تأكيد أرصدة كل مقدمي الخدمة", labelEn: "Confirm every provider balance", required: true, active: true },
  { id: "open-devices", phase: "opening", labelAr: "فحص الإنترنت والأجهزة والطابعة", labelEn: "Check internet, devices, and printer", required: false, active: true },
  { id: "close-pending", phase: "closing", labelAr: "مراجعة العمليات المعلقة والفاشلة", labelEn: "Review pending and failed operations", required: true, active: true },
  { id: "close-cash", phase: "closing", labelAr: "عد الخزنة ومطابقتها", labelEn: "Count and reconcile cash", required: true, active: true },
  { id: "close-providers", phase: "closing", labelAr: "مطابقة أرصدة مقدمي الخدمة", labelEn: "Reconcile provider balances", required: true, active: true },
  { id: "close-handover", phase: "closing", labelAr: "كتابة ملاحظات وتسليم الوردية", labelEn: "Record notes and hand over shift", required: false, active: true },
];
