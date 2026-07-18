"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BookOpenCheck, FileCheck2, FileText, Filter, GraduationCap, Landmark, ReceiptText, Search, Workflow } from "lucide-react";
import { accountGuideCategories, accountLearningGuide, type AccountLearningGuideItem } from "@/data/account-learning-guide";
import type { Locale } from "@/types";

const documentCycle = [
  ["01", "المستند الأصلي", "فاتورة أو سند أو عقد يثبت أن العملية حدثت فعلًا."],
  ["02", "المراجعة والاعتماد", "فحص التاريخ والطرف والمبلغ والصلاحية ومنع التكرار."],
  ["03", "التحليل المحاسبي", "تحديد الحسابات المتأثرة ونوعها وهل زادت أم انخفضت."],
  ["04", "قيد اليومية", "إثبات المدين والدائن مع المرجع والمستند والتاريخ."],
  ["05", "الترحيل للأستاذ", "تجميع حركة كل حساب وحساب رصيده الجاري."],
  ["06", "ميزان المراجعة", "التأكد من تساوي الأرصدة المدينة والدائنة وتحليل الشذوذ."],
  ["07", "القوائم المالية", "نقل الأرصدة للدخل والمركز المالي والتدفقات النقدية."],
  ["08", "المراجعة والإقفال", "المطابقات والتسويات والاعتماد ثم قفل الفترة."],
];

