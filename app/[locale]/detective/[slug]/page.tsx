import { notFound } from "next/navigation";
import { DetectiveWorkspace } from "@/components/detective/detective-workspace";
import { detectiveCases, getDetectiveCase } from "@/data/detective/cases";
import type { Locale } from "@/types";

export function generateStaticParams() { return ["ar", "en"].flatMap((locale) => detectiveCases.map((item) => ({ locale, slug: item.slug }))); }
export default async function Page({ params }: { params: Promise<{ locale: Locale; slug: string }> }) { const { locale, slug } = await params, caseDefinition = getDetectiveCase(slug); if (!caseDefinition) notFound(); return <DetectiveWorkspace caseDefinition={caseDefinition} locale={locale}/>; }
