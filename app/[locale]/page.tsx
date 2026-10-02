import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import type { Locale } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === "ar";
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const title = ar ? "حوّلي | تشغيل نقاط الخدمات من الوردية حتى التسوية" : "Hawally | Service Point Operations from Shift to Reconciliation";
  const description = ar
    ? "أدر عمليات فوري والمحافظ والخزنة وأرصدة الخدمات والورديات والربح والتسوية ورقابة المالك من واجهة واحدة."
    : "Manage payment operations, cash, provider balances, shifts, profit, reconciliation, and owner control from one Hawally interface.";
  const canonical = `${base}/${locale}`;
  return {
    title,
    description,
    alternates: { canonical, languages: { ar: `${base}/ar`, en: `${base}/en` } },
    openGraph: { title, description, url: canonical, siteName: "Hawally | حوّلي", locale: ar ? "ar_EG" : "en_US", type: "website", images: [{ url: `${base}/hawally-service-point-banner.png`, width: 1600, height: 900, alt: ar ? "واجهة حوّلي لنقاط الخدمات" : "Hawally Service Point interface" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${base}/hawally-service-point-banner.png`] },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <LandingPage locale={locale}/>;
}
