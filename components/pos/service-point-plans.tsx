"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Cloud, Copy, Crown, ShieldCheck, Sparkles, X } from "lucide-react";
import { servicePointCommercialConfig } from "@/data/service-point-plans";
import { activationRequestCode, planPrice } from "@/lib/pos/demo";
import { appendLocalAudit, loadLocalSubscription, loadServicePointSettings, saveLocalSubscription } from "@/lib/storage/service-point-demo";
import type { Locale } from "@/types";
import type { PlanId } from "@/types/service-point-demo";

export function ServicePointPlans({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [selected, setSelected] = useState<PlanId>();
  const [code, setCode] = useState("");
  const plans = servicePointCommercialConfig.plans;
  const chosen = useMemo(() => plans.find((item) => item.id === selected), [plans, selected]);
  const choose = (id: PlanId) => { setSelected(id); setCode(activationRequestCode(id)); };
  const copyRequest = async () => { if (!chosen) return; const business = loadServicePointSettings().businessName || "FINORA Local Demo", text = `FINORA Subscription Request\nBusiness: ${business}\nPlan: ${chosen.nameEn}\nCycle: ${cycle}\nRequest Code: ${code}`; await copyWithFallback(text); };

  return <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-3 py-8 text-slate-950" dir={ar ? "rtl" : "ltr"}>
    <div className="mx-auto max-w-6xl">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-900"><Crown size={17}/>FINORA Service Point</span>
        <h1 className="mt-5 text-3xl font-black sm:text-5xl">{ar ? "باقة واضحة لكل مرحلة من نموك" : "A clear plan for every stage"}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">{ar ? "هذه تجربة بيع محلية. لا يوجد دفع إلكتروني الآن؛ التفعيل يتم يدويًا بعد التواصل مع FINORA." : "This is a local sales demo. There is no online payment; activation is currently manual."}</p>
        <div className="mx-auto mt-7 inline-flex max-w-full rounded-2xl bg-white p-1 shadow">
          <button onClick={() => setCycle("monthly")} className={`rounded-xl px-4 py-3 font-bold sm:px-6 ${cycle === "monthly" ? "bg-[#0f315d] text-white" : ""}`}>{ar ? "شهري" : "Monthly"}</button>
          <button onClick={() => setCycle("annual")} className={`rounded-xl px-4 py-3 font-bold sm:px-6 ${cycle === "annual" ? "bg-[#0f315d] text-white" : ""}`}>{ar ? "سنوي — وفر شهرين" : "Annual — save 2 months"}</button>
        </div>
      </header>
      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => <article key={plan.id} className={`relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-white p-6 shadow-sm ${plan.featured ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200"}`}>
          {plan.featured && <span className="absolute -top-3 start-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{ar ? "الأكثر اختيارًا" : "Most popular"}</span>}
          <h2 className="mt-2 text-2xl">{ar ? plan.nameAr : plan.nameEn}</h2>
          <div className="mt-5"><strong className="text-4xl">{planPrice(plan, cycle).toLocaleString()}</strong><span className="ms-2 text-slate-500">{ar ? "ج.م" : "EGP"} / {cycle === "monthly" ? (ar ? "شهر" : "month") : (ar ? "سنة" : "year")}</span></div>
          <ul className="my-7 grid flex-1 gap-3">{(ar ? plan.featuresAr : plan.featuresEn).map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="shrink-0 text-emerald-600" size={18}/>{feature}</li>)}</ul>
          <button className={`btn ${plan.featured ? "btn-primary" : ""}`} onClick={() => choose(plan.id)}>{ar ? "اختيار الباقة" : "Choose plan"}</button>
        </article>)}
      </section>
      <section className="mt-10 rounded-3xl bg-gradient-to-l from-[#0f315d] to-[#176b78] p-7 text-white">
        <Cloud size={30}/><div className="mt-4 flex flex-wrap items-start justify-between gap-5"><div><span className="rounded-full bg-white/15 px-3 py-1 text-xs">{ar ? "يتطلب التفعيل السحابي" : "Cloud activation required"}</span><h2 className="mt-4 text-2xl text-white">Cloud Edition</h2><p className="mt-2 max-w-3xl leading-8 text-white/75">{ar ? "مزامنة بين الأجهزة، دخول آمن، نسخ احتياطي تلقائي، سجل مركزي، ولوحة مالك عن بُعد. هذه الخصائص معروضة كمسار ترقية وليست مفعلة في Demo Edition." : "Multi-device sync, secure login, automatic backup, central audit, and remote owner access. These are upgrade previews, not active demo features."}</p></div><ShieldCheck size={44}/></div>
      </section>
      <div className="mt-8 text-center"><Link className="btn" href={`/${locale}/service-point`}>{ar ? "العودة إلى نقطة الخدمات" : "Back to Service Point"}</Link></div>
    </div>
    {chosen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-3">
      <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex justify-between"><div><small className="text-blue-700">{ar ? "طلب تفعيل يدوي" : "Manual activation request"}</small><h2 className="mt-1">{ar ? chosen.nameAr : chosen.nameEn}</h2></div><button onClick={() => setSelected(undefined)}><X/></button></div>
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4"><span>{ar ? "شهري" : "Monthly"}<b className="block">{chosen.monthlyPrice.toLocaleString()} {ar ? "ج.م" : "EGP"}</b></span><span>{ar ? "سنوي" : "Annual"}<b className="block">{planPrice(chosen, "annual").toLocaleString()} {ar ? "ج.م" : "EGP"}</b></span></div>
        <p className="mt-5 text-sm leading-7 text-slate-600">{ar ? "للتفعيل تواصل مع FINORA وأرسل كود الطلب التالي. هذا الكود تجربة بيع وليس نظام ترخيص أمنيًا." : "Contact FINORA and send this request code. It is a sales aid, not a secure license."}</p>
        <button className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-blue-400 bg-blue-50 p-4 font-mono font-bold text-blue-950" onClick={copyRequest}><span dir="ltr">{code}</span><span className="flex items-center gap-2 font-sans text-xs"><Copy size={18}/>{ar?"نسخ طلب الاشتراك":"Copy request"}</span></button>
        <button className="btn btn-primary mt-5 w-full" onClick={() => { const subscription = loadLocalSubscription(); saveLocalSubscription({ ...subscription, currentPlan: chosen.id, billingCycle: cycle, subscriptionStatus: "active-demo", activationCode: code }); appendLocalAudit("select-plan", "subscription", `${chosen.id} ${cycle} — ${code}`); setSelected(undefined); }}><Sparkles/>{ar ? "معاينة التفعيل اليدوي" : "Preview manual activation"}</button>
        <p className="mt-3 text-center text-xs text-amber-700">{ar ? "لا توجد بوابة دفع أو عملية تحصيل داخل هذه النسخة." : "No payment gateway or charge is made in this edition."}</p>
      </section>
    </div>}
  </main>;
}

async function copyWithFallback(text:string){try{await navigator.clipboard.writeText(text);return true;}catch{const area=document.createElement("textarea");area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();const copied=document.execCommand("copy");area.remove();return copied;}}
