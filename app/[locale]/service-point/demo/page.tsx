import { ServicePointSalesDemo } from "@/components/pos/service-point-sales-demo";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ServicePointSalesDemo locale={locale}/>;
}
