import type { ParseResult, TransactionInput } from "@/types";
import { normalizeArabicNumbers } from "./normalize";

const patterns: [string, RegExp][] = [
  ["depreciation", /إهلاك|اهلاك|depreciation/i], ["customer-collection", /تحصيل|حصلنا|استلمنا|customer collection/i], ["supplier-payment", /سداد.*مورد|دفعنا.*مورد|supplier payment/i], ["fixed-asset-purchase", /(شراء|اشتريت).*أصل|fixed asset purchase/i],
  ["rent-expense", /إيجار|rent expense/i], ["electricity-expense", /كهرباء|electricity/i], ["maintenance-expense", /صيانة|إصلاح|maintenance|repair/i], ["salary-accrual", /رواتب.*مستحق|salary accrual/i], ["loan-receipt", /استلام.*قرض|loan received/i],
  ["credit-sale", /(بيع|بعت).*آجل|credit sale/i], ["cash-sale", /(بيع|بعت).*نقد|cash sale/i], ["credit-purchase", /(شراء|اشتريت).*آجل|credit purchase/i], ["cash-purchase", /(شراء|اشتريت).*نقد|cash purchase/i], ["accrued-expense", /مصروف.*مستحق|accrued expense/i], ["prepaid-expense", /مصروف.*مقدم|prepaid expense/i]
];

export function parseTransaction(text: string): ParseResult {
  const normalized = normalizeArabicNumbers(text.trim()), match = patterns.find(([, pattern]) => pattern.test(normalized)), numbers = [...normalized.matchAll(/\d+(?:,\d{3})*(?:\.\d+)?/g)].map((item) => Number(item[0].replace(/,/g, ""))), amount = numbers[0], vatMatch = normalized.match(/(?:VAT|ضريبة(?: القيمة المضافة)?)\s*(?:بنسبة)?\s*(\d+(?:\.\d+)?)\s*%/i), type = match?.[0];
  const discountMatch = normalized.match(/خصم تجاري\s*(\d[\d,]*(?:\.\d+)?)/i);
  const input: Partial<TransactionInput> = { type, amount, currency: /دولار|USD/i.test(normalized) ? "USD" : /ريال|SAR/i.test(normalized) ? "SAR" : "EGP", paymentMethod: /بنك|تحويل|bank/i.test(normalized) ? "bank" : /شيك|check|cheque/i.test(normalized) ? "cheque" : /آجل|اجل|credit|on account/i.test(normalized) ? "credit" : "cash", vatEnabled: /VAT|ضريبة القيمة المضافة|ضريبة/i.test(normalized), vatRate: vatMatch ? Number(vatMatch[1]) : undefined, vatIncluded: /شامل|included/i.test(normalized) && !/غير شامل|excluded/i.test(normalized), commercialDiscount: discountMatch ? Number(discountMatch[1].replace(/,/g, "")) : 0 };
  const missingFields: string[] = []; if (!type) missingFields.push("type"); if (!amount) missingFields.push("amount"); const confidence = Math.max(0.2, 1 - missingFields.length * .35 - (input.vatEnabled && !input.vatRate?.toString() ? .1 : 0));
  return { input, confidence, missingFields, warningsAr: missingFields.length ? ["لم نتمكن من تحديد كل البيانات. راجع الحقول قبل إنشاء القيد."] : [], warningsEn: missingFields.length ? ["Some fields could not be identified. Review them before generating."] : [] };
}
