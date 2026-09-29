"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/types";
import { HawallyBrand } from "@/components/brand/hawally-brand";

export function Footer({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted && (pathname === `/${locale}/service-point` || pathname.startsWith(`/${locale}/service-point/`))) return null;
  return <footer className="footer no-print"><div className="container footer-grid"><div className="footer-brand"><HawallyBrand locale={locale} href={`/${locale}`}/><p>{ar?"منصة تشغيل العمل المحاسبي اليومي من المستند إلى القوائم والإقفال.":"Daily accounting operations from document capture to statements and close."}</p></div><div><b>{ar?"العمل اليومي":"Daily work"}</b><Link href={`/${locale}/dashboard`}>{ar?"لوحة العمل":"Dashboard"}</Link><Link href={`/${locale}/document-cycle`}>{ar?"الدورة المستندية":"Document cycle"}</Link><Link href={`/${locale}/operations`}>{ar?"بطاقات العمليات":"Operations"}</Link></div><div><b>{ar?"التحليل والرقابة":"Analysis & control"}</b><Link href={`/${locale}/reports`}>{ar?"التقارير":"Reports"}</Link><Link href={`/${locale}/cashflow`}>{ar?"السيولة":"Cashflow"}</Link><Link href={`/${locale}/scenario-simulator`}>{ar?"محاكي القرارات":"Decision simulator"}</Link></div><div><b>{ar?"معلومات":"Information"}</b><Link href={`/${locale}/about`}>{ar?"عن حوّلي":"About"}</Link><Link href={`/${locale}/privacy`}>{ar?"الخصوصية":"Privacy"}</Link><Link href={`/${locale}/terms`}>{ar?"الشروط":"Terms"}</Link></div></div><div className="container footer-bottom"><p>© 2026 Hawally — Accounting Operations Platform</p><span>{ar?"صُمم للمحاسبين والشركات":"Built for accountants and businesses"}</span></div></footer>;
}
