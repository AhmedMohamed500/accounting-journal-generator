import { DetectiveHome } from "@/components/detective/detective-home";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <DetectiveHome locale={locale}/>;
}
