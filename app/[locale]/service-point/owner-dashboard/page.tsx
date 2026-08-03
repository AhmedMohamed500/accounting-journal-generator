import { OwnerDashboard } from "@/components/pos/owner-dashboard";
import type { Locale } from "@/types";
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <OwnerDashboard locale={locale}/>;}
