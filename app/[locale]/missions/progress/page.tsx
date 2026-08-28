import { MissionsProgressView } from "@/components/missions/missions-progress";
import type { Locale } from "@/types";

export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <MissionsProgressView locale={locale}/>;}

