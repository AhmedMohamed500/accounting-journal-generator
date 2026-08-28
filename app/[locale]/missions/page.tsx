import { MissionsHome } from "@/components/missions/missions-home";
import type { Locale } from "@/types";

export default async function Page({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params;return <MissionsHome locale={locale}/>; }

