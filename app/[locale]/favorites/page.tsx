import { Favorites } from "@/components/favorites";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <div className="container section"><h1>{locale === "ar" ? "المفضلة" : "Favorites"}</h1><Favorites locale={locale} /></div>;
}
