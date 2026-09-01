import { MoneyFlowHome } from "@/components/money-flow/money-flow-home";
import type { Locale } from "@/types";

export default async function MoneyFlowPage({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <MoneyFlowHome locale={locale}/>;}
