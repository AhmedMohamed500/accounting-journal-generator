"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown, BarChart3, BookOpen, BriefcaseBusiness, Building2, ChevronDown, CircleDollarSign, FileBarChart,
  FileSpreadsheet, GraduationCap, Landmark, Languages, LayoutDashboard, Menu, Moon, Plus, ReceiptText,
  ScanText, Settings, ShieldCheck, Sparkles, Store, Users, WalletCards, Workflow, X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/types";

export function Header({ locale }: { locale: Locale }) {
  const { setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname(), ar = locale === "ar", other = ar ? "en" : "ar", landing = pathname === `/${locale}`, learningMode = pathname.startsWith(`/${locale}/arena`) || pathname.startsWith(`/${locale}/missions`) || pathname.startsWith(`/${locale}/money-flow`) || pathname.startsWith(`/${locale}/academy/detective`) || pathname.startsWith(`/${locale}/detective`);
  const [open, setOpen] = useState(false), [activeMenu, setActiveMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setActiveMenu(null); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveMenu(null); };
    document.addEventListener("pointerdown", closeOutside); document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, []);
  const landingLinks = [["features", "المميزات", "Features"], ["workflow", "كيف يعمل", "How it works"], ["product-tour", "جولة داخل النظام", "Product tour"]];
  const groups = [
    { labelAr: "العمل اليومي", labelEn: "Daily work", icon: BriefcaseBusiness, items: [
      { path: "operations", ar: "بطاقات العمليات", en: "Operations", descAr: "تابع قصة كل عملية من المستند للترحيل", descEn: "Track each transaction from document to posting", icon: Workflow },
      { path: "document-cycle", ar: "الدورة المستندية", en: "Document cycle", descAr: "بيع وشراء وقبض وصرف في دورة واحدة", descEn: "Sales, purchases, receipts, and payments", icon: ReceiptText },
      { path: "invoice-capture", ar: "قراءة الفواتير", en: "Invoice capture", descAr: "ارفع الفاتورة واستخرج بياناتها وقيدها", descEn: "Extract invoice data and create its entry", icon: ScanText },
      { path: "custody", ar: "العهد والتسويات", en: "Custody", descAr: "صرف وتسوية ورد وإقفال العهد", descEn: "Issue, settle, return, and close custody", icon: WalletCards },
      { path: "service-point", ar: "نقاط الخدمات والمحافظ", en: "Service point POS", descAr: "فوري والمحافظ والخزنة والورديات وصافي الربح", descEn: "Wallets, shifts, cash, and net profit", icon: Store },
      { path: "receivables", ar: "حسابات العملاء الآجلين", en: "Customer receivables", descAr: "فواتير آجلة وتحصيلات وأعمار ديون وقيود", descEn: "Credit invoices, collections, aging, and entries", icon: BanknoteArrowDown },
      { path: "parties", ar: "حسابات الموردين", en: "Supplier payables", descAr: "فواتير شراء آجلة وسداد وأعمار المستحقات", descEn: "Credit purchases, payments, and payable aging", icon: Users },
    ] },
    { labelAr: "الحسابات والخزينة", labelEn: "Accounting & treasury", icon: BookOpen, items: [
      { path: "accounts", ar: "دليل الحسابات", en: "Chart of accounts", descAr: "دليل احترافي قابل للتخصيص والترميز", descEn: "Customizable coded chart of accounts", icon: BookOpen },
      { path: "cashflow", ar: "التحصيلات والسيولة", en: "Collections & cashflow", descAr: "توقع الرصيد وحدد أولويات التحصيل والسداد", descEn: "Forecast cash and prioritize collections", icon: CircleDollarSign },
      { path: "bank-reconciliation", ar: "البنوك والمطابقة", en: "Bank reconciliation", descAr: "طابق كشف البنك مع القيود المرحلة", descEn: "Match bank statements with posted entries", icon: Landmark },
    ] },
    { labelAr: "التحليل والتقارير", labelEn: "Analysis & reports", icon: BarChart3, items: [
      { path: "reports", ar: "القوائم والتقارير", en: "Statements & reports", descAr: "الأستاذ وميزان المراجعة والدخل والميزانية", descEn: "Ledger, trial balance, income, and balance sheet", icon: FileBarChart },
      { path: "vat", ar: "القيمة المضافة والفترات", en: "VAT periods", descAr: "تحليل المدخلات والمخرجات وصافي كل فترة ضريبية", descEn: "Input, output, and net VAT by tax period", icon: ReceiptText },
      { path: "spreadsheet-analysis", ar: "تحليل ملفات Excel", en: "Excel analysis", descAr: "نسب ورسومات وجودة بيانات وتقرير PDF", descEn: "Ratios, charts, data quality, and PDF", icon: FileSpreadsheet },
      { path: "scenario-simulator", ar: "محاكي القرارات", en: "Decision simulator", descAr: "قارن البدائل قبل الدفع أو التحصيل", descEn: "Compare options before payment or collection", icon: Sparkles },
    ] },
    { labelAr: "الرقابة والإقفال", labelEn: "Control & close", icon: ShieldCheck, items: [
      { path: "review", ar: "المراجعة والاعتماد", en: "Review & approval", descAr: "راجع القيود واعتمدها قبل الترحيل", descEn: "Review and approve entries before posting", icon: ShieldCheck },
      { path: "close", ar: "الإقفال الذكي", en: "Smart close", descAr: "جاهزية الإقفال والمخاطر والأعمال الناقصة", descEn: "Close readiness, risks, and missing work", icon: Sparkles },
      { path: "settings", ar: "الإعدادات", en: "Settings", descAr: "بيانات الشركة والعملة وخيارات النظام", descEn: "Company, currency, and system options", icon: Settings },
    ] },
    { labelAr: "إدارة المكتب", labelEn: "Office management", icon: Building2, items: [
      { path: "accounting-office", ar: "مركز مكتب المحاسبة", en: "Accounting firm hub", descAr: "العملاء والمستندات والمهام والفريق والمراجعة والتقارير", descEn: "Clients, documents, tasks, team, review, and reports", icon: Building2 },
      { path: "workspace", ar: "الشركات والصلاحيات", en: "Companies & roles", descAr: "مساحات العملاء وأعضاء الفريق والأدوار", descEn: "Client workspaces, members, and roles", icon: Users },
    ] },
  ];
  const activePath = (path: string) => pathname === `/${locale}/${path}` || pathname.startsWith(`/${locale}/${path}/`);

  return <header ref={headerRef} className={`nav no-print ${landing ? "landing-nav" : ""}`} data-no-bilingual><div className="container nav-inner">
    <Link className="brand" href={`/${locale}`}><span className="brand-mark">ف</span><span><b>فينورا</b><small>FINORA</small></span></Link>
    {learningMode ? <nav className={`nav-links missions-nav-links ${open ? "mobile-open" : ""}`}><Link href={`/${locale}`}>{ar?"الرئيسية":"Home"}</Link><Link href={`/${locale}/arena`}>{ar?"Arena":"Arena"}</Link><Link className={pathname.startsWith(`/${locale}/missions`)?"active":""} href={`/${locale}/missions`}>{ar?"المهمات":"Missions"}</Link><Link className={pathname.startsWith(`/${locale}/money-flow`)?"active":""} href={`/${locale}/money-flow`}>{ar?"تدفق الأموال":"Money Flow"}</Link><Link className={pathname.includes("detective")?"active":""} href={`/${locale}/detective`}>{ar?"المحقق":"Detective"}</Link><Link href={`/${locale}/arena/leaderboard`}>{ar?"الترتيب":"Leaderboard"}</Link><Link href={`/${locale}/arena/profile`}>{ar?"الملف المهني":"Profile"}</Link><Link className="keep btn" href={`/${other}${pathname.slice(3)}`}><Languages size={17}/>{other.toUpperCase()}</Link><button className="btn icon-btn" aria-label={ar?"تغيير المظهر":"Toggle theme"} onClick={()=>setTheme(resolvedTheme==="dark"?"light":"dark")}><Moon size={17}/></button></nav>
    : landing ? <nav className={`nav-links landing-nav-links ${open ? "mobile-open" : ""}`}>{landingLinks.map(([anchor,labelAr,labelEn])=><a key={anchor} href={`#${anchor}`} onClick={()=>setOpen(false)}>{ar?labelAr:labelEn}</a>)}<Link className="btn" href={`/${locale}/dashboard`}><Sparkles size={16}/>{ar?"دخول النظام":"Open app"}</Link><Link className="keep btn" href={`/${other}`}><Languages size={17}/>{other.toUpperCase()}</Link><button className="btn icon-btn" aria-label={ar?"تغيير المظهر":"Toggle theme"} onClick={()=>setTheme(resolvedTheme==="dark"?"light":"dark")}><Moon size={17}/></button></nav>
    : <nav className={`nav-links app-nav-links categorized-nav ${open ? "mobile-open" : ""}`}>
      <Link className={`nav-home-link ${activePath("dashboard") ? "active" : ""}`} href={`/${locale}/dashboard`} onClick={()=>setOpen(false)}><LayoutDashboard size={18}/>{ar?"لوحة العمل":"Dashboard"}</Link>
      <Link className={`nav-home-link nav-academy-link ${activePath("arena") ? "active" : ""}`} href={`/${locale}/arena`} onClick={()=>setOpen(false)}><GraduationCap size={18}/>FINORA Arena</Link>
      <Link className={`nav-home-link ${activePath("missions") ? "active" : ""}`} href={`/${locale}/missions`} onClick={()=>setOpen(false)}><Sparkles size={18}/>{ar?"المهمات":"Missions"}</Link>
      {groups.map((group) => { const GroupIcon=group.icon, groupActive=group.items.some((item)=>activePath(item.path)), expanded=activeMenu===group.labelEn; return <div className={`nav-group ${groupActive?"active":""} ${expanded?"open":""}`} key={group.labelEn}><button type="button" className="nav-group-trigger" aria-expanded={expanded} onClick={()=>setActiveMenu(expanded?null:group.labelEn)}><GroupIcon size={17}/><span>{ar?group.labelAr:group.labelEn}</span><ChevronDown className="nav-chevron" size={15}/></button>{expanded&&<div className="nav-dropdown">{group.items.map((item)=>{const ItemIcon=item.icon;return <Link className={activePath(item.path)?"active":""} key={item.path} href={`/${locale}/${item.path}`} onClick={()=>{setOpen(false);setActiveMenu(null);}}><ItemIcon size={19}/><span><b>{ar?item.ar:item.en}</b><small>{ar?item.descAr:item.descEn}</small></span></Link>;})}</div>}</div>; })}
      <Link className="btn btn-primary nav-new-entry" style={{ color: "#fff" }} href={`/${locale}/generator`} onClick={()=>setOpen(false)}><Plus size={17} color="#fff"/><span style={{ color: "#fff" }}>{ar?"قيد جديد":"New entry"}</span></Link>
      <Link className="keep btn icon-btn" href={`/${other}`} aria-label={ar?"English":"العربية"}><Languages size={17}/><span>{other.toUpperCase()}</span></Link>
      <button className="btn icon-btn" aria-label={ar?"تغيير المظهر":"Toggle theme"} onClick={()=>setTheme(resolvedTheme==="dark"?"light":"dark")}><Moon size={17}/></button>
    </nav>}
    <button className="nav-menu btn" aria-label={ar?"فتح القائمة":"Open menu"} onClick={()=>{setOpen(!open);setActiveMenu(null);}}>{open?<X/>:<Menu/>}</button>
  </div></header>;
}
