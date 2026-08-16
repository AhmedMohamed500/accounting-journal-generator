"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarRange, GitBranch, KeyRound, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  createDefaultBranch,
  createDefaultWorkspaceYear,
  hashLocalPin,
  loadWorkspace,
  rolePermissions,
  saveWorkspace,
  setActiveWorkspaceScope,
} from "@/lib/storage/workspace";
import type { Company, Locale, MemberRole, WorkspaceBranch, WorkspaceData, WorkspaceMember } from "@/types";
import { defaultSettings, saveSettings } from "@/lib/storage/settings";

const now = () => new Date().toISOString();
const newCompany = (): Company => ({ id: crypto.randomUUID(), nameAr: "", nameEn: "", country: "EG", currency: "EGP", fiscalYearStart: `${new Date().getFullYear()}-01-01`, active: true, createdAt: now() });
const roles: MemberRole[] = ["owner", "manager", "accountant", "reviewer", "viewer"];

export function WorkspaceManager({ locale }: { locale: Locale }) {
  const ar = locale === "ar", [data, setData] = useState<WorkspaceData>({ companies: [], branches: [], fiscalYears: [], members: [] });
  const [company, setCompany] = useState(newCompany), [branch, setBranch] = useState({ code: "", nameAr: "", nameEn: "" }), [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [member, setMember] = useState({ name: "", email: "", role: "accountant" as MemberRole, pin: "" }), [error, setError] = useState("");
  useEffect(() => { setData(loadWorkspace()); }, []);
  const active = data.companies.find((item) => item.id === data.activeCompanyId);
  const companyBranches = useMemo(() => data.branches.filter((item) => item.companyId === active?.id), [data.branches, active?.id]);
  const companyYears = useMemo(() => data.fiscalYears.filter((item) => item.companyId === active?.id), [data.fiscalYears, active?.id]);
  const commit = (next: WorkspaceData) => setData(saveWorkspace(next));
  const roleLabel = (role: MemberRole) => ar ? ({ owner: "المالك", manager: "مدير", accountant: "محاسب", reviewer: "مراجع", viewer: "مشاهدة فقط" }[role]) : role;

  const addCompany = () => {
    if (!company.nameAr.trim() || !company.nameEn.trim()) return setError(ar ? "أدخل اسم الشركة بالعربية والإنجليزية." : "Enter both company names.");
    const nextCompany = { ...company, nameAr: company.nameAr.trim(), nameEn: company.nameEn.trim() }, main = createDefaultBranch(nextCompany), fiscal = createDefaultWorkspaceYear(nextCompany);
    commit({ ...data, companies: [...data.companies, nextCompany], branches: [...data.branches, main], fiscalYears: [...data.fiscalYears, fiscal], activeCompanyId: nextCompany.id, activeBranchId: main.id, activeFiscalYearId: fiscal.id });
    saveSettings({ ...defaultSettings, companyNameAr: nextCompany.nameAr, companyNameEn: nextCompany.nameEn, defaultCurrency: nextCompany.currency });
    setCompany(newCompany()); setError("");
  };
  const selectCompany = (companyId: string) => setData(setActiveWorkspaceScope(companyId));
  const addBranch = () => {
    if (!active || !branch.code.trim() || !branch.nameAr.trim() || !branch.nameEn.trim()) return setError(ar ? "أدخل كود الفرع واسمه بالعربية والإنجليزية." : "Enter branch code and both names.");
    if (companyBranches.some((item) => item.code.toLowerCase() === branch.code.trim().toLowerCase())) return setError(ar ? "كود الفرع مستخدم داخل الشركة." : "Branch code already exists.");
    const next: WorkspaceBranch = { id: crypto.randomUUID(), companyId: active.id, code: branch.code.trim().toUpperCase(), nameAr: branch.nameAr.trim(), nameEn: branch.nameEn.trim(), active: true, createdAt: now() };
    commit({ ...data, branches: [...data.branches, next] }); setBranch({ code: "", nameAr: "", nameEn: "" }); setError("");
  };
  const addYear = () => {
    if (!active || !/^\d{4}$/.test(year)) return setError(ar ? "أدخل سنة صحيحة من 4 أرقام." : "Enter a valid four-digit year.");
    if (companyYears.some((item) => item.label === year)) return setError(ar ? "السنة المالية موجودة بالفعل." : "Fiscal year already exists.");
    const next = createDefaultWorkspaceYear(active, Number(year)); commit({ ...data, fiscalYears: [...data.fiscalYears, next] }); setYear(String(Number(year) + 1)); setError("");
  };
  const addMember = async () => {
    const email = member.email.trim().toLowerCase();
    if (!active || !member.name.trim() || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{4,8}$/.test(member.pin)) return setError(ar ? "اختر شركة وأدخل الاسم والبريد ورمز دخول من 4 إلى 8 أرقام." : "Select a company and enter name, email, and a 4–8 digit PIN.");
    if (data.members.some((item) => item.companyId === active.id && item.email === email)) return setError(ar ? "هذا البريد مسجل داخل الشركة." : "This email already exists in the company.");
    const next: WorkspaceMember = { id: crypto.randomUUID(), companyId: active.id, name: member.name.trim(), email, role: member.role, active: true, pinHash: await hashLocalPin(email, member.pin), createdAt: now() };
    commit({ ...data, members: [...data.members, next] }); setMember({ name: "", email: "", role: "accountant", pin: "" }); setError("");
  };

  return <div className="grid workspace-manager">
    <section className="card"><div className="workspace-section-head"><div><h2><Building2 size={20}/>{ar ? "الشركات" : "Companies"}</h2><p className="muted">{ar ? "كل شركة لها دليل حسابات وإعدادات وبيانات تشغيل مستقلة." : "Each company has independent accounts, settings, and operational data."}</p></div><span className="badge">{data.companies.length}</span></div>
      <div className="grid three"><label>{ar ? "اسم الشركة بالعربية" : "Arabic name"}<input value={company.nameAr} onChange={(event) => setCompany({ ...company, nameAr: event.target.value })}/></label><label>{ar ? "اسم الشركة بالإنجليزية" : "English name"}<input dir="ltr" value={company.nameEn} onChange={(event) => setCompany({ ...company, nameEn: event.target.value })}/></label><label>{ar ? "العملة" : "Currency"}<select value={company.currency} onChange={(event) => setCompany({ ...company, currency: event.target.value })}>{["EGP", "USD", "EUR", "SAR", "AED", "KWD", "QAR", "GBP"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <button className="btn btn-primary" onClick={addCompany}><Plus size={17}/>{ar ? "إضافة شركة مستقلة" : "Add independent company"}</button>
      <div className="grid three section">{data.companies.map((item) => <article className={`workspace-company-card ${item.id === active?.id ? "active" : ""}`} key={item.id}><span className="badge">{item.id === active?.id ? (ar ? "نشطة الآن" : "Active now") : item.currency}</span><h3>{ar ? item.nameAr : item.nameEn}</h3><small dir="ltr">{item.nameEn}</small><button className="btn" disabled={item.id === active?.id} onClick={() => selectCompany(item.id)}>{ar ? "فتح الشركة" : "Open company"}</button></article>)}</div>
    </section>

    {active && <><section className="card"><div className="workspace-section-head"><div><h2><GitBranch size={20}/>{ar ? "فروع الشركة" : "Company branches"}</h2><p className="muted">{ar ? "القيود والمستندات والبنك والعهد منفصلة لكل فرع." : "Entries, documents, banking, and custody are isolated by branch."}</p></div><span className="badge">{companyBranches.length}</span></div>
      <div className="grid three"><label>{ar ? "كود الفرع" : "Branch code"}<input dir="ltr" value={branch.code} onChange={(event) => setBranch({ ...branch, code: event.target.value })}/></label><label>{ar ? "اسم الفرع بالعربية" : "Arabic name"}<input value={branch.nameAr} onChange={(event) => setBranch({ ...branch, nameAr: event.target.value })}/></label><label>{ar ? "اسم الفرع بالإنجليزية" : "English name"}<input dir="ltr" value={branch.nameEn} onChange={(event) => setBranch({ ...branch, nameEn: event.target.value })}/></label></div><button className="btn btn-primary" onClick={addBranch}><Plus size={17}/>{ar ? "إضافة فرع" : "Add branch"}</button>
      <div className="workspace-chip-list">{companyBranches.map((item) => <button className={item.id === data.activeBranchId ? "active" : ""} key={item.id} onClick={() => { setData(setActiveWorkspaceScope(active.id, item.id, data.activeFiscalYearId)); }}><GitBranch size={16}/><span><b>{ar ? item.nameAr : item.nameEn}</b><small dir="ltr">{item.code}</small></span></button>)}</div>
    </section>

    <section className="card"><div className="workspace-section-head"><div><h2><CalendarRange size={20}/>{ar ? "السنوات المالية" : "Fiscal years"}</h2><p className="muted">{ar ? "كل سنة لها قيود وتقارير ودورة مستندية منفصلة." : "Each year has independent entries, reports, and document cycle."}</p></div><span className="badge">{companyYears.length}</span></div>
      <div className="actions"><input className="workspace-year-input" dir="ltr" type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(event.target.value)}/><button className="btn btn-primary" onClick={addYear}><Plus size={17}/>{ar ? "إضافة سنة مالية" : "Add fiscal year"}</button></div>
      <div className="workspace-chip-list">{companyYears.map((item) => <button className={item.id === data.activeFiscalYearId ? "active" : ""} key={item.id} onClick={() => setData(setActiveWorkspaceScope(active.id, data.activeBranchId, item.id))}><CalendarRange size={16}/><span><b>{item.label}</b><small dir="ltr">{item.startDate} → {item.endDate}</small></span></button>)}</div>
    </section>

    <section className="card"><div className="workspace-section-head"><div><h2><Users size={20}/>{ar ? "فريق الشركة والدخول" : "Team & sign-in"}</h2><p className="muted">{ar ? "أنشئ دخولًا محليًا لكل عضو وحدد دوره." : "Create local access for each member and assign a role."}</p></div><span className="badge">{data.members.filter((item) => item.companyId === active.id).length}</span></div>
      <div className="grid four"><label>{ar ? "الاسم" : "Name"}<input value={member.name} onChange={(event) => setMember({ ...member, name: event.target.value })}/></label><label>{ar ? "البريد" : "Email"}<input dir="ltr" type="email" value={member.email} onChange={(event) => setMember({ ...member, email: event.target.value })}/></label><label>{ar ? "الدور" : "Role"}<select value={member.role} onChange={(event) => setMember({ ...member, role: event.target.value as MemberRole })}>{roles.map((role) => <option value={role} key={role}>{roleLabel(role)}</option>)}</select></label><label>{ar ? "رمز الدخول" : "PIN"}<input dir="ltr" type="password" inputMode="numeric" value={member.pin} onChange={(event) => setMember({ ...member, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })}/></label></div><button className="btn btn-primary" onClick={addMember}><KeyRound size={17}/>{ar ? "إضافة مستخدم محلي" : "Add local user"}</button>
      <div className="table-wrap section"><table><thead><tr><th>{ar ? "المستخدم" : "User"}</th><th>{ar ? "الدور" : "Role"}</th><th>{ar ? "الصلاحيات" : "Permissions"}</th><th>{ar ? "الحالة" : "Status"}</th><th></th></tr></thead><tbody>{data.members.filter((item) => item.companyId === active.id).map((item) => <tr key={item.id}><td><b>{item.name}</b><small className="block muted" dir="ltr">{item.email}</small></td><td><select value={item.role} onChange={(event) => commit({ ...data, members: data.members.map((current) => current.id === item.id ? { ...current, role: event.target.value as MemberRole } : current) })}>{roles.map((role) => <option value={role} key={role}>{roleLabel(role)}</option>)}</select></td><td><small>{rolePermissions[item.role].join(" · ")}</small></td><td><button className="btn" onClick={() => commit({ ...data, members: data.members.map((current) => current.id === item.id ? { ...current, active: !current.active } : current) })}>{item.active ? (ar ? "نشط" : "Active") : (ar ? "موقوف" : "Disabled")}</button></td><td><button className="btn btn-danger" aria-label={ar ? "حذف المستخدم" : "Delete user"} onClick={() => commit({ ...data, members: data.members.filter((current) => current.id !== item.id) })}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
    </section></>}
    {error && <p className="warning error">{error}</p>}
    <section className="card workspace-security-note"><ShieldCheck/><div><h3>{ar ? "حدود النسخة المحلية" : "Local version limits"}</h3><p>{ar ? "الفصل يعمل فعليًا داخل هذا المتصفح، لكنه ليس أمانًا حقيقيًا ولا يعمل بين أجهزة مختلفة. استخدم النسخ الاحتياطي بانتظام، ولا تستخدم كلمات مرور حقيقية." : "Isolation works inside this browser, but it is not real security or cross-device access. Back up regularly and do not use real passwords."}</p></div></section>
  </div>;
}
