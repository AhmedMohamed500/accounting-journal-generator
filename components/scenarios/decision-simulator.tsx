"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, GitCompareArrows, PlayCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { simulateDecision } from "@/lib/accounting/scenario-simulator";
import { treasuryAccounts, treasuryBalances } from "@/lib/accounting/treasury";
import { itemOutstanding } from "@/lib/parties/aging";
import { loadAccounts, loadEntries, saveEntry } from "@/lib/storage/accounting";
import { loadOpenItems } from "@/lib/storage/parties";
import { generateJournalEntry } from "@/rules";
import type { ChartAccount, DecisionAlternative, DecisionType, Locale, OpenItem, ScenarioHorizons } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => { const value = new Date(date); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };
const money = (value: number, locale: Locale) => value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });

function projectedBaseline(current: number, items: OpenItem[]): ScenarioHorizons {
  const asOf = today();
  const at = (days: number) => {
    const end = addDays(asOf, days);
    const movement = items.filter((item) => item.status !== "paid" && item.dueDate >= asOf && item.dueDate <= end).reduce((sum, item) => sum + itemOutstanding(item) * (item.kind === "receivable" ? 1 : -1), 0);
    return Math.round((current + movement) * 100) / 100;
  };
  return { now: current, day7: at(7), day30: at(30), day90: at(90) };
}

function Bi({ ar, en, locale }: { ar: string; en: string; locale: Locale }) {
  return locale === "ar" ? <>{ar} <small className="muted" dir="ltr">· {en}</small></> : <>{en}</>;
}

