import { ChartOfAccounts } from "@/components/accounting/chart-of-accounts";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; return <div className="container section"><h1>{locale === "ar" ? "دليل الحسابات" : "Chart of Accounts"}</h1><p className="muted">{locale === "ar" ? "أضف وعدّل حسابات منشأتك. تُحفظ البيانات محليًا على هذا الجهاز." : "Add and edit your company accounts. Data is stored locally on this device."}</p><ChartOfAccounts locale={locale} /></div>; }
