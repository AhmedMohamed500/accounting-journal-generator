import type { PlanId } from "@/types/service-point-demo";

export const servicePointCommercialConfig = {
  trialDays: 14,
  annualFreeMonths: 2,
  backupReminderDays: 7,
  plans: [
    { id: "starter", monthlyPrice: 299, nameAr: "ستارتر", nameEn: "Starter", storeLimit: 1, userLimit: 2, featured: false,
      featuresAr: ["محل واحد", "مستخدمان محليان", "الورديات والأرصدة", "العمليات والإيصالات", "التقارير الأساسية", "Backup محلي"],
      featuresEn: ["1 store", "2 local users", "Shifts and balances", "Operations and receipts", "Basic reports", "Local backup"] },
    { id: "pro", monthlyPrice: 599, nameAr: "برو", nameEn: "Pro", storeLimit: 1, userLimit: 10, featured: true,
      featuresAr: ["مستخدمون متعددون", "تقارير متقدمة", "أداء الكاشير", "تحليل الربحية", "رادار الرقابة", "سجل النشاط والتصدير"],
      featuresEn: ["Multiple users", "Advanced reports", "Cashier performance", "Profitability", "Control radar", "Audit and export"] },
    { id: "business", monthlyPrice: 999, nameAr: "بيزنس", nameEn: "Business", storeLimit: 20, userLimit: 50, featured: false,
      featuresAr: ["عدة محلات", "مقارنة الفروع", "صلاحيات متقدمة تجريبية", "تقارير موسعة", "دعم أولوية عند التفعيل", "Cloud Edition عند التفعيل"],
      featuresEn: ["Multiple stores", "Store comparison", "Advanced demo permissions", "Extended reporting", "Priority activation support", "Cloud Edition on activation"] },
  ] as const,
};

export const getServicePointPlan = (id: PlanId) => servicePointCommercialConfig.plans.find((plan) => plan.id === id)!;
export const annualPlanPrice = (monthlyPrice: number) => monthlyPrice * (12 - servicePointCommercialConfig.annualFreeMonths);
