import { notFound } from "next/navigation";
import { CourseView } from "@/components/academy/course-view";
import { getAcademyCourse } from "@/data/academy";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale; course: string }> }) {
  const { locale, course: courseSlug } = await params;
  const course = getAcademyCourse(courseSlug);
  if (!course) notFound();
  return <CourseView locale={locale} course={course}/>;
}
