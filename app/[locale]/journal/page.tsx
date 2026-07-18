import { GeneralJournal } from "@/components/accounting/general-journal";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; return <div className="container section"><h1>{locale === "ar" ? "دفتر اليومية العام" : "General Journal"}</h1><p className="muted">{locale === "ar" ? "كل سطور القيود التي حفظتها، مرتبة وجاهزة للبحث والطباعة والتصدير." : "All saved journal lines, ready to search, print, and export."}</p><GeneralJournal locale={locale} /></div>; }
