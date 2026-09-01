"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, CheckCircle2, Clock3, Flame, Play, Sparkles, Target, Trophy } from "lucide-react";
import { getDailyMission, missions } from "@/data/missions";
import { loadMissionsProgress, subscribeToMissionsProgress } from "@/lib/storage/missions";
import type { Locale, MissionsProgress } from "@/types";

const empty: MissionsProgress = { schemaVersion: 1, records: {} };

export function MissionsHome({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [progress, setProgress] = useState<MissionsProgress>(empty);
  useEffect(() => { setProgress(loadMissionsProgress()); return subscribeToMissionsProgress(setProgress); }, []);
  const completed = Object.values(progress.records).filter((record) => record.completed).length;
  const totalScore = Object.values(progress.records).reduce((sum, record) => sum + record.bestScore, 0);
  const firstMission = missions.find((mission) => !progress.records[mission.id]?.completed) || missions[0], daily = getDailyMission();
  const averageAccuracy = useMemo(() => { const records = Object.values(progress.records).filter((record) => record.completed); return records.length ? Math.round(records.reduce((sum, record) => sum + record.bestAccuracy, 0) / records.length) : 0; }, [progress]);

  return <div className="missions-page">
    <section className="missions-hero"><div className="missions-container missions-hero-grid"><div>
      <span className="missions-kicker"><Sparkles size={17}/>{ar ? "FINORA Missions" : "FINORA Missions"}</span>
      <h1>{ar ? "حلها كمحاسب." : "Solve it like an accountant."}</h1>
      <p>{ar ? "مواقف حقيقية. قرارات حقيقية. تعلّم المحاسبة وأنت بتحل." : "Real situations. Real decisions. Learn accounting by solving."}</p>
      <div className="missions-actions"><Link className="mission-primary" href={`/${locale}/missions/${firstMission.slug}`}><Play size={18}/>{ar ? "ابدأ أول مهمة" : "Start your first mission"}{ar ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>}</Link><Link className="mission-secondary" href={`/${locale}/missions/daily`}><Flame size={18}/>{ar ? "تحدي اليوم" : "Daily challenge"}</Link></div>
    </div><div className="mission-hero-case"><span>CASE #{daily.caseNumber}</span><i><Target/></i><small>{ar ? "تحدي اليوم" : "Daily challenge"}</small><h2>{ar ? daily.titleAr : daily.titleEn}</h2><p>{ar ? daily.descriptionAr : daily.descriptionEn}</p><Link href={`/${locale}/missions/${daily.slug}`}>{ar ? "افتح الحالة" : "Open case"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></div></div></section>

    <section className="missions-container mission-stats"><div><Target/><span><b>{completed}/{missions.length}</b><small>{ar ? "مهمات مكتملة" : "missions completed"}</small></span></div><div><Trophy/><span><b>{totalScore}</b><small>{ar ? "أفضل نقاطك" : "best-score total"}</small></span></div><div><CheckCircle2/><span><b>{averageAccuracy}%</b><small>{ar ? "متوسط الدقة" : "average accuracy"}</small></span></div></section>

    <section className="missions-container missions-catalog"><div className="mission-section-title"><span>{ar ? "ابدأ التطبيق فورًا" : "Start practicing now"}</span><h2>{ar ? "خمس حالات قصيرة من الشغل الحقيقي" : "Five short cases from real work"}</h2><p>{ar ? "مفيش درس طويل. اختار قرارك وشوف تأثيره على الشركة والقيد." : "No long lessons. Make a decision and see its impact on the business and entry."}</p></div>
      <div className="mission-card-grid">{missions.map((mission) => { const record = progress.records[mission.id]; return <article className="mission-card" key={mission.id}><div className="mission-card-top"><span>CASE #{mission.caseNumber}</span>{record?.completed ? <b className="mission-complete"><CheckCircle2 size={15}/>{ar ? "مكتملة" : "Completed"}</b> : <b>{ar ? "جديدة" : "New"}</b>}</div><div className="mission-card-icon">{mission.category === "cash-bank" ? <Banknote/> : <Target/>}</div><h3>{ar ? mission.titleAr : mission.titleEn}</h3><p>{ar ? mission.descriptionAr : mission.descriptionEn}</p><div className="mission-meta"><span><Clock3/>{mission.estimatedMinutes} {ar ? "دقائق" : "min"}</span><span>{mission.difficulty === "beginner" ? (ar ? "مبتدئ" : "Beginner") : (ar ? "متوسط" : "Intermediate")}</span></div><div className="mission-skill">{(ar ? mission.skillsAr : mission.skillsEn)[0]}</div><div className="mission-card-foot"><span>{record ? `${ar ? "أفضل نتيجة" : "Best score"}: ${record.bestScore}` : (ar ? "لسه ما اتحلتش" : "Not attempted yet")}</span><Link href={`/${locale}/missions/${mission.slug}`} aria-label={ar ? `ابدأ ${mission.titleAr}` : `Start ${mission.titleEn}`}>{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></div></article>; })}</div>
      <aside className="mission-detective-cta"><div><span>{ar ? "تدريب الأكاديمية" : "ACADEMY TRAINING"}</span><h3>{ar ? "جاهز تجرب قضية حقيقية؟" : "Ready to investigate a real case?"}</h3><p>{ar ? "افتح ملفًا كاملًا، راجع المستندات والحركات، ثم ابنِ استنتاجك بنفسك." : "Open a complete file, inspect documents and movements, then build your own conclusion."}</p></div><Link className="mission-primary" href={`/${locale}/academy/detective`}>{ar ? "افتح تدريب التحقيق المحاسبي" : "Open Accounting Detective training"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></aside>
      <aside className="mission-detective-cta"><div><span>FINORA MONEY FLOW LAB</span><h3>{ar ? "شوف القيمة وهي بتتحرك" : "Watch value move"}</h3><p>{ar ? "ابدأ بزاد ونقص، وبعد فهم الحركة اكتشف بنفسك ليه الحساب مدين أو دائن." : "Start with increase and decrease, then discover debit and credit from the movement."}</p></div><Link className="mission-primary" href={`/${locale}/money-flow`}>{ar ? "افتح حرّك الفلوس" : "Open Money Flow Lab"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></aside>
    </section>
  </div>;
}
