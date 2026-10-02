import Image from "next/image";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";
import { posProviders } from "@/data/pos";
import type { Locale } from "@/types";

const demoBalances: Record<string, string> = {
  fawry: "417",
  "vodafone-cash": "18,797",
  "orange-cash": "3,699",
  "etisalat-cash": "3,100",
  aman: "2,098",
  masary: "2,200",
  instapay: "3,500",
};

const money = (value: string, locale: Locale) => locale === "ar" ? `${value} ج.م` : `EGP ${value}`;

function WindowBar({ label }: { label: string }) {
  return <div className="marketing-window-bar"><span className="marketing-window-dots"><i/><i/><i/></span><span>{label}</span><Search size={14}/></div>;
}

export function HeroProductPreview({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return <div className="marketing-hero-stage" aria-label={ar ? "معاينة حقيقية لواجهات حوّلي" : "Real Hawally product interface preview"}>
    <div className="marketing-browser marketing-hero-browser">
      <WindowBar label={ar ? "Hawally · لوحة نقطة الخدمات" : "Hawally · Service Point dashboard"}/>
      <div className="marketing-app-shell">
        <aside className="marketing-mini-sidebar"><b>H</b>{[Home, WalletCards, BarChart3, Store].map((Icon, index) => <span className={index === 0 ? "active" : ""} key={index}><Icon size={16}/></span>)}</aside>
        <div className="marketing-app-main">
          <div className="marketing-dashboard-banner">
            <Image src="/hawally-service-point-banner.png" fill sizes="(max-width: 780px) 90vw, 600px" alt={ar ? "فرع حوّلي للخدمات المالية" : "Hawally financial services branch"}/>
            <div><small>{ar ? "وردية نشطة وجاهزة للعمل" : "Active shift ready for work"}</small><strong>{ar ? "مستقبل أكبر لنقاط الخدمات" : "A bigger future for service points"}</strong></div>
          </div>
          <div className="marketing-provider-row">
            {posProviders.slice(0, 4).map((provider) => <div key={provider.id} style={{ "--provider": provider.color } as React.CSSProperties}><span>{locale === "ar" ? provider.nameAr : provider.nameEn}</span><b>{money(demoBalances[provider.id], locale)}</b></div>)}
          </div>
          <div className="marketing-kpi-row">
            <div><WalletCards/><span>{ar ? "السيولة المتاحة" : "Available liquidity"}</span><b>{money("42,436", locale)}</b></div>
            <div><CircleDollarSign/><span>{ar ? "حركة الوردية" : "Shift volume"}</span><b>{money("3,580", locale)}</b></div>
            <div><BarChart3/><span>{ar ? "صافي الربح" : "Net profit"}</span><b>{money("36", locale)}</b></div>
          </div>
          <div className="marketing-chart-card"><span>{ar ? "حركة العمليات هذا الأسبوع" : "Weekly operation volume"}</span><svg viewBox="0 0 420 92" role="img" aria-label={ar ? "رسم حركة العمليات" : "Operations chart"}><defs><linearGradient id="hero-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1687ff" stopOpacity=".28"/><stop offset="1" stopColor="#1687ff" stopOpacity="0"/></linearGradient></defs><path d="M4 72 C48 68 66 35 108 44 S170 67 210 38 S274 18 312 34 S368 48 416 13 L416 90 L4 90 Z" fill="url(#hero-chart-fill)"/><path d="M4 72 C48 68 66 35 108 44 S170 67 210 38 S274 18 312 34 S368 48 416 13" fill="none" stroke="#1687ff" strokeWidth="4" strokeLinecap="round"/></svg></div>
        </div>
      </div>
    </div>
    <div className="marketing-owner-float">
      <span><ShieldCheck size={16}/>{ar ? "مركز قيادة المالك" : "Owner command center"}</span>
      <b>{ar ? "اليوم والتشغيل" : "Today & operations"}</b>
      <div><small>{ar ? "ربح اليوم" : "Today profit"}</small><strong>{money("36", locale)}</strong></div>
      <p><CheckCircle2 size={14}/>{ar ? "مطابقة أرصدة الخدمات مكتملة" : "Provider reconciliation complete"}</p>
    </div>
    <div className="marketing-phone">
      <div className="marketing-phone-top"><b>H</b><Menu size={15}/></div>
      <small>{ar ? "عملية سريعة" : "Quick operation"}</small>
      <strong>{ar ? "تحويل للعميل" : "Customer transfer"}</strong>
      <div className="marketing-phone-balance"><span>{ar ? "الخزنة" : "Cash"}</span><b>{money("8,462", locale)}</b></div>
      <button type="button" tabIndex={-1}><Plus size={15}/>{ar ? "عملية جديدة" : "New operation"}</button>
    </div>
  </div>;
}

export function OwnerDashboardPreview({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const metrics = [
    [ar ? "ربح اليوم" : "Today profit", money("36", locale), "+100%"],
    [ar ? "حجم العمليات" : "Operation volume", money("3,580", locale), ar ? "5 ناجحة" : "5 successful"],
    [ar ? "الخزنة المتوقعة" : "Expected cash", money("8,462", locale), ar ? "وردية مفتوحة" : "Open shift"],
    [ar ? "عمليات معلقة" : "Pending operations", "2", ar ? "تحتاج مراجعة" : "Need review"],
  ];
  return <div className="marketing-browser marketing-owner-preview">
    <WindowBar label={ar ? "Hawally · مركز قيادة المالك" : "Hawally · Owner Command Center"}/>
    <div className="marketing-owner-head"><div><small>HAWALLY</small><h3>Hawally Demo Store</h3></div><div><span>{ar ? "سريع" : "Quick"}</span><span>{ar ? "تفصيلي" : "Detailed"}</span></div></div>
    <div className="marketing-owner-grid">{metrics.map(([label, value, note]) => <article key={label}><span>{label}</span><b>{value}</b><small>{note}</small></article>)}</div>
    <div className="marketing-owner-content">
      <article><header><b>{ar ? "صحة مقدمي الخدمة" : "Provider health"}</b><span>{ar ? "7 أرصدة" : "7 balances"}</span></header>{posProviders.slice(0, 4).map((provider, index) => <div className="marketing-health-row" key={provider.id}><i style={{ background: provider.color }}/><span>{ar ? provider.nameAr : provider.nameEn}</span><em>{index === 0 ? (ar ? "راقب الرصيد" : "Watch balance") : (ar ? "مستقر" : "Healthy")}</em></div>)}</article>
      <article><header><b>{ar ? "بطاقة إقفال اليوم" : "Daily close card"}</b><span>{ar ? "الآن" : "Now"}</span></header><p><CheckCircle2/>{ar ? "مطابقة أرصدة الخدمات" : "Provider balances reconciled"}</p><p><AlertTriangle/>{ar ? "عمليتان معلقتان" : "Two pending operations"}</p><p><Clock3/>{ar ? "قائمة الإغلاق تنتظر التنفيذ" : "Closing checklist is pending"}</p></article>
    </div>
  </div>;
}

export function AccountingPreview({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return <div className="marketing-browser marketing-accounting-preview">
    <WindowBar label={ar ? "Hawally · الدورة المحاسبية" : "Hawally · Accounting workflow"}/>
    <div className="marketing-accounting-body">
      <div className="marketing-entry-card"><span>{ar ? "قيد موحّد" : "Unified journal entry"}</span><b>JE-00428</b><small>{ar ? "متوازن · جاهز للمراجعة" : "Balanced · ready for review"}</small><div><i>{ar ? "مدين" : "Debit"}<b>11,400</b></i><i>{ar ? "دائن" : "Credit"}<b>11,400</b></i></div></div>
      <div className="marketing-report-card"><span>{ar ? "من القيد إلى التقارير" : "From entry to reporting"}</span>{[ar ? "الأستاذ العام" : "General ledger", ar ? "ميزان المراجعة" : "Trial balance", ar ? "القوائم المالية" : "Financial statements"].map((label, index) => <p key={label}><CheckCircle2/><b>{label}</b><small>{index === 0 ? "100%" : index === 1 ? "100%" : (ar ? "محدّثة" : "Updated")}</small></p>)}</div>
    </div>
  </div>;
}
