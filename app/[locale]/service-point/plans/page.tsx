import { ServicePointPlans } from "@/components/pos/service-point-plans";
import type { Locale } from "@/types";
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <div className="sp-demo-shell"><ServicePointPlans locale={locale}/></div>;}
