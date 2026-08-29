import { redirect } from "next/navigation";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  redirect(`/${locale}/academy/detective/${slug}`);
}
