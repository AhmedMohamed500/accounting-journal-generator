import { PracticeLab } from "@/components/academy/practice-lab";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <PracticeLab locale={locale}/>;
}
