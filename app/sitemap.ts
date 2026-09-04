import type { MetadataRoute } from "next";
import { transactions } from "@/data/transactions";
import { demoParties } from "@/data/demo-parties";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fixed = ["", "/dashboard", "/accounting-office", "/operations", "/document-cycle", "/spreadsheet-analysis", "/vat", "/parties", "/cashflow", "/scenario-simulator", "/invoice-capture", "/bank-reconciliation", "/documents", "/reports", "/close", "/periods", "/workspace", "/review", "/generator", "/transactions", "/recent", "/favorites", "/accounts", "/custody", "/service-point", "/service-point/owner-dashboard", "/service-point/plans", "/journal", "/trial-balance", "/settings", "/about", "/disclaimer", "/privacy", "/terms"];
  return ["ar", "en"].flatMap((locale) => [
    ...fixed.map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date() })),
    ...demoParties.map((party) => ({ url: `${base}/${locale}/parties/${party.id}`, lastModified: new Date() })),
    ...transactions.map((transaction) => ({ url: `${base}/${locale}/journal-entry/${transaction.slug}`, lastModified: new Date() })),
  ]);
}
