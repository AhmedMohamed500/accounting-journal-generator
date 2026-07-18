import { defaultAccounts } from "@/data/accounts";
import { transactions } from "@/data/transactions";

const common: Array<[string, string]> = [
  ["مدين", "Debit"], ["دائن", "Credit"], ["الإجمالي", "Total"], ["المبلغ", "Amount"], ["الرصيد", "Balance"], ["الحساب", "Account"], ["كود الحساب", "Account code"], ["اسم الحساب", "Account name"], ["البيان", "Description"], ["التاريخ", "Date"], ["المرجع", "Reference"], ["العملة", "Currency"],
  ["السيولة", "Liquidity"], ["السيولة المتاحة الآن", "Available liquidity"], ["الأرصدة الفعلية للصندوق والبنوك", "Official cash and bank balances"], ["الحساب المستخدم في التحصيل أو السداد الجديد", "Account for new receipt or payment"], ["الصندوق", "Cash"], ["الخزينة", "Cash on hand"], ["البنوك", "Banks"], ["البنك", "Bank"],
  ["العملاء", "Customers"], ["الموردون", "Suppliers"], ["العميل", "Customer"], ["المورد", "Supplier"], ["الطرف", "Party"], ["الأطراف", "Parties"], ["الفاتورة", "Invoice"], ["رقم الفاتورة", "Invoice number"], ["تاريخ الفاتورة", "Invoice date"], ["الاستحقاق", "Due date"], ["المتبقي", "Outstanding"], ["المسدد", "Paid"], ["المتأخر", "Overdue"],
  ["تحصيل", "Collection"], ["تحصيلات", "Collections"], ["سداد", "Payment"], ["مدفوعات", "Payments"], ["تسجيل تحصيل", "Record collection"], ["تسجيل سداد", "Record payment"], ["تحويل بنكي", "Bank transfer"], ["نقدي", "Cash"], ["آجل", "Credit"], ["شيك", "Cheque"], ["طريقة السداد", "Payment method"], ["طريقة السداد أو التحصيل", "Payment or receipt method"],
  ["الأصول", "Assets"], ["الالتزامات", "Liabilities"], ["حقوق الملكية", "Equity"], ["الإيرادات", "Revenue"], ["المصروفات", "Expenses"], ["الربح", "Profit"], ["الخسارة", "Loss"], ["المخزون", "Inventory"], ["ضريبة القيمة المضافة", "VAT"], ["نسبة الضريبة %", "VAT rate %"], ["قيمة الضريبة", "VAT amount"], ["الصافي", "Net"],
  ["القيد", "Journal entry"], ["رقم القيد", "Entry number"], ["قيد متوازن", "Balanced entry"], ["غير متوازن", "Unbalanced"], ["دفتر اليومية", "Journal"], ["الأستاذ العام", "General ledger"], ["ميزان المراجعة", "Trial balance"], ["قائمة الدخل", "Income statement"], ["الميزانية", "Balance sheet"], ["القوائم المالية", "Financial statements"], ["التقارير", "Reports"], ["الإقفال", "Closing"],
  ["مسودة", "Draft"], ["مراجعة", "Review"], ["معتمد", "Approved"], ["مرحّل", "Posted"], ["مرفوض", "Rejected"], ["الحالة", "Status"], ["الإجراء", "Action"], ["حفظ", "Save"], ["حذف", "Delete"], ["إضافة", "Add"], ["تعديل", "Edit"], ["اعتماد", "Approve"], ["ترحيل", "Post"], ["طباعة", "Print"], ["بحث", "Search"], ["الكل", "All"],
  ["لوحة العمل", "Dashboard"], ["بطاقات العمليات", "Operation dossiers"], ["دليل الحسابات", "Chart of accounts"], ["العهد", "Custody advances"], ["الدورة المستندية", "Document cycle"], ["تحليل Excel", "Excel analysis"], ["التحصيلات والسيولة", "Collections & cashflow"], ["قراءة فاتورة", "Invoice capture"], ["الاعتماد", "Approval"], ["الإعدادات", "Settings"],
  ["نوع العملية", "Transaction type"], ["الحساب الذي ستتحرك عليه الأموال", "Treasury account affected"], ["اختر الصندوق أو الحساب البنكي", "Select cash or bank account"], ["ملاحظات", "Notes"], ["إنشاء القيد", "Generate entry"], ["إعادة تعيين", "Reset"], ["خصم تجاري", "Commercial discount"], ["ضريبة خصم", "Withholding tax"],
  ["عدد الأطراف", "Number of parties"], ["إجمالي الرصيد", "Total balance"], ["فواتير مفتوحة", "Open invoices"], ["حد الائتمان", "Credit limit"], ["استهلاك الحد", "Limit utilization"], ["بيانات التواصل", "Contact details"], ["الهاتف / واتساب", "Phone / WhatsApp"], ["البريد الإلكتروني", "Email"], ["ملف 360°", "360° profile"],
  ["خطة 7 أيام", "7-day plan"], ["خطة 30 يومًا", "30-day plan"], ["تحصيلات متوقعة", "Expected receipts"], ["مدفوعات مطلوبة", "Required payments"], ["الرصيد المتوقع", "Projected balance"], ["عجز سيولة متوقع", "Expected liquidity shortfall"], ["مقترحات التحصيل الذكية", "Smart collection suggestions"], ["الأولوية", "Priority"], ["حرج", "Critical"], ["عادي", "Normal"],
  ["مستندات", "Documents"], ["المستندات المرتبطة", "Linked documents"], ["مصدر العملية والمستند المرتبط", "Source and linked document"], ["نوع المصدر", "Source type"], ["سجل المراجعة", "Audit trail"], ["قبل العملية", "Before transaction"], ["بعد الترحيل", "After posting"], ["الرصيد الرسمي الآن", "Official balance now"], ["الحركة", "Movement"],
  ["اليوم", "Today"], ["أيام", "Days"], ["يوم", "Day"], ["غير مستحق", "Current"], ["المتاح الآن", "Available now"], ["ما تم تسجيله اليوم", "Recorded today"], ["كشف الحساب والفواتير", "Statement and invoices"], ["أعمار الديون", "Aging analysis"],
  ["اليوم والمتأخر", "Today & overdue"], ["تحصيلات ومدفوعات", "Collections & payments"], ["نوع الحركة", "Transaction type"], ["الفترة", "Period"],
];

const glossary = new Map<string, string>();
for (const [arabic, english] of common) glossary.set(arabic, english);
for (const account of defaultAccounts) glossary.set(account.nameAr, account.nameEn);
for (const transaction of transactions) glossary.set(transaction.titleAr, transaction.titleEn);

const prefixEntries = [...glossary.entries()].filter(([arabic]) => arabic.length >= 5).sort((a, b) => b[0].length - a[0].length);

export function englishForArabic(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const exact = glossary.get(normalized); if (exact) return exact;
  const codedName = normalized.match(/^\S+\s*[—-]\s*(.+)$/)?.[1]; if (codedName && glossary.has(codedName)) return glossary.get(codedName);
  const prefix = prefixEntries.find(([arabic]) => normalized.startsWith(`${arabic} —`) || normalized.startsWith(`${arabic} -`) || normalized.startsWith(`${arabic}:`));
  return prefix?.[1];
}

export const accountingGlossarySize = glossary.size;
