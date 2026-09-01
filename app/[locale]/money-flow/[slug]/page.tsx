import { notFound } from "next/navigation";
import { MoneyFlowLab } from "@/components/money-flow/money-flow-lab";
import { getMoneyFlowScenario, moneyFlowScenarios } from "@/data/money-flow/scenarios";
import type { Locale } from "@/types";

export function generateStaticParams(){return ["ar","en"].flatMap((locale)=>moneyFlowScenarios.map((scenario)=>({locale,slug:scenario.slug})));}
export default async function MoneyFlowScenarioPage({params}:{params:Promise<{locale:Locale;slug:string}>}){const {locale,slug}=await params,scenario=getMoneyFlowScenario(slug);if(!scenario)notFound();return <MoneyFlowLab scenario={scenario} locale={locale}/>;}
