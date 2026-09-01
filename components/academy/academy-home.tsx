"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, FileSearch, GraduationCap, ListOrdered, PlayCircle, Search, ShieldCheck, Sparkles, TableProperties, Target, Trophy } from "lucide-react";
import { academyCourses, academyLessonCount } from "@/data/academy";
import { detectiveCases } from "@/data/detective/cases";
import { loadAcademyProgress } from "@/lib/academy/progress";
import { loadDetectiveProgress, subscribeToDetectiveProgress } from "@/lib/storage/detective";
import type { AcademyCourse, AcademyProgress, DetectiveProgress, Locale } from "@/types";

const emptyProgress: AcademyProgress = { completedLessonIds: [], quizScores: {} };
const emptyDetectiveProgress: DetectiveProgress = { schemaVersion: 1, records: {}, skills: {} };

export function AcademyHome({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [progress, setProgress] = useState<AcademyProgress>(emptyProgress);
  const [detectiveProgress, setDetectiveProgress] = useState<DetectiveProgress>(emptyDetectiveProgress);

  useEffect(() => {
    const refresh = () => setProgress(loadAcademyProgress());
    refresh();
    window.addEventListener("academy-progress-updated", refresh);
    return () => window.removeEventListener("academy-progress-updated", refresh);
  }, []);
  useEffect(() => {
    setDetectiveProgress(loadDetectiveProgress());
    return subscribeToDetectiveProgress(setDetectiveProgress);
  }, []);

  const filtered = useMemo(() => academyCourses.filter((course) => {
    const searchable = `${course.titleAr} ${course.titleEn} ${course.descriptionAr} ${course.descriptionEn}`.toLowerCase();
    return (level === "all" || course.level === level) && searchable.includes(query.toLowerCase().trim());
  }), [level, query]);

  const continueLesson = useMemo(() => {
    if (progress.lastLessonId) {
      const [courseSlug, lessonSlug] = progress.lastLessonId.split("/");
      const course = academyCourses.find((item) => item.slug === courseSlug);
      const lesson = course?.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);
      if (course && lesson) return { course, lesson };
    }
    const course = academyCourses[0];
    return { course, lesson: course.modules[0].lessons[0] };
  }, [progress.lastLessonId]);

  const completed = progress.completedLessonIds.length;
  const scoreValues = Object.values(progress.quizScores);
  const average = scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;

  return <main className="academy-page min-h-screen bg-daftar-bg">
    <section className="academy-hero relative overflow-hidden py-14 text-white lg:py-20">
      <div className="container academy-hero-grid relative z-[1] grid items-center gap-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
        <div className="academy-hero-copy max-w-[750px]">
          <span className="academy-kicker"><GraduationCap size={18}/>{ar ? "أكاديمية فينورا للمحاسبة" : "FINORA Accounting Academy"}</span>
          <h1>{ar ? "اتعلم المحاسبة كأنك شغال جوه شركة حقيقية" : "Learn accounting as if you work inside a real company"}</h1>
          <p>{ar ? "من طبيعة الحسابات والقيود اليومية إلى الموردين والشيكات والقوائم والإقفال. كل درس يجمع الفكرة والمستند والقيد وتأثيره واختبارًا عمليًا." : "From account nature and journal entries to suppliers, cheques, statements, and close. Every lesson connects the idea, document, entry, impact, and practice."}</p>
          <div className="actions mt-7 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href={`/${locale}/missions`}><Target size={19}/>{ar ? "حل موقف محاسبي الآن" : "Solve an accounting case now"}{ar ? <ArrowLeft size={17}/> : <ArrowRight size={17}/>}</Link>
            <Link className="btn btn-primary" href={`/${locale}/academy/${continueLesson.course.slug}/${continueLesson.lesson.slug}`}><PlayCircle size={19}/>{completed ? (ar ? "كمّل من حيث توقفت" : "Continue learning") : (ar ? "ابدأ أول درس مجانًا" : "Start the first lesson")}{ar ? <ArrowLeft size={17}/> : <ArrowRight size={17}/>}</Link>
            <Link className="btn" href={`/${locale}/academy/account-guide`}><TableProperties size={18}/>{ar ? "مرجع طبيعة الحسابات" : "Account nature guide"}</Link>
            <Link className="btn" href={`/${locale}/academy/practice`}><Target size={18}/>{ar ? "افتح معمل التدريب" : "Open practice lab"}</Link>
            <Link className="btn" href={`/${locale}/academy/detective`}><ShieldCheck size={18}/>{ar ? "تدريب التحقيق المحاسبي" : "Accounting Detective training"}</Link>
            <Link className="btn" href={`/${locale}/money-flow`}><Sparkles size={18}/>{ar ? "حرّك الفلوس" : "Money Flow Lab"}</Link>
          </div>
        </div>
        <div className="academy-hero-board rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
          <span className="academy-board-label"><Sparkles size={15}/>{ar ? "رحلتك المهنية" : "Your professional journey"}</span>
          <div className="academy-roadmap">
            {academyCourses.slice(0, 5).map((course, index) => <div key={course.slug} className={index === 0 ? "active" : ""}><span>{index + 1}</span><b>{ar ? course.titleAr : course.titleEn}</b><small>{course.modules.flatMap((module) => module.lessons).length} {ar ? "دروس" : "lessons"}</small></div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="container academy-stats relative z-[3] grid grid-cols-2 overflow-hidden border border-daftar-line bg-daftar-card shadow-xl lg:grid-cols-4" aria-label={ar ? "إحصاءات الأكاديمية" : "Academy statistics"}>
      <Stat icon={BookOpenCheck} value={academyLessonCount} label={ar ? "درسًا تطبيقيًا" : "practical lessons"}/>
      <Stat icon={Clock3} value="6+" label={ar ? "ساعات تعليمية" : "learning hours"}/>
      <Stat icon={Target} value={academyLessonCount} label={ar ? "اختبار فهم" : "knowledge checks"}/>
      <Stat icon={Trophy} value={`${average}%`} label={ar ? "متوسط نتيجتك" : "your average score"}/>
    </section>

    <section className="section container py-11">
      <div className="academy-progress-card grid items-center gap-5 rounded-2xl border border-daftar-line bg-daftar-card p-5 md:grid-cols-[auto_1fr_auto]">
        <div><span>{ar ? "تقدمك في الأكاديمية" : "Your academy progress"}</span><b>{completed} / {academyLessonCount} {ar ? "درس مكتمل" : "lessons complete"}</b></div>
        <div className="academy-progress-track"><i style={{ width: `${Math.min(100, completed / academyLessonCount * 100)}%` }}/></div>
        <strong>{Math.round(completed / academyLessonCount * 100)}%</strong>
      </div>

      <div className="mb-14 rounded-3xl border border-daftar-line bg-daftar-card p-6 shadow-sm md:p-8">
        <div className="mb-7 flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_9%,var(--card))] text-daftar-primary"><ListOrdered/></span><div><span className="text-xs font-black text-daftar-primary">{ar?"مش محتاج تختار تبدأ منين":"No need to choose where to begin"}</span><h2 className="mt-1 text-2xl font-black">{ar?"امشِ على الطريق ده بالترتيب":"Follow this path in order"}</h2><p className="mt-2 text-sm leading-7 text-daftar-muted">{ar?"المنهج مترتب من الأساسيات إلى الشغل الاحترافي. ابدأ بالمرحلة الأولى، وكل مرحلة تفتح لك فهم المرحلة اللي بعدها.":"The curriculum moves from foundations to professional practice in a clear sequence."}</p></div></div>
        <div className="grid gap-3 lg:grid-cols-3">{academyCourses.map((course,index)=><Link className="group flex items-center gap-4 rounded-2xl border border-daftar-line p-4 transition hover:border-daftar-primary hover:bg-[color-mix(in_srgb,var(--primary)_4%,var(--card))]" href={`/${locale}/academy/${course.slug}`} key={course.slug}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-daftar-primary font-black text-white">{index+1}</span><span className="flex-1"><small className="block text-daftar-muted">{ar?`المرحلة ${index+1}`:`Stage ${index+1}`}</small><b className="mt-1 block">{ar?course.titleAr:course.titleEn}</b></span>{ar?<ArrowLeft className="text-daftar-primary"/>:<ArrowRight className="text-daftar-primary"/>}</Link>)}</div>
        <Link className="mt-5 flex items-center justify-between rounded-2xl bg-daftar-primary p-5 text-white" href={`/${locale}/academy/account-guide`}><span><b className="block text-lg">{ar?"مرجع طبيعة الحسابات الكامل":"Complete account nature guide"}</b><small className="mt-1 block text-white/70">{ar?"كل حساب: يزيد ويقل إزاي، يظهر فين، ومستنده إيه":"Every account: movement, statements, and documents"}</small></span><TableProperties/></Link>
      </div>

      <section className="mb-14 overflow-hidden rounded-3xl border border-daftar-line bg-daftar-card shadow-sm" aria-labelledby="academy-detective-title">
        <div className="grid gap-7 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--primary)_10%,var(--card)),var(--card))] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-daftar-primary text-white"><ShieldCheck/></span><div><span className="text-xs font-black text-daftar-primary">FINORA ACCOUNTING DETECTIVE</span><h2 id="academy-detective-title" className="mt-1 text-2xl font-black">{ar ? "التدريب العملي: حقّق في الأخطاء المحاسبية" : "Practical training: investigate accounting errors"}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-daftar-muted">{ar ? "خمس قضايا تدريبية داخل الأكاديمية. افحص المستندات والقيود وحركات البنك والأستاذ، ثم كوّن استنتاجك واحصل على تقييم مهاراتك." : "Five Academy training cases. Inspect documents, journals, bank movements, and ledgers, then form a conclusion and receive a skill assessment."}</p></div></div>
          <Link className="btn btn-primary" href={`/${locale}/academy/detective`}><FileSearch size={18}/>{ar ? "افتح كل القضايا" : "Open all cases"}{ar ? <ArrowLeft size={17}/> : <ArrowRight size={17}/>}</Link>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-8 xl:grid-cols-5">
          {detectiveCases.map((caseDefinition) => { const record = detectiveProgress.records[caseDefinition.id]; return <Link className="group rounded-2xl border border-daftar-line p-4 transition hover:-translate-y-1 hover:border-daftar-primary hover:shadow-lg" href={`/${locale}/academy/detective/${caseDefinition.slug}`} key={caseDefinition.id}><span className="flex items-center justify-between text-xs font-black text-daftar-primary"><b>CASE {caseDefinition.caseNumber}</b><small className={record?.solved ? "text-emerald-600" : "text-daftar-muted"}>{record?.solved ? (ar ? "مكتملة" : "Complete") : (ar ? "ابدأ" : "Start")}</small></span><h3 className="mt-4 text-base font-black">{ar ? caseDefinition.titleAr : caseDefinition.titleEn}</h3><p className="mt-2 line-clamp-3 text-xs leading-6 text-daftar-muted">{ar ? caseDefinition.briefAr : caseDefinition.briefEn}</p><span className="mt-4 flex items-center justify-between border-t border-daftar-line pt-3 text-xs text-daftar-muted"><small><Clock3 className="inline" size={14}/> {caseDefinition.estimatedMinutes} {ar ? "د" : "min"}</small><b className="text-daftar-primary">{record ? `${record.bestScore}/1000` : ar ? "غير مبدوءة" : "Not started"}</b></span></Link>; })}
        </div>
      </section>

      <div className="academy-catalog-head mb-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><span>{ar ? "الخطة التعليمية الكاملة" : "Complete learning plan"}</span><h2>{ar ? "اختار المسار وابدأ خطوة بخطوة" : "Choose a track and learn step by step"}</h2></div>
        <div className="academy-filters flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <label className="academy-search flex min-h-11 flex-1 grid-cols-none flex-row items-center gap-2 rounded-xl border border-daftar-line bg-daftar-card px-3 lg:w-[290px]"><Search size={17}/><input className="border-0 bg-transparent p-0 shadow-none focus:shadow-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث عن قيد أو موضوع..." : "Search entries or topics..."}/></label>
          <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label={ar ? "المستوى" : "Level"}>
            <option value="all">{ar ? "كل المستويات" : "All levels"}</option><option value="beginner">{ar ? "مبتدئ" : "Beginner"}</option><option value="intermediate">{ar ? "متوسط" : "Intermediate"}</option><option value="advanced">{ar ? "متقدم" : "Advanced"}</option>
          </select>
        </div>
      </div>
      <div className="academy-course-grid grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course, index) => <CourseCard key={course.slug} locale={locale} course={course} index={index + 1} progress={progress}/>) }
      </div>
      {!filtered.length && <div className="academy-empty"><Search/><h3>{ar ? "مفيش نتيجة مطابقة" : "No matching result"}</h3><p>{ar ? "جرّب كلمة أخرى أو اعرض كل المستويات." : "Try another phrase or show all levels."}</p></div>}
    </section>
  </main>;
}

function Stat({ icon: Icon, value, label }: { icon: typeof Target; value: string | number; label: string }) { return <div><Icon/><span><b>{value}</b><small>{label}</small></span></div>; }

function CourseCard({ locale, course, index, progress }: { locale: Locale; course: AcademyCourse; index: number; progress: AcademyProgress }) {
  const ar = locale === "ar", lessons = course.modules.flatMap((module) => module.lessons);
  const done = lessons.filter((lesson) => progress.completedLessonIds.includes(`${course.slug}/${lesson.slug}`)).length;
  const level = course.level === "beginner" ? (ar ? "مبتدئ" : "Beginner") : course.level === "intermediate" ? (ar ? "متوسط" : "Intermediate") : (ar ? "متقدم" : "Advanced");
  return <article className={`academy-course-card accent-${course.accent} relative flex min-h-[410px] flex-col overflow-hidden rounded-[20px] border border-daftar-line bg-daftar-card p-6 transition hover:-translate-y-1 hover:shadow-xl`}>
    <div className="academy-course-top"><span>{String(index).padStart(2, "0")}</span><small>{level}</small></div>
    <div className="academy-course-icon"><BookOpenCheck/></div>
    <span className="academy-course-subtitle">{ar ? course.subtitleAr : course.subtitleEn}</span>
    <h3>{ar ? course.titleAr : course.titleEn}</h3>
    <p>{ar ? course.descriptionAr : course.descriptionEn}</p>
    <div className="academy-course-meta"><span><BookOpenCheck size={15}/>{lessons.length} {ar ? "دروس" : "lessons"}</span><span><Clock3 size={15}/>{lessons.reduce((sum, lesson) => sum + lesson.duration, 0)} {ar ? "دقيقة" : "min"}</span></div>
    <div className="academy-mini-progress"><i style={{ width: `${lessons.length ? done / lessons.length * 100 : 0}%` }}/></div>
    <div className="academy-card-foot mt-auto flex items-center justify-between pt-4"><span>{done ? `${done}/${lessons.length} ${ar ? "مكتمل" : "done"}` : ar ? "ابدأ من البداية" : "Start here"}</span><Link href={`/${locale}/academy/${course.slug}`} aria-label={ar ? `فتح ${course.titleAr}` : `Open ${course.titleEn}`}>{ar ? <ArrowLeft/> : <ArrowRight/>}</Link></div>
  </article>;
}
