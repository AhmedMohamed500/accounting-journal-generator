import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LatestEntryImpact } from "@/components/accounting/latest-entry-impact";
import { WorkspaceScopeBar } from "@/components/workspace/workspace-scope-bar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { Locale } from "@/types";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!["ar", "en"].includes(locale)) notFound(); const selected = locale as Locale;
  return <div dir={selected === "ar" ? "rtl" : "ltr"} lang={selected}><WorkspaceShell locale={selected}><Header locale={selected} /><WorkspaceScopeBar locale={selected} /><main>{children}<LatestEntryImpact locale={selected} /></main><Footer locale={selected} /></WorkspaceShell></div>;
}
