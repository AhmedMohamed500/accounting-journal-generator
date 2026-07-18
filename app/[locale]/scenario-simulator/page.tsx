import { DecisionSimulator } from "@/components/scenarios/decision-simulator";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <main className="container section"><h1>{locale === "ar" ? "محاكي القرارات المالية · Financial Decision Simulator" : "Financial Decision Simulator"}</h1><p className="muted">{locale === "ar" ? "جرّب القرار قبل تنفيذه، وقارن النقدي والآجل والحل المختلط على السيولة والربح والضريبة والميزانية، ثم حوّل البديل المختار إلى مسودة قيد." : "Test a decision before execution, compare cash, credit, and split options, then turn the selected option into draft journal entries."}</p><DecisionSimulator locale={locale}/></main>;
}
