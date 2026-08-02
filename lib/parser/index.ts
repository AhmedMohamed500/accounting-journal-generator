import type { ParseResult, TransactionInput } from "@/types";
import { getTransaction } from "@/data/transactions";
import { normalizeArabicNumbers } from "./normalize";

type TransactionRule = {
  type: string;
  patterns: RegExp[];
};

const rules: TransactionRule[] = [
  { type: "depreciation", patterns: [/\b(?:اثبات\s+)?اهلاك\b/i, /depreciation/i] },
  { type: "customer-collection", patterns: [
    /(?:حصلت|حصلنا|تحصيل|استلمت|استلمنا|قبضت|قبضنا|ورد).*?(?:عميل|زبون|مدين)/i,
    /(?:شيك|شيكات|نقد|كاش|تحويل).*?من\s+(?:ال)?(?:عميل|زبون)/i,
    /customer\s+(?:collection|receipt)|received\s+from\s+customer/i,
  ] },
  { type: "supplier-payment", patterns: [
    /(?:سددت|سددنا|سداد|دفعت|دفعنا|حولت|حولنا).*?(?:مورد|دائن)/i,
    /(?:مورد|دائن).*?(?:سداد|دفع|تحويل)/i,
    /supplier\s+payment|paid\s+(?:a\s+)?supplier/i,
  ] },
  { type: "salary-payment", patterns: [/(?:دفع|سدد|صرف).*?(?:رواتب|مرتبات|اجور)/i, /salary|payroll\s+payment/i] },
  { type: "salary-accrual", patterns: [/(?:اثبات|استحقاق|مستحق).*?(?:رواتب|مرتبات|اجور)|(?:رواتب|مرتبات).*?مستحق/i, /salary\s+accrual/i] },
  { type: "loan-payment", patterns: [/(?:سدد|دفع).*?(?:قرض|تمويل)/i, /loan\s+(?:payment|repayment)/i] },
  { type: "loan-receipt", patterns: [/(?:استلم|اخذ|حصل).*?(?:قرض|تمويل)|(?:قرض|تمويل).*?(?:استلام|وارد)/i, /loan\s+(?:received|receipt)/i] },
  { type: "asset-sale", patterns: [/(?:بيع|بعت).*?(?:اصل|سياره|سيارة|ماكينه|ماكينة|معدات|اثاث)/i, /(?:fixed\s+)?asset\s+sale/i] },
  { type: "fixed-asset-purchase", patterns: [/(?:شراء|اشتريت|اشترينا).*?(?:اصل|سياره|سيارة|ماكينه|ماكينة|معدات|اثاث|جهاز|اجهزه)/i, /fixed\s+asset\s+purchase/i] },
  { type: "rent-expense", patterns: [/ايجار|rent/i] },
  { type: "electricity-expense", patterns: [/كهرباء|مياه|غاز|مرافق|utilities|electricity/i] },
  { type: "maintenance-expense", patterns: [/صيانه|اصلاح|قطع\s+غيار|maintenance|repair/i] },
  { type: "office-supplies-expense", patterns: [/ادوات\s+مكتبيه|مطبوعات|قرطاسيه|اقلام|ورق\s+تصوير|office\s+supplies|stationery/i] },
  { type: "marketing-expense", patterns: [/تسويق|اعلان|دعايه|marketing|advertising/i] },
  { type: "professional-fees", patterns: [/اتعاب|استشار(?:ه|ات)|محامي|مراجع\s+حسابات|professional\s+fees|consulting/i] },
  { type: "bank-charges", patterns: [/عمول(?:ه|ة).*?(?:بنك|بنكي)|مصروفات?\s+بنكيه|رسوم\s+بنك|bank\s+(?:fees|charges)/i] },
  { type: "vat-payment", patterns: [/(?:سداد|دفع).*?(?:ضريبه|قيمه\s+مضافه)/i, /vat\s+payment/i] },
  { type: "capital-contribution", patterns: [/(?:اضاف|ايداع|زياد).*?راس\s*مال|راس\s*مال.*?(?:اضاف|ايداع|زياد)/i, /capital\s+contribution/i] },
  { type: "drawings", patterns: [/مسحوبات|سحب.*?شخصي|owner\s+drawings/i] },
  { type: "inventory-adjustment", patterns: [/تسوي(?:ه|ة).*?(?:مخزون|جرد)|عجز\s+مخزون|inventory\s+adjustment/i] },
  { type: "prepaid-expense", patterns: [/مصروف.*?مقدم|دفع.*?مقدم|prepaid\s+expense/i] },
  { type: "accrued-expense", patterns: [/مصروف.*?مستحق|استحقاق.*?مصروف|accrued\s+expense/i] },
  { type: "general-expense", patterns: [/مصروف|نظافه|انتقالات|ضيافه|اشتراك|انترنت|تليفون|هاتف|general\s+expense/i] },
  { type: "credit-sale", patterns: [/(?:بيع|بعت|بعنا).*?(?:اجل|ع\s*الحساب|علي\s*الحساب)/i, /credit\s+sale/i] },
  { type: "cash-sale", patterns: [/(?:بيع|بعت|بعنا|مبيعات).*?(?:نقد|كاش|صندوق|بنك|تحويل|شيك)/i, /cash\s+sale/i] },
  { type: "credit-purchase", patterns: [/(?:شراء|اشتريت|اشترينا|مشتريات).*?(?:اجل|ع\s*الحساب|علي\s*الحساب)/i, /credit\s+purchase/i] },
  { type: "cash-purchase", patterns: [/(?:شراء|اشتريت|اشترينا|مشتريات)/i, /cash\s+purchase/i] },
  { type: "revenue", patterns: [/(?:ايراد|دخل|اتعاب|خدمه|خدمة).*?(?:استلم|حصل|نقد|كاش|بنك|تحويل)?/i, /service\s+revenue|revenue/i] },
];

