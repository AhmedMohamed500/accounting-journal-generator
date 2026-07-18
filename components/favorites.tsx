"use client";
import { useState } from "react";
import Link from "next/link";
import { transactions } from "@/data/transactions";
import type { Locale } from "@/types";

export function Favorites({ locale }: { locale: Locale }) {
  const [slugs, setSlugs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("journal-favorites") || "[]") as string[]; } catch { return []; }
  });
  const items = transactions.filter((transaction) => slugs.includes(transaction.slug));
  const remove = (slug: string) => {
    const next = slugs.filter((item) => item !== slug);
    setSlugs(next);
    localStorage.setItem("journal-favorites", JSON.stringify(next));
  };
  return <div className="grid three">{items.map((transaction) => <article className="card" key={transaction.slug}>
    <span className="badge">{transaction.category}</span>
    <h2>{locale === "ar" ? transaction.titleAr : transaction.titleEn}</h2>
    <p className="muted">{locale === "ar" ? transaction.descriptionAr : transaction.descriptionEn}</p>
    <div className="actions"><Link className="btn btn-primary" href={`/${locale}/generator?type=${transaction.type}`}>{locale === "ar" ? "إنشاء القيد" : "Generate"}</Link><button className="btn btn-danger" onClick={() => remove(transaction.slug)}>{locale === "ar" ? "إزالة" : "Remove"}</button></div>
  </article>)}{items.length === 0 && <div className="card">{locale === "ar" ? "لا توجد عمليات مفضلة." : "No favorite transactions."}</div>}</div>;
}
