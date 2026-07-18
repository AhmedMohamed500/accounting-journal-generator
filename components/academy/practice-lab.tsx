"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, GraduationCap, RefreshCcw, Sparkles, Target, X } from "lucide-react";
import type { Locale } from "@/types";

const questions = [
  { ar: "الصندوق", en: "Cash", kindAr: "أصل", kindEn: "Asset", normal: "debit", increase: "debit" },
  { ar: "الموردون", en: "Accounts payable", kindAr: "التزام", kindEn: "Liability", normal: "credit", increase: "credit" },
  { ar: "إيراد المبيعات", en: "Sales revenue", kindAr: "إيراد", kindEn: "Revenue", normal: "credit", increase: "credit" },
  { ar: "مصروف الإيجار", en: "Rent expense", kindAr: "مصروف", kindEn: "Expense", normal: "debit", increase: "debit" },
  { ar: "رأس المال", en: "Owner capital", kindAr: "حقوق ملكية", kindEn: "Equity", normal: "credit", increase: "credit" },
  { ar: "العملاء", en: "Accounts receivable", kindAr: "أصل", kindEn: "Asset", normal: "debit", increase: "debit" },
];

export function PracticeLab({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [index, setIndex] = useState(0), [answer, setAnswer] = useState<string | null>(null), [score, setScore] = useState(0), [streak, setStreak] = useState(0), [done, setDone] = useState(false);
  const current = questions[index], correct = answer === current.normal;
  const progress = useMemo(() => Math.round((index + (answer ? 1 : 0)) / questions.length * 100), [answer, index]);
  const choose = (value: string) => { if (answer) return; setAnswer(value); if (value === current.normal) { setScore((item) => item + 1); setStreak((item) => item + 1); } else setStreak(0); };
  const next = () => { if (index === questions.length - 1) setDone(true); else { setIndex((item) => item + 1); setAnswer(null); } };
  const restart = () => { setIndex(0); setAnswer(null); setScore(0); setStreak(0); setDone(false); };

  return <main className="academy-page practice-page min-h-screen bg-daftar-bg"><section className="container practice-hero flex flex-col items-stretch justify-between gap-8 py-12 lg:flex-row lg:items-end lg:pt-16"><div><span className="academy-kicker"><FlaskConical/>{ar ? "معمل التدريب المحاسبي" : "Accounting practice lab"}</span><h1>{ar ? "درّب عقلك على المدين والدائن" : "Train your debit and credit instinct"}</h1><p>{ar ? "مش هتحفظ قيود. هتتدرب على طبيعة كل حساب لحد ما تحديد الطرف الصحيح يبقى تلقائي." : "Do not memorize entries. Train account nature until the right side becomes instinctive."}</p></div><Link className="btn" href={`/${locale}/academy`}><GraduationCap/>{ar ? "كل المسارات" : "All tracks"}</Link></section>
    <section className="container practice-shell pb-20"><div className="practice-scorebar mx-auto mb-4 grid max-w-[830px] grid-cols-[auto_1fr_auto] items-center gap-5 rounded-xl border border-daftar-line bg-daftar-card p-4"><span><Target/>{ar ? "السؤال" : "Question"} {Math.min(index + 1, questions.length)}/{questions.length}</span><div className="academy-progress-track"><i style={{width:`${progress}%`}}/></div><span><Sparkles/>{ar ? "سلسلة صحيحة" : "Streak"}: <b>{streak}</b></span></div>
    {!done ? <div className="practice-card mx-auto max-w-[830px] rounded-[22px] border border-daftar-line bg-daftar-card p-6 text-center shadow-xl sm:p-11"><span className="practice-type">{ar ? "تحدي طبيعة الحساب" : "Account nature challenge"}</span><p>{ar ? "حساب" : "Account"}</p><h2>{ar ? current.ar : current.en}</h2><small>{ar ? `نوعه: ${current.kindAr}` : `Type: ${current.kindEn}`}</small><h3>{ar ? "ما طبيعته الطبيعية؟" : "What is its normal balance?"}</h3><div className="practice-options grid grid-cols-1 gap-3 sm:grid-cols-2"><button className={answer ? current.normal === "debit" ? "correct" : answer === "debit" ? "wrong" : "" : ""} onClick={() => choose("debit")}><span>{ar ? "مدين" : "Debit"}</span><small>{ar ? "الزيادة في الجانب المدين" : "Increase on debit side"}</small></button><button className={answer ? current.normal === "credit" ? "correct" : answer === "credit" ? "wrong" : "" : ""} onClick={() => choose("credit")}><span>{ar ? "دائن" : "Credit"}</span><small>{ar ? "الزيادة في الجانب الدائن" : "Increase on credit side"}</small></button></div>{answer && <div className={`practice-feedback ${correct ? "success" : "error"}`}>{correct ? <CheckCircle2/> : <X/>}<div><b>{correct ? (ar ? "إجابة صحيحة" : "Correct answer") : (ar ? "راجع القاعدة" : "Review the rule")}</b><p>{ar ? `${current.ar} حساب ${current.kindAr} وطبيعته ${current.normal === "debit" ? "مدينة" : "دائنة"}.` : `${current.en} is a ${current.kindEn} with a ${current.normal} normal balance.`}</p></div><button className="btn btn-primary" onClick={next}>{index === questions.length - 1 ? (ar ? "النتيجة" : "Results") : (ar ? "السؤال التالي" : "Next question")}{ar ? <ArrowLeft/> : <ArrowRight/>}</button></div>}</div>
    : <div className="practice-result"><div className="practice-result-ring"><span><b>{Math.round(score / questions.length * 100)}%</b>{ar ? "نتيجتك" : "Your score"}</span></div><h2>{score >= 5 ? (ar ? "ممتاز! طبيعة الحسابات عندك قوية" : "Excellent account-nature instinct") : (ar ? "بداية جيدة، كرر التدريب" : "Good start — practice again")}</h2><p>{ar ? `أجبت إجابة صحيحة في ${score} من ${questions.length}.` : `You answered ${score} of ${questions.length} correctly.`}</p><div className="actions"><button className="btn btn-primary" onClick={restart}><RefreshCcw/>{ar ? "ابدأ تحديًا جديدًا" : "Start a new challenge"}</button><Link className="btn" href={`/${locale}/academy/accounting-foundations`}>{ar ? "راجع مسار الأساسيات" : "Review foundations"}</Link></div></div>}
    </section></main>;
}
