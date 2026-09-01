"use client";

import Link from "next/link";
import { Building2, CalendarRange, GitBranch, LogOut, Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadWorkspace, loadWorkspaceSession, saveWorkspaceSession, setActiveWorkspaceScope, subscribeToWorkspace } from "@/lib/storage/workspace";
import type { Locale, WorkspaceData } from "@/types";

export function WorkspaceScopeBar({ locale }: { locale: Locale }) {
  const ar = locale === "ar", pathname = usePathname(), [data, setData] = useState<WorkspaceData>({ companies: [], branches: [], fiscalYears: [], members: [] });
  useEffect(() => { setData(loadWorkspace()); return subscribeToWorkspace(setData); }, []);
  if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/missions`) || pathname.startsWith(`/${locale}/money-flow`) || !data.activeCompanyId || !loadWorkspaceSession()) return null;
  const company = data.companies.find((item) => item.id === data.activeCompanyId), branches = data.branches.filter((item) => item.companyId === company?.id && item.active), years = data.fiscalYears.filter((item) => item.companyId === company?.id && item.active);
  const change = (companyId: string, branchId?: string, yearId?: string) => { setActiveWorkspaceScope(companyId, branchId, yearId); window.location.reload(); };
  return <aside className="workspace-scope-bar no-print" data-no-bilingual><div className="container workspace-scope-inner">
    <div className="workspace-scope-title"><Settings2 size={17}/><span><small>{ar ? "مساحة العمل النشطة" : "Active workspace"}</small><b>{ar ? company?.nameAr : company?.nameEn}</b></span></div>
    <label><Building2 size={15}/><span>{ar ? "الشركة" : "Company"}</span><select aria-label={ar ? "الشركة النشطة" : "Active company"} value={company?.id || ""} onChange={(event) => change(event.target.value)}>{data.companies.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{ar ? item.nameAr : item.nameEn}</option>)}</select></label>
    <label><GitBranch size={15}/><span>{ar ? "الفرع" : "Branch"}</span><select aria-label={ar ? "الفرع النشط" : "Active branch"} value={data.activeBranchId || ""} onChange={(event) => change(company!.id, event.target.value, data.activeFiscalYearId)}>{branches.map((item) => <option value={item.id} key={item.id}>{ar ? item.nameAr : item.nameEn}</option>)}</select></label>
    <label><CalendarRange size={15}/><span>{ar ? "السنة" : "Fiscal year"}</span><select aria-label={ar ? "السنة المالية النشطة" : "Active fiscal year"} value={data.activeFiscalYearId || ""} onChange={(event) => change(company!.id, data.activeBranchId, event.target.value)}>{years.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
    <Link className="btn workspace-manage-link" href={`/${locale}/workspace`}>{ar ? "إدارة" : "Manage"}</Link>
    <button className="btn icon-btn" title={ar ? "تسجيل الخروج" : "Sign out"} onClick={() => { saveWorkspaceSession(); window.location.href = `/${locale}/dashboard`; }}><LogOut size={17}/></button>
  </div></aside>;
}
