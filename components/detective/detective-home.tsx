"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, FileSearch, FolderOpen, Gauge, GraduationCap, Search, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { detectiveCases } from "@/data/detective/cases";
import { loadDetectiveProgress, subscribeToDetectiveProgress } from "@/lib/storage/detective";
import type { DetectiveProgress, Locale } from "@/types";

const empty: DetectiveProgress = { schemaVersion: 1, records: {}, skills: {} };
const difficulty = (value: string, ar: boolean) => value === "beginner" ? (ar ? "مبتدئ" : "Beginner") : value === "advanced" ? (ar ? "متقدم" : "Advanced") : (ar ? "متوسط" : "Intermediate");

export function DetectiveHome({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [progress, setProgress] = useState<DetectiveProgress>(empty);
  useEffect(() => { setProgress(loadDetectiveProgress()); return subscribeToDetectiveProgress(setProgress); }, []);
  const solved = Object.values(progress.records).filter((item) => item.solved).length;
  const bestTotal = Object.values(progress.records).reduce((sum, item) => sum + item.bestScore, 0);
  const average = useMemo(() => { const records = Object.values(progress.records).filter((item) => item.lastResult); return records.length ? Math.round(records.reduce((sum, item) => sum + (item.lastResult?.accuracy || 0), 0) / records.length) : 0; }, [progress]);
  const skillNames: Record<string, [string, string]> = { "bank-reconciliation": ["المطابقة البنكية", "Bank Reconciliation"], "customer-accounts": ["حسابات العملاء", "Customer Accounts"], "supplier-accounts": ["حسابات الموردين", "Supplier Accounts"], "journal-logic": ["منطق القيود", "Journal Logic"], "account-classification": ["تصنيف الحسابات", "Account Classification"], "financial-statement-impact": ["الأثر المالي", "Financial Impact"], "error-detection": ["اكتشاف الأخطاء", "Error Detection"], "ledger-analysis": ["تحليل الأستاذ", "Ledger Analysis"] };

  return <div className="detective-home">
    <section className="detective-hero"><div className="detective-container detective-hero-grid"><div>
      <Link className="detective-academy-back" href={`/${locale}/academy`}>{ar ? <ArrowRight size={16}/> : <ArrowLeft size={16}/>}<GraduationCap size={16}/>{ar ? "الأكاديمية / التدريب العملي" : "Academy / Practical training"}</Link>
      <span className="detective-kicker"><Search size={17}/>FINORA Accounting Detective</span>
      <h1>{ar ? "فيه حاجة غلط في الحسابات... اكتشفها." : "Something is wrong in the accounts... find it."}</h1>
      <p>{ar ? "افتح الملف، راجع الأدلة، وحدد السبب قبل ما تشوف الحل." : "Open the file, examine the evidence, and identify the cause before seeing the solution."}</p>
      <Link className="detective-primary" href={`/${locale}/academy/detective/${detectiveCases.find((item) => !progress.records[item.id]?.solved)?.slug || detectiveCases[0].slug}`}><FolderOpen size={18}/>{ar ? "افتح أول ملف" : "Open your first file"}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link>
    </div><div className="detective-desk-card"><span>{ar ? "ملف على مكتبك" : "ON YOUR DESK"}</span><div className="detective-folder"><FileSearch/><small>CASE #{detectiveCases[0].caseNumber}</small><b>{ar ? detectiveCases[0].titleAr : detectiveCases[0].titleEn}</b><p>{ar ? "فرق بين الدفاتر وكشف البنك يحتاج تفسيرًا." : "A difference between the books and bank statement needs an explanation."}</p></div><div className="detective-desk-seal"><ShieldCheck/><span>{ar ? "بيئة تدريب معزولة" : "Isolated training sandbox"}</span></div></div></div></section>

    <section className="detective-container detective-stats"><div><BadgeCheck/><span><b>{solved}/{detectiveCases.length}</b><small>{ar ? "قضايا محلولة" : "cases solved"}</small></span></div><div><Trophy/><span><b>{bestTotal}</b><small>{ar ? "إجمالي أفضل النتائج" : "best-score total"}</small></span></div><div><Gauge/><span><b>{average}%</b><small>{ar ? "متوسط دقة الأدلة" : "evidence accuracy"}</small></span></div></section>

    {Object.keys(progress.skills).length > 0 && <section className="detective-container detective-skill-progress"><div><span>{ar ? "المهارات التي تطورها" : "Skills you are improving"}</span><h2>{ar ? "تقدمك كمحقق محاسبي" : "Your accounting investigator progress"}</h2></div><div>{Object.entries(progress.skills).sort(([, a], [, b]) => (b || 0) - (a || 0)).slice(0, 4).map(([skill, value]) => <article key={skill}><span><b>{skillNames[skill]?.[ar ? 0 : 1] || skill}</b><strong>{value || 0}%</strong></span><i><span style={{ width: `${value || 0}%` }}/></i></article>)}</div></section>}

    <section className="detective-container detective-catalog"><div className="detective-section-title"><span><Sparkles/> {ar ? "قضايا محاسبية" : "Accounting cases"}</span><h2>{ar ? "كل ملف فيه قصة... والأرقام هي الأدلة." : "Every file has a story. The numbers are the evidence."}</h2><p>{ar ? "لا توجد أسئلة مباشرة. افتح المستندات، اربط الحركات، وابنِ استنتاجك." : "No direct questions. Open documents, connect movements, and build your conclusion."}</p></div>
      <div className="detective-case-grid">{detectiveCases.map((caseDefinition) => { const record = progress.records[caseDefinition.id]; return <article className="detective-case-card" key={caseDefinition.id}><div className="detective-card-head"><span>CASE #{caseDefinition.caseNumber}</span><b className={record?.solved ? "solved" : ""}>{record?.solved ? (ar ? "محلولة" : "Solved") : (ar ? "غير محلولة" : "Unsolved")}</b></div><div className="detective-file-icon"><FileSearch/></div><small>{ar ? caseDefinition.caseTypeAr : caseDefinition.caseTypeEn}</small><h3>{ar ? caseDefinition.titleAr : caseDefinition.titleEn}</h3><p>{ar ? caseDefinition.briefAr : caseDefinition.briefEn}</p><div className="detective-card-meta"><span><Clock3/>{caseDefinition.estimatedMinutes} {ar ? "د" : "min"}</span><span>{difficulty(caseDefinition.difficulty, ar)}</span><span>{caseDefinition.evidence.length} {ar ? "أدلة" : "evidence"}</span></div><footer><span>{record ? `${ar ? "أفضل نتيجة" : "Best score"}: ${record.bestScore}` : (ar ? "لم تبدأ بعد" : "Not started")}</span><Link href={`/${locale}/academy/detective/${caseDefinition.slug}`} aria-label={ar ? `افتح ${caseDefinition.titleAr}` : `Open ${caseDefinition.titleEn}`}>{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></footer></article>; })}</div>
    </section>
  </div>;
}
