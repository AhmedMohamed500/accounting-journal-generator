"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/types";

export function Footer({ locale }: { locale: Locale }) {
  const ar = locale === "ar", pathname = usePathname();
  if (pathname.startsWith(`/${locale}/missions`) || pathname.startsWith(`/${locale}/money-flow`)) return <footer className="mission-footer no-print"><div className="missions-container"><span>FINORA LEARN</span><p>{ar?"تدريب محاسبي بصري معزول تمامًا عن بيانات الشركة.":"Visual accounting training fully isolated from company data."}</p></div></footer>;
  return <footer className="footer no-print"><div className="container footer-grid"><div className="footer-brand"><Link className="brand" href={`/${locale}`}><span className="brand-mark">ف</span><span><b>فينورا</b><small>FINORA</small></span></Link><p>{ar?"منصة تشغيل العمل المحاسبي اليومي من المستند إلى القوائم والإقفال.":"Daily accounting operations from document capture to statements and close."}</p></div><div><b>{ar?"العمل اليومي":"Daily work"}</b><Link href={`/${locale}/dashboard`}>{ar?"لوحة العمل":"Dashboard"}</Link><Link href={`/${locale}/document-cycle`}>{ar?"الدورة المستندية":"Document cycle"}</Link><Link href={`/${locale}/operations`}>{ar?"بطاقات العمليات":"Operations"}</Link></div><div><b>{ar?"التحليل والرقابة":"Analysis & control"}</b><Link href={`/${locale}/reports`}>{ar?"التقارير":"Reports"}</Link><Link href={`/${locale}/cashflow`}>{ar?"السيولة":"Cashflow"}</Link><Link href={`/${locale}/scenario-simulator`}>{ar?"محاكي القرارات":"Decision simulator"}</Link></div><div><b>{ar?"معلومات":"Information"}</b><Link href={`/${locale}/about`}>{ar?"عن فينورا":"About"}</Link><Link href={`/${locale}/privacy`}>{ar?"الخصوصية":"Privacy"}</Link><Link href={`/${locale}/terms`}>{ar?"الشروط":"Terms"}</Link></div></div><div className="container footer-bottom"><p>© 2026 FINORA — Accounting Operations Platform</p><span>{ar?"صُمم للمحاسبين والشركات":"Built for accountants and businesses"}</span></div></footer>;
}
