import { LandingPage } from "@/components/landing/landing-page";
import type { Locale } from "@/types";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <LandingPage locale={locale}/>;
}
