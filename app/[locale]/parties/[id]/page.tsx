import { PartyProfile360 } from "@/components/parties/party-profile-360";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale; id: string }> }) { const { locale, id } = await params; return <div className="container section"><PartyProfile360 id={id} locale={locale} /></div>; }
