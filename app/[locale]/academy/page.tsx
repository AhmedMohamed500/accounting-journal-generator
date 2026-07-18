import { AcademyHome } from "@/components/academy/academy-home";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <AcademyHome locale={locale}/>;
}
