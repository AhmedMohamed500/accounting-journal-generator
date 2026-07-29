import { VatCenter } from "@/components/tax/vat-center";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <main className="container section"><VatCenter locale={locale}/></main>;
}
