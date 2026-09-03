import type { PlanId } from "@/types/service-point-demo";

export const servicePointCommercialConfig = {
  trialDays: 14,
  annualFreeMonths: 2,
  backupReminderDays: 7,
  plans: [
    { id: "starter", monthlyPrice: 299, nameAr: "ستارتر", nameEn: "Starter", storeLimit: 1, userLimit: 2, featured: false,
      featuresAr: ["افهم يومك في لقطة واحدة", "شغّل محلًا واحدًا بمستخدمين محليين", "تابع الورديات والأرصدة بوضوح", "سجّل العمليات واطبع الإيصالات", "قارن الأداء بدون نسب مضللة", "احفظ نسخة Backup محلية"],
      featuresEn: ["Understand your day at a glance", "Run one store with 2 local users", "Keep shifts and balances clear", "Record operations and print receipts", "Compare performance without misleading ratios", "Keep a local backup"] },
    { id: "pro", monthlyPrice: 599, nameAr: "برو", nameEn: "Pro", storeLimit: 1, userLimit: 10, featured: true,
      featuresAr: ["اعرف أهم قرار مطلوب منك الآن", "استلم Smart Daily Brief واضحًا", "اعرف فين فلوسك راكدة وفين الرصيد ناقص", "اعرف أداء كل كاشير وفروق وردياته", "اعرف الخدمة اللي بتكسبك أكتر", "راجع النشاط وصدّر بياناتك"],
      featuresEn: ["Know the most important decision now", "Get a clear Smart Daily Brief", "See where cash is idle or balances are low", "Understand each cashier and shift variance", "Know which service earns you more", "Review activity and export your data"] },
    { id: "business", monthlyPrice: 999, nameAr: "بيزنس", nameEn: "Business", storeLimit: 20, userLimit: 50, featured: false,
      featuresAr: ["اعرف أي محل يحقق أفضل نتيجة", "قارن المشاكل والفرص عبر الفروع", "جرّب صلاحيات تشغيل أكثر مرونة", "احصل على صورة أوسع للتقارير", "احصل على دعم أولوية عند التفعيل", "انتقل إلى Cloud Edition عند التفعيل"],
      featuresEn: ["Know which store performs best", "Compare risks and opportunities across branches", "Preview more flexible operating permissions", "Get a broader reporting view", "Receive priority activation support", "Move to Cloud Edition on activation"] },
  ] as const,
};

export const getServicePointPlan = (id: PlanId) => servicePointCommercialConfig.plans.find((plan) => plan.id === id)!;
export const annualPlanPrice = (monthlyPrice: number) => monthlyPrice * (12 - servicePointCommercialConfig.annualFreeMonths);
