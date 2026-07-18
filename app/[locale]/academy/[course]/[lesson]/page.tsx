import { notFound } from "next/navigation";
import { LessonViewer } from "@/components/academy/lesson-viewer";
import { getAcademyCourse, getAcademyLesson } from "@/data/academy";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale; course: string; lesson: string }> }) {
  const { locale, course: courseSlug, lesson: lessonSlug } = await params;
  const course = getAcademyCourse(courseSlug), lesson = getAcademyLesson(courseSlug, lessonSlug);
  if (!course || !lesson) notFound();
  return <LessonViewer locale={locale} course={course} lesson={lesson}/>;
}
