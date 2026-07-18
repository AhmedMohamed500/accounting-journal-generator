"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, GraduationCap, LockKeyhole, PlayCircle, Target } from "lucide-react";
import { academyLessonId } from "@/data/academy";
import { loadAcademyProgress } from "@/lib/academy/progress";
import type { AcademyCourse, AcademyProgress, Locale } from "@/types";

const emptyProgress: AcademyProgress = { completedLessonIds: [], quizScores: {} };

export function CourseView({ locale, course }: { locale: Locale; course: AcademyCourse }) {
  const ar = locale === "ar", lessons = course.modules.flatMap((module) => module.lessons);
  const [progress, setProgress] = useState(emptyProgress);
  useEffect(() => { const refresh = () => setProgress(loadAcademyProgress()); refresh(); window.addEventListener("academy-progress-updated", refresh); return () => window.removeEventListener("academy-progress-updated", refresh); }, []);
  const completed = lessons.filter((lesson) => progress.completedLessonIds.includes(academyLessonId(course.slug, lesson.slug))).length;
  const firstIncomplete = lessons.find((lesson) => !progress.completedLessonIds.includes(academyLessonId(course.slug, lesson.slug))) || lessons[0];

  return <main className="academy-page course-page min-h-screen bg-daftar-bg">
    <section className={`course-hero accent-${course.accent} border-b border-daftar-line py-12`}><div className="container">
      <div className="course-breadcrumb"><Link href={`/${locale}/academy`}><GraduationCap size={16}/>{ar ? "الأكاديمية" : "Academy"}</Link><span>/</span><span>{ar ? course.titleAr : course.titleEn}</span></div>
      <div className="course-hero-grid grid items-end gap-10 lg:grid-cols-[1fr_330px] lg:gap-16"><div><span className="academy-kicker">{ar ? course.subtitleAr : course.subtitleEn}</span><h1>{ar ? course.titleAr : course.titleEn}</h1><p>{ar ? course.descriptionAr : course.descriptionEn}</p><div className="course-facts mt-6 flex flex-wrap gap-5"><span><BookOpenCheck/>{lessons.length} {ar ? "دروس" : "lessons"}</span><span><Clock3/>{lessons.reduce((sum, lesson) => sum + lesson.duration, 0)} {ar ? "دقيقة" : "minutes"}</span><span><Target/>{lessons.length} {ar ? "اختبارًا" : "quizzes"}</span></div></div>
      <div className="course-resume grid gap-3 rounded-2xl border border-daftar-line bg-daftar-card p-6 shadow-lg"><span>{ar ? "تقدمك في المسار" : "Your track progress"}</span><strong>{Math.round(completed / lessons.length * 100)}%</strong><div className="academy-progress-track"><i style={{width:`${completed / lessons.length * 100}%`}}/></div><small>{completed} {ar ? "من" : "of"} {lessons.length} {ar ? "درس مكتمل" : "lessons complete"}</small><Link className="btn btn-primary mt-2" href={`/${locale}/academy/${course.slug}/${firstIncomplete.slug}`}><PlayCircle/>{completed ? (ar ? "متابعة التعلم" : "Continue") : (ar ? "ابدأ المسار" : "Start track")}</Link></div></div>
    </div></section>

    <section className="section container course-curriculum py-11">
      <div className="course-curriculum-head mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><span>{ar ? "محتوى المسار" : "Track curriculum"}</span><h2>{ar ? "خطة واضحة من الفهم إلى التطبيق" : "A clear plan from concept to practice"}</h2></div><Link className="btn" href={`/${locale}/academy/practice`}><Target/>{ar ? "معمل التدريب" : "Practice lab"}</Link></div>
      {course.modules.map((module, moduleIndex) => <section className="course-module mb-7 overflow-hidden rounded-2xl border border-daftar-line bg-daftar-card" key={module.id}><div className="course-module-head grid grid-cols-[auto_1fr_auto] items-center gap-3 p-5"><span>{ar ? `الوحدة ${moduleIndex + 1}` : `Module ${moduleIndex + 1}`}</span><h3>{ar ? module.titleAr : module.titleEn}</h3><small>{module.lessons.length} {ar ? "دروس" : "lessons"}</small></div><div className="course-lessons">{module.lessons.map((lesson, index) => {
        const id = academyLessonId(course.slug, lesson.slug), done = progress.completedLessonIds.includes(id), score = progress.quizScores[id];
        return <Link className={`course-lesson-row grid min-h-[86px] grid-cols-[42px_1fr_22px] items-center gap-4 border-t border-daftar-line px-5 py-4 sm:grid-cols-[42px_1fr_auto_auto_22px] ${done ? "done" : ""}`} href={`/${locale}/academy/${course.slug}/${lesson.slug}`} key={lesson.slug}><span className="lesson-status">{done ? <CheckCircle2/> : <b>{index + 1}</b>}</span><span className="lesson-copy"><b>{ar ? lesson.titleAr : lesson.titleEn}</b><small>{ar ? lesson.summaryAr : lesson.summaryEn}</small></span><span className="lesson-duration hidden sm:flex"><Clock3/>{lesson.duration} {ar ? "د" : "min"}</span>{score !== undefined && <span className="lesson-score hidden sm:flex">{score}%</span>}{ar ? <ArrowLeft/> : <ArrowRight/>}</Link>;
      })}</div></section>)}
      <div className="course-certificate"><LockKeyhole/><div><b>{ar ? "شهادة إتمام المسار" : "Track completion certificate"}</b><p>{ar ? "تُفتح بعد إكمال كل دروس المسار واجتياز اختبارات الفهم." : "Unlocks after completing all track lessons and knowledge checks."}</p></div><span>{completed}/{lessons.length}</span></div>
    </section>
  </main>;
}
