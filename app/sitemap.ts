import type { MetadataRoute } from "next";
import { transactions } from "@/data/transactions";
import { demoParties } from "@/data/demo-parties";
import { academyCourses } from "@/data/academy";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fixed = ["", "/dashboard", "/accounting-office", "/academy", "/academy/practice", "/academy/account-guide", "/operations", "/document-cycle", "/spreadsheet-analysis", "/parties", "/cashflow", "/scenario-simulator", "/invoice-capture", "/bank-reconciliation", "/documents", "/reports", "/close", "/periods", "/workspace", "/review", "/generator", "/transactions", "/recent", "/favorites", "/accounts", "/custody", "/service-point", "/journal", "/trial-balance", "/settings", "/about", "/disclaimer", "/privacy", "/terms"];
  return ["ar", "en"].flatMap((locale) => [
    ...fixed.map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date() })),
    ...demoParties.map((party) => ({ url: `${base}/${locale}/parties/${party.id}`, lastModified: new Date() })),
    ...transactions.map((transaction) => ({ url: `${base}/${locale}/journal-entry/${transaction.slug}`, lastModified: new Date() })),
    ...academyCourses.flatMap((course) => [
      { url: `${base}/${locale}/academy/${course.slug}`, lastModified: new Date() },
      ...course.modules.flatMap((module) => module.lessons.map((lesson) => ({ url: `${base}/${locale}/academy/${course.slug}/${lesson.slug}`, lastModified: new Date() }))),
    ]),
  ]);
}
