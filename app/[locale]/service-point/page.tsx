import { ServicePointCenter } from "@/components/pos/service-point-center";
import { ServicePointDemoShell } from "@/components/pos/service-point-demo-shell";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ServicePointDemoShell locale={locale}><div className="container section pb-24 md:pb-10">
    <div className="no-print"><span className="badge">{locale === "ar" ? "منتج المحلات ونقاط الخدمات" : "Retail financial services"}</span>
    <h1 className="mt-3">{locale === "ar" ? "إدارة فوري والمحافظ والخزنة والأرباح" : "Service Point, Wallet & Cash Management"}</h1>
    <p className="muted max-w-4xl">{locale === "ar" ? "افتح الوردية بأرصدة حقيقية، سجل التحويل والسحب والشحن ودفع الفواتير، ثم طابق الخزنة والمحافظ واعرف صافي الربح والعجز لحظة بلحظة." : "Open with actual balances, record transfers and payments, reconcile cash and wallets, and track profit and variance in real time."}</p></div>
    <div className="mt-8"><ServicePointCenter locale={locale}/></div>
  </div></ServicePointDemoShell>;
}
