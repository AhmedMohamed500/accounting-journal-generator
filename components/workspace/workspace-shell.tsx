"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  authenticateLocal,
  createDefaultBranch,
  createDefaultWorkspaceYear,
  hashLocalPin,
  hasLocalLogin,
  loadWorkspace,
  loadWorkspaceSession,
  saveWorkspace,
  saveWorkspaceSession,
} from "@/lib/storage/workspace";
import type { Company, Locale, WorkspaceData } from "@/types";
import { defaultSettings, saveSettings } from "@/lib/storage/settings";

const today = () => new Date().toISOString();

export function WorkspaceShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const ar = locale === "ar", pathname = usePathname();
  const publicExperience = pathname === `/${locale}` || pathname.startsWith(`/${locale}/arena`) || pathname.startsWith(`/${locale}/academy`) || pathname.startsWith(`/${locale}/missions`) || pathname.startsWith(`/${locale}/detective`) || pathname.startsWith(`/${locale}/money-flow`);
  const [ready, setReady] = useState(false), [workspace, setWorkspace] = useState<WorkspaceData>({ companies: [], branches: [], fiscalYears: [], members: [] });
  const [sessionValid, setSessionValid] = useState(false);
  const [form, setForm] = useState({ companyAr: "", companyEn: "", owner: "", email: "", pin: "" });
  const [login, setLogin] = useState({ email: "", pin: "" }), [message, setMessage] = useState("");

  const refresh = () => {
    const next = loadWorkspace(), session = loadWorkspaceSession();
    setWorkspace(next);
    setSessionValid(Boolean(session && next.members.some((member) => member.id === session.memberId && member.active && member.pinHash)));
    setReady(true);
  };
  useEffect(refresh, []);

  if (publicExperience) return children;
  if (!ready) return <GateFrame ar={ar}><p className="muted">{ar ? "جاري تجهيز مساحة العمل…" : "Preparing workspace…"}</p></GateFrame>;

  const firstSetup = workspace.companies.length === 0;
  const createAccess = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    if (!form.owner.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !/^\d{4,8}$/.test(form.pin)) {
      return setMessage(ar ? "أدخل اسم المسؤول وبريدًا صحيحًا ورمز دخول من 4 إلى 8 أرقام." : "Enter owner name, a valid email, and a 4–8 digit PIN.");
    }
    let company = workspace.companies.find((item) => item.id === workspace.activeCompanyId);
    let next = workspace;
    if (!company) {
      if (!form.companyAr.trim() || !form.companyEn.trim()) return setMessage(ar ? "أدخل اسم الشركة بالعربية والإنجليزية." : "Enter both company names.");
      company = { id: crypto.randomUUID(), nameAr: form.companyAr.trim(), nameEn: form.companyEn.trim(), country: "EG", currency: "EGP", fiscalYearStart: `${new Date().getFullYear()}-01-01`, active: true, createdAt: today() } satisfies Company;
      const branch = createDefaultBranch(company), year = createDefaultWorkspaceYear(company);
      next = { ...workspace, companies: [company], branches: [branch], fiscalYears: [year], activeCompanyId: company.id, activeBranchId: branch.id, activeFiscalYearId: year.id };
    }
    const email = form.email.trim().toLowerCase();
    const owner = { id: crypto.randomUUID(), companyId: company.id, name: form.owner.trim(), email, role: "owner" as const, active: true, pinHash: await hashLocalPin(email, form.pin), createdAt: today() };
    const saved = saveWorkspace({ ...next, members: [...next.members, owner] });
    if (firstSetup) saveSettings({ ...defaultSettings, companyNameAr: company.nameAr, companyNameEn: company.nameEn, defaultCurrency: company.currency });
    saveWorkspaceSession({ memberId: owner.id, companyId: company.id, signedInAt: today() });
    setWorkspace(saved); setSessionValid(true);
  };

  if (firstSetup || !hasLocalLogin(workspace)) return <GateFrame ar={ar}>
    <div className="workspace-gate-heading"><span><Building2 /></span><div><small>{ar ? "إعداد مجاني على هذا الجهاز" : "Free setup on this device"}</small><h1>{firstSetup ? (ar ? "أنشئ أول شركة" : "Create your first company") : (ar ? "فعّل الدخول المحلي" : "Enable local sign-in")}</h1><p>{ar ? "سيتم إنشاء فرع رئيسي وسنة مالية مستقلة، وحفظ كل البيانات داخل متصفحك فقط." : "A main branch and independent fiscal year will be created. Data stays in this browser only."}</p></div></div>
    <form className="grid two" onSubmit={createAccess}>
      {firstSetup && <><label>{ar ? "اسم الشركة بالعربية" : "Arabic company name"}<input value={form.companyAr} onChange={(event) => setForm({ ...form, companyAr: event.target.value })} /></label><label>{ar ? "اسم الشركة بالإنجليزية" : "English company name"}<input dir="ltr" value={form.companyEn} onChange={(event) => setForm({ ...form, companyEn: event.target.value })} /></label></>}
      <label>{ar ? "اسم المسؤول" : "Owner name"}<input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} /></label>
      <label>{ar ? "البريد المحلي" : "Local email"}<input dir="ltr" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label>{ar ? "رمز الدخول (4–8 أرقام)" : "PIN (4–8 digits)"}<input dir="ltr" type="password" inputMode="numeric" value={form.pin} onChange={(event) => setForm({ ...form, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })} /></label>
      <button className="btn btn-primary workspace-gate-submit" type="submit"><ShieldCheck size={18}/>{ar ? "إنشاء المساحة والدخول" : "Create workspace and sign in"}</button>
    </form>{message && <p className="warning error">{message}</p>}
    <p className="workspace-local-note"><LockKeyhole size={17}/>{ar ? "الدخول محلي للتجربة وليس حماية أمنية أو مزامنة بين الأجهزة. لا تستخدم رمزك البنكي أو كلمة مرور حقيقية." : "Local sign-in is for preview, not secure authentication or device sync. Do not use a real password."}</p>
  </GateFrame>;

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    const session = await authenticateLocal(login.email, login.pin);
    if (!session) return setMessage(ar ? "البريد أو رمز الدخول غير صحيح، أو المستخدم موقوف." : "Invalid email or PIN, or the user is disabled.");
    refresh();
  };
  if (!sessionValid) return <GateFrame ar={ar}>
    <div className="workspace-gate-heading"><span><KeyRound /></span><div><small>FINORA LOCAL</small><h1>{ar ? "الدخول إلى مساحة الشركة" : "Sign in to company workspace"}</h1><p>{ar ? "ادخل بالبريد ورمز الدخول المحلي المحفوظين على هذا الجهاز." : "Use the local email and PIN saved on this device."}</p></div></div>
    <form className="grid" onSubmit={signIn}><label>{ar ? "البريد" : "Email"}<input dir="ltr" type="email" autoComplete="username" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label><label>{ar ? "رمز الدخول" : "PIN"}<input dir="ltr" type="password" inputMode="numeric" autoComplete="current-password" value={login.pin} onChange={(event) => setLogin({ ...login, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })} /></label><button className="btn btn-primary" type="submit"><KeyRound size={18}/>{ar ? "دخول" : "Sign in"}</button></form>
    {message && <p className="warning error">{message}</p>}<p className="workspace-local-note"><LockKeyhole size={17}/>{ar ? "البيانات والدخول موجودان على هذا المتصفح فقط." : "Data and sign-in exist only in this browser."}</p>
  </GateFrame>;
  return children;
}

function GateFrame({ ar, children }: { ar: boolean; children: React.ReactNode }) {
  return <div className="workspace-gate" dir={ar ? "rtl" : "ltr"}><section className="workspace-gate-card">{children}</section></div>;
}
