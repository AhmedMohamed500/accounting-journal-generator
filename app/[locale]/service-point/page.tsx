import { ServicePointCenter } from "@/components/pos/service-point-center";
import { ServicePointDemoShell } from "@/components/pos/service-point-demo-shell";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ServicePointDemoShell locale={locale}><div className="hawally-page-dashboard"><ServicePointCenter locale={locale}/></div></ServicePointDemoShell>;
}
