import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LatestEntryImpact } from "@/components/accounting/latest-entry-impact";
import { BilingualAccountingLabels } from "@/components/i18n/bilingual-accounting-labels";
import type { Locale } from "@/types";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!["ar", "en"].includes(locale)) notFound(); const selected = locale as Locale;
  return <div dir={selected === "ar" ? "rtl" : "ltr"} lang={selected} data-bilingual-accounting-root><BilingualAccountingLabels enabled={selected === "ar"} /><Header locale={selected} /><main>{children}<LatestEntryImpact locale={selected} /></main><Footer locale={selected} /></div>;
}
