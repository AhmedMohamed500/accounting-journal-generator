import { TrialBalance } from "@/components/accounting/trial-balance";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; return <div className="container section"><h1>{locale === "ar" ? "ميزان المراجعة" : "Trial Balance"}</h1><p className="muted">{locale === "ar" ? "أرصدة الحسابات محسوبة تلقائيًا من القيود المحفوظة والمتوازنة فقط." : "Account balances calculated automatically from saved, balanced entries only."}</p><TrialBalance locale={locale} /></div>; }
