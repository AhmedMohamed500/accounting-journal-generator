import { SpreadsheetAnalyzer } from "@/components/spreadsheet/spreadsheet-analyzer";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <div className="container section spreadsheet-page">
    <h1>{locale === "ar" ? "محلل Excel المالي والمحاسبي" : "Financial & Accounting Excel Analyzer"}</h1>
    <p className="muted">{locale === "ar" ? "ارفع XLSX أو CSV لتحليل البيانات وتصنيف الإيرادات والمصروفات والبنوك، ثم إنشاء قيود يومية متوازنة كمسودات للمراجعة." : "Analyze XLSX or CSV data, classify financial activity, and create balanced journal drafts for review."}</p>
    <SpreadsheetAnalyzer locale={locale}/>
  </div>;
}
