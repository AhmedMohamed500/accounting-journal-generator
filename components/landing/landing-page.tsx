import Link from "next/link";
import {
  ArrowDown, ArrowLeft, ArrowRight, Calculator, Check, CheckCircle2,
  CircleDollarSign, ClipboardCheck, Clock3, CloudOff, FileCheck2, Gauge, HardDrive, Landmark,
  Languages, ListChecks, PackageCheck, ReceiptText, RefreshCcw, ShieldAlert, ShieldCheck,
  Smartphone, Store, WalletCards, Workflow, Zap,
} from "lucide-react";
import { posOperationTypes, posProviders } from "@/data/pos";
import { servicePointCommercialConfig } from "@/data/service-point-plans";
import { servicePointSalesDemoConfig as demo } from "@/data/service-point-sales-demo";
import { HawallyBrand } from "@/components/brand/hawally-brand";
import { HeroProductPreview, MobileProductPreview, OwnerDashboardPreview } from "@/components/marketing/product-previews";
import type { Locale } from "@/types";

type Copy = { ar: string; en: string };
const copy = (value: Copy, locale: Locale) => value[locale];
const DirectionArrow = ({ ar }: { ar: boolean }) => ar ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>;

const intelligence = [
  [ShieldAlert, { ar: "كشف تسريب الربح", en: "Profit Leakage" }],
  [WalletCards, { ar: "تحسين توزيع السيولة", en: "Liquidity Optimizer" }],
  [Gauge, { ar: "صحة أرصدة الخدمات", en: "Provider Health" }],
  [Calculator, { ar: "نقطة التعادل", en: "Break-even" }],
  [RefreshCcw, { ar: "مقارنة الورديات", en: "Shift Comparison" }],
  [FileCheck2, { ar: "الملخص اليومي الذكي", en: "Smart Daily Brief" }],
] as const;

const controls = [
  [WalletCards, { ar: "حركات المالك والمدير", en: "Owner & manager movements" }],
  [Calculator, { ar: "ميزانيات المصروفات", en: "Expense budgets" }],
  [ShieldAlert, { ar: "سجل الحوادث", en: "Incident log" }],
  [ClipboardCheck, { ar: "قوائم الفتح والإغلاق", en: "Opening / closing checklists" }],
  [Clock3, { ar: "الخط الزمني للوردية", en: "Shift timeline" }],
  [Landmark, { ar: "المطابقة الموحدة", en: "Unified reconciliation" }],
  [ListChecks, { ar: "مركز الاستثناءات", en: "Exception center" }],
  [PackageCheck, { ar: "حزمة المالك اليومية", en: "Daily owner pack" }],
] as const;

const shiftFlow: Copy[] = [
  { ar: "فتح الوردية", en: "Open shift" },
  { ar: "تأكيد الخزنة والأرصدة", en: "Confirm cash & balances" },
  { ar: "تسجيل العمليات", en: "Record operations" },
  { ar: "متابعة الربح والسيولة", en: "Track profit & liquidity" },
  { ar: "مراجعة المعلقة والفاشلة", en: "Review pending & failed" },
  { ar: "عد الخزنة والأرصدة", en: "Count cash & balances" },
  { ar: "التسوية", en: "Reconcile" },
  { ar: "الإقفال وتسليم الوردية", en: "Close & hand over" },
];

const providerMarks: Record<string, string> = {
  fawry: "F", "vodafone-cash": "V", "orange-cash": "O", "etisalat-cash": "e&",
  aman: "A", masary: "M", instapay: "IP",
};

const expectedCash = demo.openingCash + demo.fawry.amount + demo.fawry.customerFee + demo.vodafone.amount + demo.vodafone.customerFee;
const actualCash = expectedCash + demo.closingDifference;
const fawryBalance = demo.providerBalances.fawry - demo.fawry.amount - demo.fawry.providerCost;
const vodafoneBalance = demo.providerBalances["vodafone-cash"] - demo.vodafone.amount - demo.vodafone.providerCost;

