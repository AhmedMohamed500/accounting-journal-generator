"use client";

import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, CheckCircle2, CircleDollarSign, Clock3, ReceiptText, Sparkles, TrendingUp, WalletCards } from "lucide-react";
import { posOperationTypes, posProviders } from "@/data/pos";
import type { Locale, PosOperation, PosProviderId, PosShift } from "@/types";

type DashboardOverviewProps = {
  locale: Locale;
  storeName: string;
  cashierName: string;
  businessDate: string;
  expectedCash: number;
  expectedProviders: Record<PosProviderId, number>;
  revenue: number;
  expenses: number;
  profit: number;
  operationCount: number;
  operations: PosOperation[];
  shifts: PosShift[];
  onProviderSelect: (providerId: PosProviderId) => void;
};

const money = (value: number, locale: Locale) => `${value.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG", { maximumFractionDigits: 0 })} ${locale === "ar" ? "جنيه" : "EGP"}`;
const effective = (operation: PosOperation) => (operation.status || "successful") === "successful" && !operation.reversalOfOperationId;

export function ServicePointDashboardOverview(props: DashboardOverviewProps) {
  const { locale, storeName, cashierName, businessDate, expectedCash, expectedProviders, revenue, expenses, profit, operationCount, operations, shifts, onProviderSelect } = props;
  const ar = locale === "ar";
  const currentShift = shifts.find((shift) => shift.status === "open");
  const shiftOperations = currentShift ? operations.filter((operation) => operation.shiftId === currentShift.id) : operations;
  const successful = shiftOperations.filter(effective);
  const volume = successful.reduce((sum, operation) => sum + operation.amount, 0);
  const providerTotal = Object.values(expectedProviders).reduce((sum, value) => sum + value, 0);
  const liquidity = expectedCash + providerTotal;
  const pending = shiftOperations.filter((operation) => operation.status === "pending").length;
  const failed = shiftOperations.filter((operation) => operation.status === "failed").length;
  const successRate = shiftOperations.length ? Math.round((successful.length / shiftOperations.length) * 100) : 100;
  const lowProviders = posProviders.filter((provider) => expectedProviders[provider.id] < 1000);
  const newest = [...shiftOperations].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 5);
  const monthOperations = operations.filter((operation) => operation.businessDate.slice(0, 7) === new Date().toISOString().slice(0, 7) && effective(operation));
  const monthProfit = monthOperations.reduce((sum, operation) => sum + operation.profit, 0);
  const previousMonthProfit = operations.filter((operation) => {
    const date = new Date(`${operation.businessDate}T00:00:00`), now = new Date();
    return date.getFullYear() === new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear() && date.getMonth() === new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() && effective(operation);
  }).reduce((sum, operation) => sum + operation.profit, 0);
  const growth = previousMonthProfit > 0 ? Math.round(((monthProfit - previousMonthProfit) / previousMonthProfit) * 100) : monthProfit > 0 ? 100 : 0;

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat(ar ? "ar-EG" : "en", { weekday: "short" }).format(date),
      value: operations.filter((operation) => operation.businessDate === key && effective(operation)).reduce((sum, operation) => sum + operation.amount, 0),
    };
  });
  const maxDay = Math.max(...days.map((day) => day.value), 1);
  const chartPoints = days.map((day, index) => `${index * (600 / 6)},${170 - (day.value / maxDay) * 135}`).join(" ");
  const chartArea = `0,170 ${chartPoints} 600,170`;

  const distribution = posOperationTypes.map((type) => ({
    ...type,
    count: successful.filter((operation) => operation.type === type.id).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const distributionTotal = distribution.reduce((sum, item) => sum + item.count, 0) || 1;
  const donutColors = ["#1877f2", "#00c2a8", "#ff9f1a", "#ff3f65", "#7657ff", "#19a4d8", "#f7c928"];
  let donutCursor = 0;
  const donutStops = distribution.length ? distribution.map((item, index) => {
    const start = donutCursor;
    donutCursor += (item.count / distributionTotal) * 100;
    return `${donutColors[index % donutColors.length]} ${start}% ${donutCursor}%`;
  }).join(",") : "#dbeafe 0 100%";

  const cashiers = shifts.map((shift) => {
    const related = operations.filter((operation) => operation.shiftId === shift.id && effective(operation));
    return { name: shift.cashierName, profit: related.reduce((sum, operation) => sum + operation.profit, 0), count: related.length };
  }).reduce<Array<{ name: string; profit: number; count: number }>>((result, item) => {
    const existing = result.find((row) => row.name === item.name);
    if (existing) { existing.profit += item.profit; existing.count += item.count; }
    else result.push({ ...item });
    return result;
  }, []).sort((a, b) => b.profit - a.profit).slice(0, 3);

  const operationName = (operation: PosOperation) => {
    const item = posOperationTypes.find((type) => type.id === operation.type);
    return ar ? item?.nameAr : item?.nameEn;
  };
  const providerName = (id?: PosProviderId) => {
    const provider = posProviders.find((item) => item.id === id);
    return provider ? (ar ? provider.nameAr : provider.nameEn) : (ar ? "الخزنة" : "Cash");
  };
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return <section className="hawally-dashboard" aria-label={ar ? "لوحة قيادة نقطة الخدمات" : "Service point dashboard"}>
    <div className="hawally-dashboard-hero">
      <div className="hawally-hero-copy">
        <span className="hawally-eyebrow"><Sparkles size={15}/>{ar ? "وردية نشطة وجاهزة للعمل" : "Active shift, ready for business"}</span>
        <h1>{ar ? <>مستقبل أكبر<br/>لنقاط الخدمات</> : <>A bigger future<br/>for service points</>}</h1>
        <p>{ar ? `تابع ${storeName} وأرصدتك وأرباحك لحظة بلحظة من مكان واحد.` : `Track ${storeName}, balances, and profit from one place.`}</p>
        <a className="hawally-hero-cta" href="#new-operation">{ar ? "ابدأ عملية جديدة" : "Start a transaction"}<Arrow size={18}/></a>
      </div>
      <div className="hawally-storefront">
        <Image className="hawally-storefront-image" src="/hawally-service-point-banner.png" alt={ar ? "فرع حوّلي الحديث للخدمات المالية" : "Modern Hawally financial services branch"} fill priority sizes="(max-width: 860px) 100vw, 48vw"/>
        <span className="hawally-storefront-shade" aria-hidden="true"/>
      </div>
      <div className="hawally-hero-side">
        <TrendingUp size={31}/><b>{ar ? "خدمات أكثر، فرص أكبر" : "More services, more opportunities"}</b>
        <span>{ar ? "أرصدة واضحة" : "Clear balances"}</span><span>{ar ? "تقارير لحظية" : "Live reports"}</span><span>{ar ? "تشغيل محلي آمن" : "Secure local operation"}</span>
      </div>
    </div>

    <div className="hawally-section-heading"><div><h2>{ar ? "أعلى الخدمات استخدامًا" : "Most used services"}</h2><p>{ar ? "اضغط على أي خدمة لبدء عملية عليها" : "Choose a service to start a transaction"}</p></div><span>{cashierName} · {businessDate}</span></div>
    <div className="hawally-provider-strip">
      {posProviders.map((provider) => <button key={provider.id} className={`hawally-provider-tile provider-${provider.id}`} onClick={() => onProviderSelect(provider.id)}>
        <span className="hawally-provider-mark">{provider.id === "fawry" ? "F" : provider.id === "vodafone-cash" ? "V" : provider.id === "orange-cash" ? "O" : provider.id === "etisalat-cash" ? "e&" : provider.id === "instapay" ? "ipn" : provider.nameEn.charAt(0)}</span>
        <b>{ar ? provider.nameAr : provider.nameEn}</b><small>{money(expectedProviders[provider.id], locale)}</small>
      </button>)}
    </div>

    <div className="hawally-kpi-grid">
      <DashboardMetric icon={WalletCards} label={ar ? "إجمالي السيولة المتاحة" : "Total available liquidity"} value={money(liquidity, locale)} trend={providerTotal > 0 ? `${Math.round((expectedCash / liquidity) * 100)}% ${ar ? "نقدي" : "cash"}` : "—"}/>
      <DashboardMetric icon={ReceiptText} label={ar ? "عدد عمليات الوردية" : "Shift operations"} value={operationCount.toLocaleString(ar ? "ar-EG" : "en")} trend={`${successful.length} ${ar ? "ناجحة" : "successful"}`}/>
      <DashboardMetric icon={CircleDollarSign} label={ar ? "إجمالي حركة الوردية" : "Shift transaction volume"} value={money(volume, locale)} trend={`${revenue.toLocaleString(ar ? "ar-EG" : "en")} ${ar ? "عمولات" : "fees"}`}/>
      <DashboardMetric icon={Banknote} label={ar ? "صافي ربح الوردية" : "Shift net profit"} value={money(profit, locale)} trend={`${expenses.toLocaleString(ar ? "ar-EG" : "en")} ${ar ? "تكاليف" : "costs"}`}/>
    </div>

    <div className="hawally-analytics-grid">
      <article className="hawally-dashboard-card hawally-sales-chart">
        <header><div><h3>{ar ? "حركة العمليات هذا الأسبوع" : "This week's transactions"}</h3><p>{ar ? "القيمة الفعلية للعمليات الناجحة" : "Actual successful transaction volume"}</p></div><span className="hawally-period-pill">{ar ? "آخر ٧ أيام" : "Last 7 days"}</span></header>
        <div className="hawally-chart-value"><b>{money(days.reduce((sum, day) => sum + day.value, 0), locale)}</b><span className={growth >= 0 ? "positive" : "negative"}>{growth >= 0 ? "+" : ""}{growth}%</span></div>
        <div className="hawally-line-chart"><svg viewBox="0 0 600 190" role="img" aria-label={ar ? "رسم حركة العمليات الأسبوعية" : "Weekly transaction chart"} preserveAspectRatio="none"><defs><linearGradient id="hawallyChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1687ff" stopOpacity=".34"/><stop offset="1" stopColor="#1687ff" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d={`M ${chartArea.replaceAll(" ", " L ")} Z`}/><polyline points={chartPoints} fill="none"/><g>{days.map((day, index) => <circle key={day.key} cx={index * 100} cy={170 - (day.value / maxDay) * 135} r="5"/>)}</g></svg></div>
        <div className="hawally-chart-labels">{days.map((day) => <span key={day.key}>{day.label}</span>)}</div>
      </article>

      <article className="hawally-dashboard-card hawally-distribution-card">
        <header><div><h3>{ar ? "توزيع العمليات" : "Operation mix"}</h3><p>{ar ? "حسب نوع الخدمة" : "By service type"}</p></div></header>
        <div className="hawally-donut" style={{ background: `conic-gradient(${donutStops})` }}><div><b>{successful.length}</b><span>{ar ? "عملية" : "operations"}</span></div></div>
        <div className="hawally-donut-legend">{distribution.slice(0, 5).map((item, index) => <div key={item.id}><i style={{ background: donutColors[index % donutColors.length] }}/><span>{ar ? item.nameAr : item.nameEn}</span><b>{Math.round((item.count / distributionTotal) * 100)}%</b></div>)}</div>
      </article>

      <article className="hawally-dashboard-card hawally-recent-card">
        <header><div><h3>{ar ? "أحدث العمليات" : "Recent operations"}</h3><p>{ar ? "تحديث مباشر من الوردية" : "Live from this shift"}</p></div><a href="#operation-search">{ar ? "عرض الكل" : "View all"}</a></header>
        <div className="hawally-recent-list">{newest.length ? newest.map((operation) => <div key={operation.id}><span className={`hawally-operation-icon status-${operation.status || "successful"}`}>{(operation.status || "successful") === "successful" ? <CheckCircle2/> : <Clock3/>}</span><span><b>{operationName(operation)}</b><small>{providerName(operation.providerId)} · {new Date(operation.at).toLocaleTimeString(ar ? "ar-EG" : "en", { hour: "2-digit", minute: "2-digit" })}</small></span><strong>{money(operation.amount, locale)}</strong></div>) : <p className="hawally-empty-state">{ar ? "سجّل أول عملية لتظهر هنا" : "Record your first transaction"}</p>}</div>
      </article>
    </div>

    <div className="hawally-bottom-grid">
      <article className="hawally-dashboard-card hawally-progress-card"><div className="hawally-progress-ring" style={{ "--progress": `${successRate * 3.6}deg` } as React.CSSProperties}><span>{successRate}%</span></div><div><h3>{ar ? "جودة تنفيذ العمليات" : "Transaction quality"}</h3><p>{ar ? `${successful.length} عملية ناجحة من إجمالي ${shiftOperations.length}` : `${successful.length} successful out of ${shiftOperations.length}`}</p></div></article>
      <article className="hawally-dashboard-card hawally-growth-card"><TrendingUp/><div><h3>{ar ? "ربح الشهر حتى الآن" : "Month profit so far"}</h3><b>{money(monthProfit, locale)}</b><p>{growth >= 0 ? "+" : ""}{growth}% {ar ? "مقارنة بالشهر السابق" : "vs previous month"}</p></div></article>
      <article className="hawally-dashboard-card hawally-team-card"><header><h3>{ar ? "أداء فريق التشغيل" : "Team performance"}</h3></header>{cashiers.length ? cashiers.map((cashier, index) => <div key={cashier.name}><i>{index + 1}</i><span><b>{cashier.name}</b><small>{cashier.count} {ar ? "عملية" : "operations"}</small></span><strong>{money(cashier.profit, locale)}</strong></div>) : <p>{ar ? "لا توجد ورديات بعد" : "No shifts yet"}</p>}</article>
      <article className="hawally-dashboard-card hawally-alerts-card"><header><h3>{ar ? "التنبيهات المهمة" : "Important alerts"}</h3></header>{pending > 0 && <div><Clock3/><span>{pending} {ar ? "عملية معلقة تحتاج مراجعة" : "pending operations need review"}</span></div>}{failed > 0 && <div><AlertTriangle/><span>{failed} {ar ? "عملية فاشلة في الوردية" : "failed operations this shift"}</span></div>}{lowProviders.slice(0, 2).map((provider) => <div key={provider.id}><AlertTriangle/><span>{ar ? `رصيد ${provider.nameAr} منخفض` : `${provider.nameEn} balance is low`}</span></div>)}{pending === 0 && failed === 0 && lowProviders.length === 0 && <div className="all-clear"><CheckCircle2/><span>{ar ? "لا توجد تنبيهات حرجة الآن" : "No critical alerts right now"}</span></div>}</article>
    </div>
  </section>;
}

function DashboardMetric({ icon: Icon, label, value, trend }: { icon: typeof WalletCards; label: string; value: string; trend: string }) {
  return <article className="hawally-dashboard-kpi"><span><Icon/></span><div><small>{label}</small><b>{value}</b><em>{trend}</em></div></article>;
}
