import { TaskDashboard } from "@/components/tasks/task-dashboard";
import type { Locale } from "@/types";
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; return <div className="container section"><h1>{locale === "ar" ? "لوحة عمل المحاسب" : "Accountant Workspace"}</h1><p className="muted">{locale === "ar" ? "نظّم مهام اليوم، تابع المتأخرات واربط العمل بالقيود المحفوظة." : "Organize today’s work, track overdue tasks, and link work to saved entries."}</p><TaskDashboard locale={locale} /></div>; }
