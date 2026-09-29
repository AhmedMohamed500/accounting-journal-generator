import Link from "next/link";
import type { Locale } from "@/types";

export function HawallyMark({ className = "" }: { className?: string }) {
  return <span className={`hawally-mark ${className}`} aria-hidden="true" />;
}

export function HawallyBrand({ locale, href, compact = false }: { locale: Locale; href?: string; compact?: boolean }) {
  const ar = locale === "ar";
  const content = <><HawallyMark/><span className="hawally-wordmark"><b>{ar ? "حوّلي" : "Hawally"}</b>{!compact && <small>{ar ? "HAWALLY" : "حوّلي"}</small>}</span></>;
  return href ? <Link className="hawally-brand" href={href} aria-label={ar ? "حوّلي" : "Hawally"}>{content}</Link> : <span className="hawally-brand">{content}</span>;
}
