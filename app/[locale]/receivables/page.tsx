import { CustomerReceivablesCenter } from "@/components/parties/customer-receivables-center";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <main className="container section"><CustomerReceivablesCenter locale={locale}/></main>;
}
