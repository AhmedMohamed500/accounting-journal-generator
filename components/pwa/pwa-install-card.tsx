"use client";

import { CheckCircle2, Download, HardDrive, Share2, Smartphone, Wifi, WifiOff } from "lucide-react";
import { usePwa } from "./pwa-provider";
import { localStorageSizeKb, pwaInstallGuidance } from "@/lib/pwa";
import type { Locale } from "@/types";

export function PwaInstallCard({ locale, statusOnly = false }: { locale: Locale; statusOnly?: boolean }) {
  const ar = locale === "ar", pwa = usePwa();
  const guidance = pwaInstallGuidance({ standalone: pwa.installed, installPromptAvailable: pwa.installable, ios: pwa.ios });
  const size = typeof window === "undefined" ? 0 : localStorageSizeKb(localStorage);
  if (!statusOnly && guidance === "browser") return null;
  if (!statusOnly && guidance === "installed") return <div className="pwa-installed-badge"><CheckCircle2 size={16}/>{ar ? "التطبيق مثبت" : "App installed"}</div>;
  return <section className={`pwa-install-card ${statusOnly ? "pwa-status-card" : ""}`}>
    <div className="flex items-start gap-3"><span className="pwa-install-icon">{pwa.installed ? <CheckCircle2/> : <Smartphone/>}</span><div className="min-w-0 flex-1"><b className="block">{pwa.installed ? (ar ? "FINORA يعمل كتطبيق مثبت" : "FINORA is running as an installed app") : (ar ? "ثبّت FINORA على جهازك" : "Install FINORA on your device")}</b><p className="mt-1 text-sm leading-6 text-slate-600">{guidance === "ios" ? (ar ? "في Safari اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية»." : "In Safari, tap Share then Add to Home Screen.") : guidance === "prompt" ? (ar ? "افتح النظام بسرعة من الشاشة الرئيسية، بدون متجر تطبيقات." : "Open quickly from your home screen, without an app store.") : (ar ? "استخدم قائمة المتصفح إذا كان التثبيت متاحًا." : "Use your browser menu when installation is available.")}</p></div></div>
    {guidance === "prompt" && <button className="btn btn-primary mt-4 w-full" onClick={() => pwa.install()}><Download size={17}/>{ar ? "تثبيت التطبيق" : "Install app"}</button>}
    {guidance === "ios" && <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-900"><Share2 size={16}/>{ar ? "مشاركة ← إضافة إلى الشاشة الرئيسية" : "Share → Add to Home Screen"}</div>}
    {statusOnly && <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><PwaFact icon={pwa.online ? Wifi : WifiOff} label={ar ? "الاتصال" : "Connection"} value={pwa.online ? (ar ? "متصل" : "Online") : (ar ? "وضع محلي" : "Local mode")}/><PwaFact icon={HardDrive} label={ar ? "التخزين" : "Storage"} value={`${size} KB · Local Demo`}/><PwaFact icon={CheckCircle2} label={ar ? "الإصدار" : "Version"} value={pwa.version}/><PwaFact icon={WifiOff} label="Cloud sync" value={ar ? "غير مفعّل" : "Not enabled"}/></div>}
  </section>;
}

function PwaFact({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) { return <span className="rounded-xl bg-slate-50 p-3"><Icon className="mb-2 text-blue-700" size={16}/><small className="block text-slate-500">{label}</small><b className="mt-1 block">{value}</b></span>; }
