import { ArenaWorkspace } from "@/components/arena/arena-workspace";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ArenaWorkspace locale={locale} mode="mission" />;
}