const cleanArabic = (value: string) => normalizeArabicNumbers(value)
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/ؤ/g, "و")
  .replace(/ئ/g, "ي")
  .replace(/[ـ–—]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function amountFrom(text: string) {
  const explicit = text.match(/(?:بمبلغ|بقيمة|قيمتها|قيمته|اجمالي|الاجمالي|total|amount)\s*(?:قدره)?\s*[:=]?\s*([\d,]+(?:\.\d+)?)/i);
  if (explicit) return Number(explicit[1].replace(/,/g, ""));
  const candidates = [...text.matchAll(/(?:^|\s)([\d,]+(?:\.\d+)?)(?!\s*%)/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  return candidates.sort((a, b) => b - a)[0];
}

function partyFrom(text: string, kind: "customer" | "supplier") {
  const label = kind === "customer" ? "(?:ال)?(?:عميل|زبون)" : "(?:ال)?(?:مورد|دائن)";
  const match = text.match(new RegExp(`(?:من|الي|الى|ل)?\\s*${label}\\s+([\\p{L}][\\p{L}\\s]{1,40}?)(?=\\s+(?:بمبلغ|بقيمة|مبلغ|وقدره|نقد|كاش|بشيك|شيك|عن|فاتوره|فاتورة|\\d|$)|[,،.]|$)`, "iu"));
  return match?.[1]?.trim();
}

function detectType(text: string) {
  return rules.find((rule) => rule.patterns.some((pattern) => pattern.test(text)))?.type;
}

function detectPaymentMethod(text: string, type?: string): TransactionInput["paymentMethod"] {
  if (/شيك|شيكات|check|cheque/i.test(text)) return "cheque";
  if (/بنك|بنكي|تحويل|انستا\s*باي|instapay|visa|master/i.test(text)) return "bank";
  if (/اجل|ع\s*الحساب|علي\s*الحساب|ذمه|credit|on\s+account/i.test(text)) return "credit";
  if (/نقد|كاش|صندوق|cash/i.test(text)) return "cash";
  return getTransaction(type || "")?.payment || "cash";
}

function detectCurrency(text: string) {
  if (/دولار|usd|\$/i.test(text)) return "USD";
  if (/يورو|eur|€/i.test(text)) return "EUR";
  if (/ريال\s+سعودي|sar/i.test(text)) return "SAR";
  if (/درهم|aed/i.test(text)) return "AED";
  if (/دينار\s+كويتي|kwd/i.test(text)) return "KWD";
  if (/ريال\s+قطري|qar/i.test(text)) return "QAR";
  if (/جنيه\s+استرليني|gbp|£/i.test(text)) return "GBP";
  return "EGP";
}

export function parseTransaction(text: string): ParseResult {
  const original = text.trim();
  const normalized = cleanArabic(original);
  const type = detectType(normalized);
  const amount = amountFrom(normalized);
  const vatMatch = normalized.match(/(?:vat|ضريبه(?:\s+القيمه\s+المضافه)?)\s*(?:بنسبه)?\s*(\d+(?:\.\d+)?)\s*%|(?:بنسبه\s*)?(\d+(?:\.\d+)?)\s*%\s*(?:vat|ضريبه)/i);
  const discountMatch = normalized.match(/خصم\s+تجاري\s*(?:بمبلغ|بقيمة|بنسبه)?\s*([\d,]+(?:\.\d+)?)/i);
  const withholdingMatch = normalized.match(/(?:خصم\s+وتحصيل|ضريبه\s+خصم|withholding)\s*(?:بنسبه)?\s*(\d+(?:\.\d+)?)\s*%/i);
  const vatRate = vatMatch ? Number(vatMatch[1] || vatMatch[2]) : undefined;
  const customer = partyFrom(normalized, "customer");
  const supplier = partyFrom(normalized, "supplier");
  const input: Partial<TransactionInput> = {
    type,
    amount,
    currency: detectCurrency(normalized),
    paymentMethod: detectPaymentMethod(normalized, type),
    vatEnabled: /vat|ضريبه(?:\s+القيمه\s+المضافه)?/i.test(normalized),
    vatRate,
    vatIncluded: /شامل(?:ه)?\s+(?:ال)?ضريبه|vat\s+included/i.test(normalized) && !/غير\s+شامل/i.test(normalized),
    commercialDiscount: discountMatch ? Number(discountMatch[1].replace(/,/g, "")) : 0,
    withholdingEnabled: Boolean(withholdingMatch),
    withholdingRate: withholdingMatch ? Number(withholdingMatch[1]) : 0,
    customer,
    supplier,
    notes: original,
  };
  const missingFields: string[] = [];
  if (!type) missingFields.push("type");
  if (!amount) missingFields.push("amount");
  const confidence = Math.max(0.2, Math.min(0.99, 1 - missingFields.length * 0.35 - (input.vatEnabled && vatRate === undefined ? 0.1 : 0)));
  const warningsAr: string[] = [];
  const warningsEn: string[] = [];
  if (!type) { warningsAr.push("لم أفهم نوع العملية بعد؛ اذكر مثلًا بيع، شراء، تحصيل عميل، سداد مورد أو اسم المصروف."); warningsEn.push("The transaction type was not clear; mention sale, purchase, collection, supplier payment, or the expense name."); }
  if (!amount) { warningsAr.push("لم أجد مبلغًا واضحًا في الوصف."); warningsEn.push("No clear amount was found in the description."); }
  if (input.vatEnabled && vatRate === undefined) { warningsAr.push("تم اكتشاف ضريبة بدون نسبة؛ ستُستخدم النسبة الافتراضية 14% ويمكنك تعديلها."); warningsEn.push("Tax was detected without a rate; the default 14% will be used and can be changed."); }
  return { input, confidence, missingFields, warningsAr, warningsEn };
}
