import { OperationDossierView } from "@/components/operations/operation-dossier-view";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale; id: string }> }) { const { locale, id } = await params; return <div className="container section"><OperationDossierView id={id} locale={locale} /></div>; }