export function AccountGuide({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("assets");
  const rows = useMemo(() => accountLearningGuide.filter((account) => {
    const matchesCategory = category === "all" || account.category === category;
    const text = `${account.nameAr} ${account.nameEn} ${account.categoryAr} ${account.code}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  }), [category, query]);

  return <main className="min-h-screen bg-daftar-bg pb-20">
    <section className="border-b border-daftar-line bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_9%,var(--bg)),var(--bg))] py-14">
      <div className="container">
        <Link className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-daftar-primary" href={`/${locale}/academy`}><GraduationCap size={18}/>{ar ? "العودة للأكاديمية" : "Back to academy"}</Link>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div><span className="academy-kicker"><BookOpenCheck/>{ar ? "المرجع المحاسبي الشامل" : "Complete accounting reference"}</span><h1 className="my-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{ar ? "افهم طبيعة كل حساب قبل ما تعمل أي قيد" : "Understand every account before posting an entry"}</h1><p className="max-w-3xl text-lg leading-8 text-daftar-muted">{ar ? "مرجع عملي يشرح طبيعة الحساب والزيادة والنقص والقيد ومكان الظهور في القوائم، بدون خلط بين الشرح والمثال." : "A practical reference for normal balance, movement, journal examples, and statement impact."}</p></div>
          <div className="rounded-2xl border border-daftar-line bg-daftar-card p-6 shadow-lg"><b className="text-4xl text-daftar-primary">{accountLearningGuide.length}</b><p className="mt-2 font-bold">{ar ? "حسابًا مشروحًا بالتأثير والدورة المستندية" : "accounts explained end to end"}</p></div>
        </div>
      </div>
    </section>

    <section className="container py-12">
      <div className="mb-8"><span className="text-sm font-black text-daftar-primary">{ar ? "الصورة الكاملة" : "The full picture"}</span><h2 className="mt-2 text-3xl font-black">{ar ? "أي عملية محاسبية بتمشي في الطريق ده" : "Every transaction follows this path"}</h2></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{documentCycle.map(([number,title,text], index) => <article className="relative rounded-2xl border border-daftar-line bg-daftar-card p-5" key={number}><span className="text-xs font-black tracking-widest text-daftar-primary">{number}</span><FileCheck2 className="my-4 text-daftar-primary"/><h3 className="text-lg font-black">{ar ? title : title}</h3><p className="mt-2 text-sm leading-7 text-daftar-muted">{text}</p>{index < documentCycle.length - 1 && <i className="absolute -left-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-daftar-line bg-daftar-card xl:block"/>}</article>)}</div>
    </section>

    <section className="container">
      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{accountGuideCategories.map((item) => {
        const count = accountLearningGuide.filter((account) => account.category === item.id).length, active = category === item.id;
        return <button type="button" onClick={() => setCategory(item.id)} className={`rounded-2xl border p-4 text-start transition ${active ? "border-daftar-primary bg-daftar-primary text-white shadow-lg" : "border-daftar-line bg-daftar-card hover:border-daftar-primary"}`} key={item.id}><small className={active ? "text-white/70" : "text-daftar-muted"}>{count} {ar ? "حساب" : "accounts"}</small><b className="mt-2 block">{ar ? item.ar : item.en}</b></button>;
      })}</div>

      <div className="rounded-2xl border border-daftar-line bg-daftar-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_260px]"><label className="flex grid-cols-none flex-row items-center gap-3 rounded-xl border border-daftar-line px-4"><Search className="shrink-0 text-daftar-muted" size={20}/><input className="border-0 bg-transparent text-base shadow-none focus:shadow-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم الحساب أو الكود..." : "Search account or code..."}/></label><label className="flex grid-cols-none flex-row items-center gap-3 rounded-xl border border-daftar-line px-4"><Filter className="shrink-0 text-daftar-muted" size={20}/><select className="border-0 bg-transparent text-base shadow-none focus:shadow-none" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{ar ? "كل أنواع الحسابات" : "All account types"}</option>{accountGuideCategories.map((item)=><option value={item.id} key={item.id}>{ar ? item.ar : item.en}</option>)}</select></label></div></div>

      <div className="mt-7 grid gap-5">{rows.map((account) => <AccountCard key={account.code} account={account} locale={locale}/>)}</div>
      {!rows.length && <div className="mt-7 rounded-2xl border border-dashed border-daftar-line p-12 text-center text-lg text-daftar-muted">{ar ? "لا توجد حسابات مطابقة للبحث." : "No matching accounts."}</div>}
    </section>

    <section className="container mt-10"><div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-daftar-primary p-8 text-white md:flex-row md:items-center"><div><Workflow className="mb-4"/><h2 className="text-2xl font-black">{ar ? "بعد ما تفهم الحسابات، طبّقها في القيود" : "Apply what you learned"}</h2><p className="mt-2 max-w-2xl text-white/75">{ar ? "ابدأ مسار القيود اليومية وشاهد كل عملية من المستند وحتى القوائم المالية." : "Continue to the journal entry track and follow each transaction end to end."}</p></div><Link className="btn border-white/25 bg-white text-daftar-primary" href={`/${locale}/academy/journal-entry-masterclass`}>{ar ? "ابدأ مسار القيود" : "Start entries track"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></div></section>
  </main>;
}

function AccountCard({ account, locale }: { account: AccountLearningGuideItem; locale: Locale }) {
  const ar = locale === "ar", debit = account.normalEn === "Debit";
  return <article data-no-bilingual className="overflow-hidden rounded-3xl border border-daftar-line bg-daftar-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
    <header className="flex flex-col gap-5 border-b border-daftar-line bg-[color-mix(in_srgb,var(--primary)_3%,var(--card))] p-6 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4"><span className="rounded-xl bg-daftar-primary px-3 py-2 text-lg font-black text-white">{account.code}</span><div><h2 className="m-0 text-2xl font-black leading-tight">{ar ? account.nameAr : account.nameEn}</h2><p dir={ar ? "ltr" : "rtl"} lang={ar ? "en" : "ar"} className="mt-2 w-fit text-start text-sm font-semibold tracking-wide text-daftar-muted">{ar ? account.nameEn : account.nameAr}</p><span className="mt-3 inline-flex rounded-full bg-daftar-bg px-3 py-1 text-sm font-bold text-daftar-primary">{account.categoryAr}</span></div></div>
      <div className="flex items-center gap-3"><span className="text-sm font-bold text-daftar-muted">{ar ? "طبيعة الحساب" : "Normal balance"}</span><span className={`rounded-full px-4 py-2 text-base font-black ${debit ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200"}`}>{ar ? account.normalAr : account.normalEn}</span></div>
    </header>

    <div className="grid gap-4 p-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><ArrowUpRight size={23}/></span><div><small className="font-bold opacity-70">{ar ? "عند الزيادة" : "When it increases"}</small><h3 className="mt-2 flex items-center gap-4 text-xl font-black"><span>{account.increaseSideAr}</span>{ar && <span dir="ltr" lang="en" className="inline-flex rounded-lg border border-emerald-300 bg-white/65 px-3 py-1 text-sm font-semibold tracking-wide opacity-70 dark:border-emerald-800 dark:bg-black/15">{account.increaseSideAr === "مدين" ? "Debit" : "Credit"}</span>}</h3></div></div><p className="mt-4 text-[17px] leading-8">{account.increaseEffectAr}</p></section>
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950/25 dark:text-red-100"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-600 text-white"><ArrowDownLeft size={23}/></span><div><small className="font-bold opacity-70">{ar ? "عند النقص" : "When it decreases"}</small><h3 className="mt-2 flex items-center gap-4 text-xl font-black"><span>{account.decreaseSideAr}</span>{ar && <span dir="ltr" lang="en" className="inline-flex rounded-lg border border-red-300 bg-white/65 px-3 py-1 text-sm font-semibold tracking-wide opacity-70 dark:border-red-800 dark:bg-black/15">{account.decreaseSideAr === "مدين" ? "Debit" : "Credit"}</span>}</h3></div></div><p className="mt-4 text-[17px] leading-8">{account.decreaseEffectAr}</p></section>
    </div>

    <div className="grid gap-4 px-6 pb-6 xl:grid-cols-3">
      <section className="rounded-2xl border border-daftar-line p-5"><div className="flex items-center gap-2 text-daftar-primary"><Landmark size={20}/><h3 className="text-lg font-black">{ar ? "مكانه في القوائم المالية" : "Financial statement"}</h3></div><p className="mt-4 text-[16px] font-semibold leading-8">{account.statementAr}</p></section>
      <JournalExample text={account.exampleAr} locale={locale}/>
      <section className="rounded-2xl border border-daftar-line p-5"><div className="flex items-center gap-2 text-daftar-primary"><FileText size={20}/><h3 className="text-lg font-black">{ar ? "المستندات المؤيدة" : "Source documents"}</h3></div><p className="mt-4 text-[16px] font-semibold leading-8">{account.documentsAr}</p></section>
    </div>

    <footer className="border-t border-daftar-line bg-daftar-bg px-6 py-5"><div className="flex items-start gap-3"><Workflow className="mt-1 shrink-0 text-daftar-primary" size={21}/><div><b className="text-base">{ar ? "مسار الدورة المستندية" : "Document cycle"}</b><p className="mt-2 text-[16px] leading-8 text-daftar-muted">{account.cycleAr}</p></div></div></footer>
  </article>;
}

function JournalExample({ text, locale }: { text: string; locale: Locale }) {
  const ar = locale === "ar";
  const match = text.match(/^(.*?):\s*من حـ\/\s*(.+?)\s+إلى حـ\/\s*(.+?)[.]?$/);
  return <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900 dark:bg-indigo-950/20"><div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300"><ReceiptText size={20}/><h3 className="text-lg font-black">{ar ? "مثال القيد المحاسبي" : "Journal entry example"}</h3></div>{match ? <div className="mt-4"><p className="mb-3 text-sm font-bold text-daftar-muted">{match[1]}</p><div className="grid gap-2"><div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3 dark:bg-black/10"><span className="rounded-lg bg-blue-100 px-2 py-1 text-sm font-black text-blue-800">{ar ? "مدين" : "Debit"}</span><b className="text-[16px]">{match[2]}</b></div><div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3 dark:bg-black/10"><span className="rounded-lg bg-violet-100 px-2 py-1 text-sm font-black text-violet-800">{ar ? "دائن" : "Credit"}</span><b className="text-[16px]">{match[3]}</b></div></div></div> : <p className="mt-4 text-[16px] font-semibold leading-8">{text}</p>}</section>;
}
