import { AccountingOfficeHub } from "@/components/accounting-office/accounting-office-hub";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <AccountingOfficeHub locale={locale}/>;
}
