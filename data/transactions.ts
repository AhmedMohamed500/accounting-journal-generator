import type { TransactionDefinition } from "@/types";
const d=(slug:string,type:string,category:TransactionDefinition["category"],ar:string,en:string,debitAr:string,debitEn:string,creditAr:string,creditEn:string,keywords:string[]=[],payment?:TransactionDefinition["payment"]):TransactionDefinition=>({slug,type,category,titleAr:ar,titleEn:en,descriptionAr:`قيد ${ar} مع شرح الأثر المحاسبي.`,descriptionEn:`Journal entry for ${en} with accounting impact.`,debitAccountAr:debitAr,debitAccountEn:debitEn,creditAccountAr:creditAr,creditAccountEn:creditEn,keywords,payment});
export const transactions: TransactionDefinition[] = [
 d("cash-sale","cash-sale","sales","بيع نقدي","Cash sale","النقدية","Cash","إيراد المبيعات","Sales revenue",["بيع","cash sale"],"cash"),
 d("credit-sale","credit-sale","sales","بيع آجل","Credit sale","العملاء","Accounts receivable","إيراد المبيعات","Sales revenue",["آجل","credit sale"],"credit"),
 d("cash-purchase","cash-purchase","purchases","شراء نقدي","Cash purchase","المخزون","Inventory","النقدية","Cash",["شراء","cash purchase"],"cash"),
 d("credit-purchase","credit-purchase","purchases","شراء آجل","Credit purchase","المخزون","Inventory","الموردون","Accounts payable",["شراء آجل","credit purchase"],"credit"),
 d("customer-collection","customer-collection","sales","تحصيل من عميل","Customer collection","النقدية","Cash / Bank","العملاء","Accounts receivable",["تحصيل","استلمنا","collection"],"bank"),
 d("supplier-payment","supplier-payment","purchases","سداد مورد","Supplier payment","الموردون","Accounts payable","النقدية","Cash / Bank",["سداد","دفعنا","supplier payment"],"bank"),
 d("rent-expense","rent-expense","expenses","مصروف إيجار","Rent expense","مصروف الإيجار","Rent expense","النقدية / المستحقات","Cash / Payable",["إيجار","rent"],"cash"),
 d("electricity-expense","electricity-expense","expenses","مصروف كهرباء","Electricity expense","مصروف الكهرباء","Electricity expense","النقدية / المستحقات","Cash / Payable",["كهرباء","electricity"],"cash"),
 d("maintenance-expense","maintenance-expense","expenses","مصروف صيانة وإصلاح","Maintenance and repairs","مصروف الصيانة والإصلاح","Maintenance and repairs","النقدية / المستحقات","Cash / Payable",["صيانة","إصلاح","maintenance","repair"],"cash"),
 d("fixed-asset-purchase","fixed-asset-purchase","assets","شراء أصل ثابت","Fixed asset purchase","الأصول الثابتة","Fixed assets","النقدية / الموردون","Cash / Payable",["أصل ثابت","fixed asset"],"cash"),
 d("depreciation","depreciation","assets","إثبات إهلاك","Depreciation","مصروف الإهلاك","Depreciation expense","مجمع الإهلاك","Accumulated depreciation",["إهلاك","depreciation"]),
 d("asset-sale","asset-sale","assets","بيع أصل ثابت","Fixed asset sale","النقدية ومجمع الإهلاك","Cash and accumulated depreciation","الأصل والربح","Asset and gain",["بيع أصل","asset sale"]),
 d("salary-accrual","salary-accrual","payroll","استحقاق رواتب","Salary accrual","مصروف الرواتب","Salary expense","رواتب مستحقة","Salaries payable",["رواتب","payroll"]),
 d("salary-payment","salary-payment","payroll","سداد رواتب","Salary payment","رواتب مستحقة","Salaries payable","النقدية","Cash",["سداد رواتب"],"bank"),
 d("loan-receipt","loan-receipt","loans","استلام قرض","Loan receipt","النقدية","Cash / Bank","قرض مستحق","Loan payable",["قرض","loan"],"bank"),
 d("loan-payment","loan-payment","loans","سداد أصل قرض","Loan principal payment","قرض مستحق","Loan payable","النقدية","Cash / Bank",["سداد قرض"],"bank"),
 d("accrued-expense","accrued-expense","adjustments","مصروف مستحق","Accrued expense","المصروف","Expense","مصروفات مستحقة","Accrued expenses",["مستحق","accrued expense"]),
 d("prepaid-expense","prepaid-expense","adjustments","مصروف مقدم","Prepaid expense","مصروفات مقدمة","Prepaid expenses","النقدية","Cash",["مقدم","prepaid"]),
 d("capital-contribution","capital-contribution","capital","إضافة رأس مال","Capital contribution","النقدية","Cash / Bank","رأس المال","Owner capital",["رأس مال","capital"],"bank"),
 d("drawings","drawings","capital","مسحوبات شخصية","Owner drawings","المسحوبات","Drawings","النقدية","Cash",["مسحوبات","drawings"],"cash"),
 d("bank-charges","bank-charges","expenses","مصروفات بنكية","Bank charges","مصروفات بنكية","Bank charges","البنك","Bank",["عمولة بنك","bank charges"],"bank"),
 d("revenue","revenue","revenues","إيراد خدمات","Service revenue","النقدية / العملاء","Cash / Receivable","إيراد خدمات","Service revenue",["إيراد","revenue"]),
 d("vat-payment","vat-payment","taxes","سداد ضريبة القيمة المضافة","VAT payment","ضريبة قيمة مضافة مستحقة","VAT payable","البنك","Bank",["سداد ضريبة","vat payment"],"bank"),
 d("inventory-adjustment","inventory-adjustment","inventory","تسوية مخزون","Inventory adjustment","خسائر مخزون","Inventory loss","المخزون","Inventory",["تسوية مخزون"]),
 d("closing-revenue","closing-revenue","closing","إقفال الإيرادات","Close revenues","الإيرادات","Revenue","ملخص الدخل","Income summary",["إقفال الإيراد"])
];
export const getTransaction=(type:string)=>transactions.find(t=>t.type===type);
export const getTransactionBySlug=(slug:string)=>transactions.find(t=>t.slug===slug);
