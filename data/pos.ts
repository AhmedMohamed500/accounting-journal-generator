import type { PosOperationType, PosProviderId } from "@/types";

export const posProviders: Array<{ id: PosProviderId; nameAr: string; nameEn: string; accountCode: string; color: string }> = [
  { id: "fawry", nameAr: "فوري", nameEn: "Fawry", accountCode: "1181", color: "#f5b700" },
  { id: "vodafone-cash", nameAr: "فودافون كاش", nameEn: "Vodafone Cash", accountCode: "1182", color: "#e60000" },
  { id: "orange-cash", nameAr: "أورنج كاش", nameEn: "Orange Cash", accountCode: "1183", color: "#ff7900" },
  { id: "etisalat-cash", nameAr: "إي آند كاش", nameEn: "e& Cash", accountCode: "1184", color: "#00a651" },
  { id: "aman", nameAr: "أمان", nameEn: "Aman", accountCode: "1185", color: "#1769aa" },
  { id: "masary", nameAr: "مصاري", nameEn: "Masary", accountCode: "1186", color: "#6f42c1" },
  { id: "instapay", nameAr: "إنستا باي", nameEn: "InstaPay", accountCode: "1187", color: "#6d2c91" },
];

export const posOperationTypes: Array<{ id: PosOperationType; nameAr: string; nameEn: string; needsProvider: boolean; helpAr: string }> = [
  { id: "send-transfer", nameAr: "تحويل للعميل", nameEn: "Send transfer", needsProvider: true, helpAr: "العميل يدفع نقدًا ورصيد المحفظة ينخفض" },
  { id: "cash-withdrawal", nameAr: "سحب نقدي للعميل", nameEn: "Cash withdrawal", needsProvider: true, helpAr: "رصيد المحفظة يزيد والخزنة تدفع للعميل" },
  { id: "bill-payment", nameAr: "دفع فاتورة", nameEn: "Bill payment", needsProvider: true, helpAr: "تحصيل نقدي مقابل خصم قيمة الفاتورة من رصيد الخدمة" },
  { id: "recharge", nameAr: "شحن رصيد", nameEn: "Recharge", needsProvider: true, helpAr: "تحصيل نقدي مقابل خصم الشحن من رصيد الخدمة" },
  { id: "provider-topup", nameAr: "تغذية رصيد الخدمة", nameEn: "Provider balance top-up", needsProvider: true, helpAr: "تحويل سيولة من الخزنة إلى رصيد الماكينة أو المحفظة" },
  { id: "internal-provider-transfer", nameAr: "تحويل بين أرصدة المحل", nameEn: "Transfer between store balances", needsProvider: true, helpAr: "ينقص رصيد المحفظة المصدر ويزيد رصيد المحفظة الوجهة دون حركة خزنة أو ربح" },
  { id: "store-expense", nameAr: "مصروف محل", nameEn: "Store expense", needsProvider: false, helpAr: "مصروف نقدي يخص تشغيل المحل" },
];

export const posAccountCodes = {
  cash: "1180",
  commissionRevenue: "4400",
  providerFees: "5650",
  storeExpense: "5660",
  cashOverShort: "5710",
} as const;

export const posLedgerAccounts = [
  { code: "1180", nameAr: "خزينة نقطة الخدمات", nameEn: "Service point cash" },
  ...posProviders.map((provider) => ({ code: provider.accountCode, nameAr: `رصيد ${provider.nameAr}`, nameEn: `${provider.nameEn} balance` })),
  { code: "4400", nameAr: "إيراد عمولات نقاط الخدمات", nameEn: "Service point commission revenue" },
  { code: "5650", nameAr: "تكلفة وعمولات مقدمي الخدمات", nameEn: "Service provider fees" },
  { code: "5660", nameAr: "مصروفات تشغيل نقطة الخدمات", nameEn: "Service point operating expense" },
  { code: "5710", nameAr: "عجز وزيادة خزينة نقطة الخدمات", nameEn: "Service point cash over and short" },
];
