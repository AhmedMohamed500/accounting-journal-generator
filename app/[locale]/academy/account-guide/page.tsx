import { AccountGuide } from "@/components/academy/account-guide";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <AccountGuide locale={locale}/>;
}
