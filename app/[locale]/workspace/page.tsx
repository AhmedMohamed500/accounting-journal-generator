import { WorkspaceManager } from "@/components/workspace/workspace-manager";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; return <div className="container section"><h1>{locale === "ar" ? "الشركات والفريق" : "Companies & Team"}</h1><p className="muted">{locale === "ar" ? "أنشئ شركاتك وحدد أعضاء الفريق وأدوارهم وصلاحياتهم." : "Create companies and define team roles and permissions."}</p><WorkspaceManager locale={locale} /></div>; }