export function LandingPage({ locale }: { locale: Locale }) {
  const ar = locale === "ar", demoHref = `/${locale}/service-point/demo`, serviceHref = `/${locale}/service-point`;
  return <div className="marketing-page">
    <section className="marketing-hero" id="product"><div className="marketing-grid-lines" aria-hidden="true"/><div className="container marketing-hero-grid">
      <div className="marketing-hero-copy"><span className="marketing-kicker"><Zap size={15}/>{ar ? "عمليات · أرصدة · ورديات · ربح" : "Operations · Balances · Shifts · Profit"}</span><h1>{ar ? <>من أول الوردية<br/><em>لحد إقفالها.</em></> : <>From shift opening<br/><em>to shift close.</em></>}</h1><p>{ar ? "عمليات فوري والمحافظ، الخزنة، الأرصدة، الربح والتسوية — في مكان واحد." : "Fawry and wallet operations, cash, balances, profit, and reconciliation — in one place."}</p><div className="marketing-actions"><Link className="btn btn-primary marketing-primary" href={demoHref}>{ar ? "جرّب حوّلي" : "Try Hawally"}<DirectionArrow ar={ar}/></Link><Link className="btn marketing-secondary" href={serviceHref}>{ar ? "استكشف النظام" : "Explore the system"}</Link></div><div className="marketing-hero-note"><ShieldCheck size={17}/><span>{ar ? "تجربة محلية بلا تسجيل. لا يوجد ربط رسمي مباشر بمقدمي الخدمة." : "A local demo with no signup. No official direct provider connection."}</span></div></div>
      <HeroProductPreview locale={locale}/>
    </div></section>

    <section className="marketing-trust" aria-label={ar ? "خصائص المنتج" : "Product characteristics"}><div className="container">{[[Store,{ar:"مصمم لنقاط الخدمات",en:"Built for service points"}],[Languages,{ar:"عربي + English",en:"Arabic + English"}],[Workflow,{ar:"RTL + LTR",en:"RTL + LTR"}],[Smartphone,{ar:"PWA قابلة للتثبيت",en:"Installable PWA"}],[HardDrive,{ar:"حفظ محلي",en:"Local-first"}],[ShieldCheck,{ar:"Light + Dark",en:"Light + Dark"}]].map(([Icon,label])=>{const FeatureIcon=Icon as typeof Store;return <span key={(label as Copy).en}><FeatureIcon size={18}/>{copy(label as Copy,locale)}</span>;})}</div></section>

    <section className="marketing-section marketing-service-section" id="services"><div className="container"><SectionHeading locale={locale} eyebrow={{ar:"الخدمات التي تديرها",en:"Services you manage"}} title={{ar:"كل خدمة برصيد مستقل وحركة واضحة",en:"Each provider has its own balance and movement"}} text={{ar:"حوّلي يسجل العمليات والأرصدة محليًا داخل المحل. الأسماء التالية خدمات مدعومة في التشغيل، وليست ادعاءً بوجود API رسمي.",en:"Hawally records operations and balances locally in the store. These are supported operating balances, not claims of official API integrations."}}/><div className="marketing-provider-grid marketing-provider-grid-wide">{posProviders.map(provider=><span key={provider.id} style={{"--provider":provider.color} as React.CSSProperties}><i aria-hidden="true">{providerMarks[provider.id]}</i><b>{ar?provider.nameAr:provider.nameEn}</b></span>)}</div></div></section>

    <section className="marketing-section" id="operations"><div className="container"><SectionHeading locale={locale} eyebrow={{ar:"العمليات اليومية",en:"Daily operations"}} title={{ar:"كل حركة تسجل أثرها الصحيح",en:"Every operation records the right impact"}} text={{ar:"قيمة العملية وحركة الخزنة ورصيد الخدمة والعمولة والتكلفة تظل منفصلة وقابلة للمراجعة.",en:"Transaction value, cash movement, provider balance, fee, and cost stay separate and reviewable."}}/><div className="marketing-operation-grid">{posOperationTypes.map((operation,index)=>{const icons=[ArrowRight,WalletCards,ReceiptText,Smartphone,RefreshCcw,Workflow,CircleDollarSign];const Icon=icons[index];return <article key={operation.id}><Icon/><b>{ar?operation.nameAr:operation.nameEn}</b><span>{String(index+1).padStart(2,"0")}</span></article>;})}</div></div></section>

    <section className="marketing-section marketing-workflow-section" id="how-it-works"><div className="container"><SectionHeading locale={locale} eyebrow={{ar:"كيف يعمل حوّلي؟",en:"How Hawally works"}} title={{ar:"دورة وردية كاملة بلا خطوات ضائعة",en:"A complete shift flow with no missing steps"}}/><div className="marketing-shift-flow">{shiftFlow.map((step,index)=><article key={step.en}><span>{String(index+1).padStart(2,"0")}</span><b>{copy(step,locale)}</b>{index<shiftFlow.length-1&&<ArrowDown/>}</article>)}</div></div></section>

    <section className="marketing-section" id="cash-control"><div className="container marketing-cash-control"><div><SectionHeading locale={locale} eyebrow={{ar:"الخزنة وأرصدة الخدمات",en:"Cash & provider control"}} title={{ar:"المتوقع والفعلي والفرق — لكل رصيد",en:"Expected, actual, and variance — for every balance"}} text={{ar:"عند الإقفال، يطابق حوّلي الخزنة وكل مقدم خدمة بصورة مستقلة، ثم يظهر الفرق للمراجعة قبل التسليم.",en:"At close, Hawally reconciles cash and every provider independently, then shows the variance for review before handover."}}/><Link className="marketing-text-link" href={`${serviceHref}#shift-actions`}>{ar?"افتح مطابقة الوردية":"Open shift reconciliation"}<DirectionArrow ar={ar}/></Link></div><div className="marketing-reconciliation-card"><header><b>{ar?"مطابقة الوردية":"Shift reconciliation"}</b><span>Hawally · Demo</span></header>{[[ar?"الخزنة":"Cash",expectedCash,actualCash,demo.closingDifference],["Fawry",fawryBalance,fawryBalance,0],["Vodafone Cash",vodafoneBalance,vodafoneBalance,0]].map(([name,expected,actual,variance])=><div key={name}><b>{name}</b><span><small>{ar?"متوقع":"Expected"}</small>{Number(expected).toLocaleString(ar?"ar-EG":"en-US")}</span><span><small>{ar?"فعلي":"Actual"}</small>{Number(actual).toLocaleString(ar?"ar-EG":"en-US")}</span><span className={Number(variance)!==0?"variance":""}><small>{ar?"الفرق":"Variance"}</small>{Number(variance).toLocaleString(ar?"ar-EG":"en-US")}</span></div>)}</div></div></section>

    <section className="marketing-section marketing-logic-section" id="profit"><div className="container marketing-logic-grid"><SectionHeading locale={locale} eyebrow={{ar:"الربح الحقيقي",en:"Real profit"}} title={{ar:"قيمة العملية ليست إيرادًا",en:"Transaction amount is not revenue"}} text={{ar:"حوّلي يفصل أصل المبلغ عن العمولة والتكلفة والمصروف حتى لا يبدو دوران الأموال وكأنه ربح.",en:"Hawally separates principal, customer fee, provider cost, and store expense so money movement never masquerades as profit."}}/><div className="marketing-equations"><div><span>{ar?"عمولة العميل":"Customer fee"}</span><i>−</i><span>{ar?"تكلفة مقدم الخدمة":"Provider cost"}</span><i>=</i><strong>{ar?"ربح العملية":"Operation profit"}</strong></div><div><span>{ar?"أرباح العمليات":"Operation profit"}</span><i>−</i><span>{ar?"مصروفات المحل":"Store expenses"}</span><i>=</i><strong>{ar?"الربح التشغيلي":"Operating profit"}</strong></div></div></div></section>

    <section className="marketing-section" id="owner"><div className="container marketing-showcase-grid"><OwnerDashboardPreview locale={locale}/><div><SectionHeading locale={locale} eyebrow={{ar:"لوحة المالك",en:"Owner dashboard"}} title={{ar:"صورة اليوم كاملة من شاشة واحدة",en:"The full day from one screen"}} text={{ar:"الربح، حجم العمليات، الخزنة، أرصدة الخدمات، المعلقة، الفروق، السيولة، أداء الكاشير والتنبيهات — مع حزمة يومية قابلة للطباعة.",en:"Profit, volume, cash, provider balances, pending operations, variances, liquidity, cashier performance, and alerts — with a printable daily owner pack."}}/><ul className="marketing-check-list">{(ar?["ربح وسيولة وأرصدة","المعلقة والفروق والتنبيهات","أداء الوردية والكاشير","Daily Owner Pack قابل للطباعة"]:["Profit, liquidity, and balances","Pending, variances, and alerts","Shift and cashier performance","Printable Daily Owner Pack"]).map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul><Link className="btn" href={`/${locale}/service-point/owner-dashboard`}>{ar?"استكشف لوحة المالك":"Explore owner dashboard"}<DirectionArrow ar={ar}/></Link></div></div></section>

    <section className="marketing-section" id="control"><div className="container"><div className="marketing-control-head"><SectionHeading locale={locale} eyebrow={{ar:"التحكم التشغيلي",en:"Operations control"}} title={{ar:"اليوم العادي والاستثناء في سجل واحد",en:"Routine work and exceptions in one record"}} text={{ar:"أدوات منفذة حاليًا داخل Service Point، ومحفوظة ضمن النسخة الاحتياطية المحلية لكل متجر.",en:"Tools implemented in the current Service Point and included in each store’s local backup."}}/><div className="marketing-mode-switch"><span>{ar?"صباحي":"Morning"}</span><span>{ar?"مسائي":"Evening"}</span></div></div><div className="marketing-control-grid">{controls.map(([Icon,label])=><article key={label.en}><span><Icon/></span><b>{copy(label,locale)}</b><CheckCircle2/></article>)}</div></div></section>

    <section className="marketing-section marketing-intelligence-section" id="intelligence"><div className="container"><SectionHeading locale={locale} eyebrow={{ar:"تحليلات محلية قائمة على قواعد",en:"Local rule-based intelligence"}} title={{ar:"مؤشرات مفهومة ويمكن تتبعها",en:"Clear indicators you can trace"}} text={{ar:"الحسابات تعمل من بيانات جهازك وقواعد المنتج. لا توجد خدمة ذكاء اصطناعي خارجية.",en:"Calculations run from your device data and product rules. There is no external AI service."}}/><div className="marketing-intelligence-grid">{intelligence.map(([Icon,label])=><article key={label.en}><Icon/><b>{copy(label,locale)}</b></article>)}</div></div></section>

    <section className="marketing-section marketing-pwa-section" id="mobile"><div className="container marketing-pwa-grid"><div><span className="marketing-kicker"><Smartphone/>{ar?"واجهة الهاتف وPWA":"Mobile UI & PWA"}</span><h2>{ar?"شغّل حوّلي من شاشة المحل أو الهاتف":"Run Hawally on the counter or phone"}</h2><p>{ar?"واجهة متجاوبة ولمس مريح، مع PWA قابلة للتثبيت وOffline shell. التثبيت لا يضيف مزامنة بين الأجهزة؛ البيانات محلية في النسخة الحالية.":"A responsive, touch-friendly interface with an installable PWA and offline shell. Installation does not add cross-device sync; data remains local in the current edition."}</p><div className="marketing-hero-note"><CloudOff size={17}/><span>{ar?"لا توجد مزامنة سحابية أو ربط مباشر بمقدمي الخدمة.":"No cloud sync or direct provider connection."}</span></div></div><MobileProductPreview locale={locale}/></div></section>

    <section className="marketing-section" id="plans"><div className="container"><SectionHeading locale={locale} eyebrow={{ar:"باقات Service Point",en:"Service Point plans"}} title={{ar:"اختر الحجم المناسب لتشغيل محلك",en:"Choose the level that fits your operation"}} text={{ar:`الأسعار والحدود من إعداد المنتج الحالي. التفعيل يدوي ولا توجد بوابة دفع داخل النسخة الحالية. الاشتراك السنوي يوفر شهرين.`,en:`Prices and limits come from the current product configuration. Activation is manual and there is no in-product checkout. Annual billing includes ${servicePointCommercialConfig.annualFreeMonths} free months.`}}/><div className="marketing-pricing-grid">{servicePointCommercialConfig.plans.map(plan=><article className={plan.featured?"featured":""} key={plan.id}>{plan.featured&&<span className="marketing-popular">{ar?"الأكثر اختيارًا":"Most popular"}</span>}<h3>{ar?plan.nameAr:plan.nameEn}</h3><div><strong>{plan.monthlyPrice.toLocaleString(ar?"ar-EG":"en-US")}</strong><span>{ar?"ج.م / شهر":"EGP / month"}</span></div><p>{ar?`${plan.storeLimit} محل · ${plan.userLimit} مستخدم محلي`:`${plan.storeLimit} store${plan.storeLimit>1?"s":""} · ${plan.userLimit} local users`}</p><ul>{(ar?plan.featuresAr:plan.featuresEn).slice(0,3).map(feature=><li key={feature}><Check/>{feature}</li>)}</ul><Link className={`btn ${plan.featured?"btn-primary":""}`} href={`/${locale}/service-point/plans`}>{ar?"راجع الباقة":"Review plan"}</Link></article>)}</div></div></section>

    <section className="marketing-final"><div className="container"><div><span>{ar?"ابدأ يوم عمل كامل":"Run a complete workday"}</span><h2>{ar?"من أول الوردية لحد إقفالها.":"From shift opening to shift close."}</h2><p>{ar?"جرّب العمليات والأرصدة والربح والتسوية ولوحة المالك ببيانات Demo جاهزة.":"Try operations, balances, profit, reconciliation, and owner control with ready demo data."}</p></div><div className="marketing-actions"><Link className="btn btn-primary" href={demoHref}>{ar?"جرّب حوّلي":"Try Hawally"}<DirectionArrow ar={ar}/></Link><Link className="btn" href={serviceHref}>{ar?"استكشف النظام":"Explore the system"}</Link></div></div></section>

    <footer className="marketing-footer"><div className="container marketing-footer-minimal"><div><HawallyBrand locale={locale} href={`/${locale}`}/><p>{ar?"تشغيل نقاط الخدمات من الوردية حتى التسوية ورقابة المالك.":"Service point operations from shift opening to reconciliation and owner control."}</p></div><nav><Link href={demoHref}>{ar?"الديمو":"Demo"}</Link><Link href={`/${locale}/service-point/plans`}>{ar?"الباقات":"Plans"}</Link><Link href={`/${locale}/privacy`}>{ar?"الخصوصية":"Privacy"}</Link><Link href={`/${ar?"en":"ar"}`}>{ar?"English":"العربية"}<Languages size={15}/></Link></nav></div><div className="container marketing-footer-bottom"><span>© 2026 Hawally · حوّلي</span><span>{ar?"بيانات محلية في النسخة الحالية":"Local data in the current edition"}</span></div></footer>
  </div>;
}

function SectionHeading({ locale, eyebrow, title, text }: { locale: Locale; eyebrow: Copy; title: Copy; text?: Copy }) {
  return <header className="marketing-heading"><span>{copy(eyebrow,locale)}</span><h2>{copy(title,locale)}</h2>{text&&<p>{copy(text,locale)}</p>}</header>;
}
