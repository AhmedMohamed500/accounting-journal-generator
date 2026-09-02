import { redirect } from "next/navigation"; import type { Locale } from "@/types";
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;redirect(`/${locale}/missions`)}
