import { ArenaApp } from "@/components/arena/arena-app"; import type { Locale } from "@/types";
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <ArenaApp locale={locale} view="profile"/>}