export function DecisionSimulator({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [decisionType, setDecisionType] = useState<DecisionType>("purchase");
  const [amount, setAmount] = useState(50000);
  const [vatRate, setVatRate] = useState(14);
  const [cashDiscountRate, setCashDiscountRate] = useState(2);
  const [creditDays, setCreditDays] = useState<30 | 60 | 90>(30);
  const [minimumReserve, setMinimumReserve] = useState(20000);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [paymentAccountCode, setPaymentAccountCode] = useState("1110");
  const [baseline, setBaseline] = useState<ScenarioHorizons>({ now: 0, day7: 0, day30: 0, day90: 0 });
  const [selectedId, setSelectedId] = useState<DecisionAlternative["id"]>("cash");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadedAccounts = loadAccounts(), treasury = treasuryAccounts(loadedAccounts), entries = loadEntries();
    const balances = treasuryBalances(entries, treasury), current = balances.reduce((sum, row) => sum + row.balance, 0);
    setAccounts(treasury);
    if (!treasury.some((account) => account.code === paymentAccountCode) && treasury[0]) setPaymentAccountCode(treasury[0].code);
    setBaseline(projectedBaseline(current, loadOpenItems()));
  }, [paymentAccountCode]);

  const paymentAccount = accounts.find((account) => account.code === paymentAccountCode);
  const simulation = useMemo(() => {
    try {
      return simulateDecision({ decisionType, amount, vatRate, cashDiscountRate, creditDays, minimumReserve, currency: "EGP", baselineCash: baseline, paymentAccountCode, paymentAccountNameAr: paymentAccount?.nameAr, paymentAccountNameEn: paymentAccount?.nameEn });
    } catch { return undefined; }
  }, [decisionType, amount, vatRate, cashDiscountRate, creditDays, minimumReserve, baseline, paymentAccountCode, paymentAccount]);
  useEffect(() => { if (simulation) setSelectedId(simulation.recommendedId); }, [simulation]);
  const selected = simulation?.alternatives.find((alternative) => alternative.id === selectedId) || simulation?.alternatives[0];
  const previewEntries = selected?.entries.map((entry) => generateJournalEntry(entry)) || [];

  const execute = () => {
    if (!selected) return;
    try {
      const saved = selected.entries.map((input) => saveEntry({ ...generateJournalEntry({ ...input, date: today() }), workflowStatus: "draft" }));
      setNotice(ar ? `تم إنشاء ${saved.length} ${saved.length > 1 ? "مسودات قيود" : "مسودة قيد"} للبديل المختار. راجعها واعتمدها قبل الترحيل.` : `${saved.length} draft ${saved.length > 1 ? "entries" : "entry"} created. Review and approve before posting.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : (ar ? "تعذر إنشاء المسودة." : "Could not create the draft.")); }
  };

  return <div className="grid scenario-simulator">
    <section className="card no-print">
      <h2><Sparkles size={21}/><Bi ar="بيانات القرار" en="Decision inputs" locale={locale}/></h2>
      <div className="grid four">
        <label><Bi ar="نوع القرار" en="Decision type" locale={locale}/><select value={decisionType} onChange={(event) => setDecisionType(event.target.value as DecisionType)}><option value="purchase">{ar ? "شراء مخزون · Inventory purchase" : "Inventory purchase"}</option><option value="sale">{ar ? "بيع · Sale" : "Sale"}</option><option value="expense">{ar ? "مصروف صيانة · Maintenance expense" : "Maintenance expense"}</option><option value="fixed-asset">{ar ? "شراء أصل ثابت · Fixed asset" : "Fixed asset purchase"}</option></select></label>
        <label><Bi ar="القيمة قبل الضريبة" en="Net amount" locale={locale}/><input type="number" min="1" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))}/></label>
        <label><Bi ar="ضريبة القيمة المضافة %" en="VAT rate %" locale={locale}/><input type="number" min="0" max="100" value={vatRate} onChange={(event) => setVatRate(Number(event.target.value))}/></label>
        <label><Bi ar="خصم السداد النقدي %" en="Cash discount %" locale={locale}/><input type="number" min="0" max="100" value={cashDiscountRate} onChange={(event) => setCashDiscountRate(Number(event.target.value))}/></label>
        <label><Bi ar="مدة الآجل" en="Credit term" locale={locale}/><select value={creditDays} onChange={(event) => setCreditDays(Number(event.target.value) as 30 | 60 | 90)}><option value="30">30 {ar ? "يومًا" : "days"}</option><option value="60">60 {ar ? "يومًا" : "days"}</option><option value="90">90 {ar ? "يومًا" : "days"}</option></select></label>
        <label><Bi ar="حد السيولة الآمن" en="Minimum cash reserve" locale={locale}/><input type="number" min="0" step="100" value={minimumReserve} onChange={(event) => setMinimumReserve(Number(event.target.value))}/></label>
        <label><Bi ar="حساب الصندوق أو البنك" en="Cash / bank account" locale={locale}/><select value={paymentAccountCode} onChange={(event) => setPaymentAccountCode(event.target.value)}>{accounts.map((account) => <option value={account.code} key={account.id}>{account.code} — {ar ? `${account.nameAr} · ${account.nameEn}` : account.nameEn}</option>)}</select></label>
        <article className="scenario-baseline"><span className="muted"><Bi ar="السيولة الحالية الفعلية" en="Current posted liquidity" locale={locale}/></span><strong>{money(baseline.now, locale)} EGP</strong><small className="muted">{ar ? "من القيود المرحلة فقط" : "Posted entries only"}</small></article>
      </div>
    </section>

    {!simulation ? <p className="warning"><AlertTriangle size={18}/>{ar ? "أدخل مبلغًا صحيحًا أكبر من صفر." : "Enter a valid amount greater than zero."}</p> : <>
      <section>
        <div className="scenario-heading"><div><h2><GitCompareArrows size={22}/><Bi ar="مقارنة البدائل" en="Alternative comparison" locale={locale}/></h2><p className="muted">{ar ? "النتائج مبنية على الأرصدة المرحلة والاستحقاقات المفتوحة المسجلة بالموقع." : "Results use posted balances and open due items recorded in the app."}</p></div><span className="badge"><Sparkles size={14}/>{ar ? "ترشيح آلي قابل للمراجعة" : "Reviewable smart recommendation"}</span></div>
        <div className="grid three">{simulation.alternatives.map((alternative) => <button type="button" className={`card scenario-choice ${selectedId === alternative.id ? "selected" : ""}`} key={alternative.id} onClick={() => setSelectedId(alternative.id)} aria-pressed={selectedId === alternative.id}>
          <div className="scenario-choice-top"><span className={`badge risk-${alternative.risk}`}>{alternative.risk === "low" ? (ar ? "مخاطر منخفضة" : "Low risk") : alternative.risk === "medium" ? (ar ? "مخاطر متوسطة" : "Medium risk") : (ar ? "مخاطر مرتفعة" : "High risk")}</span>{alternative.recommended && <span className="badge recommended"><CheckCircle2 size={14}/>{ar ? "الأنسب" : "Recommended"}</span>}</div>
          <h3>{ar ? alternative.titleAr : alternative.titleEn}</h3><p className="muted">{ar ? alternative.descriptionAr : alternative.descriptionEn}</p>
          <div className="scenario-score"><strong>{alternative.score}/100</strong><span>{ar ? "درجة القرار" : "Decision score"}</span></div>
          <div className="scenario-mini"><span>{ar ? "أقل سيولة" : "Minimum cash"}<b>{money(alternative.minimumProjectedCash, locale)}</b></span><span>{ar ? "فجوة الأمان" : "Reserve gap"}<b className={alternative.reserveGap ? "negative" : "positive"}>{money(alternative.reserveGap, locale)}</b></span></div>
        </button>)}</div>
      </section>

      <section className="card"><h2><TrendingUp size={21}/><Bi ar="حركة السيولة المتوقعة" en="Projected liquidity path" locale={locale}/></h2><CashChart alternatives={simulation.alternatives} reserve={minimumReserve} locale={locale}/></section>

      <section className="card"><h2><GitCompareArrows size={21}/><Bi ar="الأثر المالي المقارن" en="Comparative financial impact" locale={locale}/></h2><div className="table-wrap"><table><thead><tr><th>{ar ? "البديل · Alternative" : "Alternative"}</th><th>{ar ? "السيولة 7 أيام · Cash 7d" : "Cash 7d"}</th><th>{ar ? "السيولة 30 يومًا · Cash 30d" : "Cash 30d"}</th><th>{ar ? "السيولة 90 يومًا · Cash 90d" : "Cash 90d"}</th><th>{ar ? "الربح · Profit" : "Profit"}</th><th>{ar ? "الضريبة · VAT" : "VAT"}</th><th>{ar ? "الالتزام/التحصيل الآجل · Credit exposure" : "Credit exposure"}</th></tr></thead><tbody>{simulation.alternatives.map((alternative) => <tr key={alternative.id} className={alternative.recommended ? "recommended-row" : ""}><td><b>{ar ? alternative.titleAr : alternative.titleEn}</b></td><td>{money(alternative.projectedCash.day7, locale)}</td><td>{money(alternative.projectedCash.day30, locale)}</td><td>{money(alternative.projectedCash.day90, locale)}</td><td className={(alternative.financialImpact.profit || 0) < 0 ? "negative" : "positive"}>{money(alternative.financialImpact.profit, locale)}</td><td>{alternative.vatEffect > 0 ? "+" : ""}{money(alternative.vatEffect, locale)}</td><td>{money(alternative.collectionExposure + alternative.obligationExposure, locale)}</td></tr>)}</tbody></table></div><p className="muted"><small>{ar ? "الضريبة الموجبة = ضريبة مخرجات مستحقة، والسالبة = ضريبة مدخلات قابلة للاسترداد أو الخصم." : "Positive VAT is output tax payable; negative VAT is recoverable input tax."}</small></p></section>

      {selected && <section className="grid two scenario-detail">
        <article className="card"><h2><ShieldCheck size={21}/><Bi ar="لماذا هذه النتيجة؟" en="Why this result?" locale={locale}/></h2><h3>{ar ? selected.titleAr : selected.titleEn}</h3><ul>{(ar ? selected.reasonsAr : selected.reasonsEn).map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="grid two"><Impact label={ar ? "الأصول · Assets" : "Assets"} value={selected.financialImpact.assets} locale={locale}/><Impact label={ar ? "الالتزامات · Liabilities" : "Liabilities"} value={selected.financialImpact.liabilities} locale={locale}/><Impact label={ar ? "حقوق الملكية · Equity" : "Equity"} value={selected.financialImpact.equity} locale={locale}/><Impact label={ar ? "الربح · Profit" : "Profit"} value={selected.financialImpact.profit} locale={locale}/></div></article>
        <article className="card"><h2><PlayCircle size={21}/><Bi ar="القيود التي ستُنشأ" en="Draft entries to create" locale={locale}/></h2>{previewEntries.map((entry) => <div className="scenario-entry" key={entry.id}><b>{ar ? `${entry.titleAr} · ${entry.titleEn}` : entry.titleEn}</b>{entry.lines.map((line) => <span key={line.id}><span>{line.accountCode} — {ar ? `${line.accountNameAr} · ${line.accountNameEn}` : line.accountNameEn}</span><strong>{line.debit ? (ar ? `مدين · Debit ${money(line.debit, locale)}` : `Debit ${money(line.debit, locale)}`) : (ar ? `دائن · Credit ${money(line.credit, locale)}` : `Credit ${money(line.credit, locale)}`)}</strong></span>)}</div>)}<button className="btn btn-primary" onClick={execute}><PlayCircle size={18}/>{ar ? "تنفيذ البديل وإنشاء مسودة القيد" : "Execute option and create draft entry"}</button><p className="muted"><small>{ar ? "لن يتغير الرصيد الرسمي إلا بعد المراجعة والاعتماد والترحيل." : "Official balances change only after review, approval, and posting."}</small></p></article>
      </section>}
      {notice && <p className="warning"><CheckCircle2 size={18}/>{notice}</p>}
    </>}
  </div>;
}

function Impact({ label, value, locale }: { label: string; value: number; locale: Locale }) { return <div className="scenario-impact"><span className="muted">{label}</span><b className={value < 0 ? "negative" : value > 0 ? "positive" : ""}>{value > 0 ? "+" : ""}{money(value, locale)} EGP</b></div>; }

function CashChart({ alternatives, reserve, locale }: { alternatives: DecisionAlternative[]; reserve: number; locale: Locale }) {
  const ar = locale === "ar", labels = [ar ? "الآن" : "Now", ar ? "7 أيام" : "7 days", ar ? "30 يومًا" : "30 days", ar ? "90 يومًا" : "90 days"], keys: (keyof ScenarioHorizons)[] = ["now", "day7", "day30", "day90"];
  const values = alternatives.flatMap((alternative) => keys.map((key) => alternative.projectedCash[key])).concat(reserve), min = Math.min(0, ...values), max = Math.max(1, ...values), range = Math.max(1, max - min);
  const x = (index: number) => 76 + index * 210, y = (value: number) => 220 - (value - min) / range * 170;
  return <div className="scenario-chart-wrap"><svg className="scenario-chart" viewBox="0 0 760 260" role="img" aria-label={ar ? "رسم مقارنة السيولة المتوقعة للبدائل خلال 90 يومًا" : "Projected cash comparison across alternatives over 90 days"}><title>{ar ? "السيولة المتوقعة" : "Projected liquidity"}</title>
    {[0, .5, 1].map((ratio) => { const value = min + range * ratio; return <g key={ratio}><line x1="76" y1={y(value)} x2="706" y2={y(value)} className="chart-grid"/><text x="66" y={y(value) + 4} textAnchor="end">{money(value, locale)}</text></g>; })}
    <line x1="76" y1={y(reserve)} x2="706" y2={y(reserve)} className="reserve-line"/><text x="706" y={Math.max(14, y(reserve) - 7)} textAnchor="end">{ar ? "حد الأمان" : "Safety reserve"} {money(reserve, locale)}</text>
    {labels.map((label, index) => <text key={label} x={x(index)} y="247" textAnchor="middle">{label}</text>)}
    {alternatives.map((alternative) => { const points = keys.map((key, index) => `${x(index)},${y(alternative.projectedCash[key])}`).join(" "); return <g key={alternative.id} className={`series-${alternative.id}`}><polyline points={points}/>{keys.map((key, index) => <circle key={key} cx={x(index)} cy={y(alternative.projectedCash[key])} r="5"><title>{`${ar ? alternative.titleAr : alternative.titleEn}: ${money(alternative.projectedCash[key], locale)} EGP`}</title></circle>)}</g>; })}
  </svg><div className="scenario-legend">{alternatives.map((alternative) => <span key={alternative.id} className={`series-${alternative.id}`}><i/>{ar ? alternative.titleAr : alternative.titleEn}</span>)}</div></div>;
}
