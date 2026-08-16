import type {
  Company,
  MemberRole,
  WorkspaceBranch,
  WorkspaceData,
  WorkspaceFiscalYear,
  WorkspaceScope,
  WorkspaceSession,
} from "@/types";

export const WORKSPACE_KEY = "accountant-workspace";
export const WORKSPACE_SESSION_KEY = "accountant-local-session";
export const WORKSPACE_UPDATED = "workspace-updated";

export const rolePermissions: Record<MemberRole, string[]> = {
  owner: ["manage-company", "manage-team", "create", "review", "post", "reports"],
  manager: ["manage-team", "create", "review", "post", "reports"],
  accountant: ["create", "reports"],
  reviewer: ["review", "reports"],
  viewer: ["reports"],
};

const emptyWorkspace = (): WorkspaceData => ({ companies: [], branches: [], fiscalYears: [], members: [] });
const currentYear = () => new Date().getFullYear();

export function createDefaultBranch(company: Company): WorkspaceBranch {
  return {
    id: `${company.id}-main`, companyId: company.id, code: "MAIN", nameAr: "الفرع الرئيسي",
    nameEn: "Main branch", active: true, createdAt: company.createdAt,
  };
}

export function createDefaultWorkspaceYear(company: Company, year = currentYear()): WorkspaceFiscalYear {
  const startMonth = Math.max(0, Math.min(11, Number(company.fiscalYearStart.slice(5, 7) || "1") - 1));
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year + 1, startMonth, 0));
  return {
    id: `${company.id}-fy-${year}`, companyId: company.id, label: String(year),
    startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10),
    active: true, createdAt: company.createdAt,
  };
}

export function normalizeWorkspace(value?: Partial<WorkspaceData>): WorkspaceData {
  const companies = Array.isArray(value?.companies) ? value.companies : [];
  const members = Array.isArray(value?.members) ? value.members : [];
  const branches = Array.isArray(value?.branches) ? [...value.branches] : [];
  const fiscalYears = Array.isArray(value?.fiscalYears) ? [...value.fiscalYears] : [];
  for (const company of companies) {
    if (!branches.some((item) => item.companyId === company.id)) branches.push(createDefaultBranch(company));
    if (!fiscalYears.some((item) => item.companyId === company.id)) fiscalYears.push(createDefaultWorkspaceYear(company));
  }
  const activeCompanyId = companies.some((item) => item.id === value?.activeCompanyId)
    ? value?.activeCompanyId : companies.find((item) => item.active)?.id || companies[0]?.id;
  const companyBranches = branches.filter((item) => item.companyId === activeCompanyId && item.active);
  const companyYears = fiscalYears.filter((item) => item.companyId === activeCompanyId && item.active);
  const activeBranchId = companyBranches.some((item) => item.id === value?.activeBranchId)
    ? value?.activeBranchId : companyBranches[0]?.id;
  const activeFiscalYearId = companyYears.some((item) => item.id === value?.activeFiscalYearId)
    ? value?.activeFiscalYearId : companyYears[0]?.id;
  return { companies, branches, fiscalYears, members, activeCompanyId, activeBranchId, activeFiscalYearId };
}

export function loadWorkspace(): WorkspaceData {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const parsed = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "{}") as Partial<WorkspaceData>;
    const normalized = normalizeWorkspace(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) localStorage.setItem(WORKSPACE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch { return emptyWorkspace(); }
}

export function saveWorkspace(data: WorkspaceData) {
  const normalized = normalizeWorkspace(data);
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(WORKSPACE_UPDATED, { detail: normalized }));
  return normalized;
}

export function subscribeToWorkspace(callback: (data: WorkspaceData) => void) {
  if (typeof window === "undefined") return () => undefined;
  const refresh = () => callback(loadWorkspace());
  window.addEventListener(WORKSPACE_UPDATED, refresh);
  window.addEventListener("storage", refresh);
  return () => { window.removeEventListener(WORKSPACE_UPDATED, refresh); window.removeEventListener("storage", refresh); };
}

export function activeWorkspaceScope(): WorkspaceScope {
  const workspace = loadWorkspace();
  return {
    companyId: workspace.activeCompanyId || "personal",
    branchId: workspace.activeBranchId || "main",
    fiscalYearId: workspace.activeFiscalYearId || String(currentYear()),
  };
}

export function setActiveWorkspaceScope(companyId: string, branchId?: string, fiscalYearId?: string) {
  const workspace = loadWorkspace();
  const branch = workspace.branches.find((item) => item.id === branchId && item.companyId === companyId && item.active)
    || workspace.branches.find((item) => item.companyId === companyId && item.active);
  const fiscalYear = workspace.fiscalYears.find((item) => item.id === fiscalYearId && item.companyId === companyId && item.active)
    || workspace.fiscalYears.find((item) => item.companyId === companyId && item.active);
  return saveWorkspace({ ...workspace, activeCompanyId: companyId, activeBranchId: branch?.id, activeFiscalYearId: fiscalYear?.id });
}

export function loadWorkspaceSession(): WorkspaceSession | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = JSON.parse(localStorage.getItem(WORKSPACE_SESSION_KEY) || "null") as WorkspaceSession | null;
    return value || undefined;
  } catch { return undefined; }
}

export function saveWorkspaceSession(session?: WorkspaceSession) {
  if (session) localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(WORKSPACE_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(WORKSPACE_UPDATED));
}

export async function hashLocalPin(email: string, pin: string) {
  const bytes = new TextEncoder().encode(`finora-local:${email.trim().toLowerCase()}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function authenticateLocal(email: string, pin: string) {
  const workspace = loadWorkspace(), normalizedEmail = email.trim().toLowerCase();
  const pinHash = await hashLocalPin(normalizedEmail, pin);
  const candidates = workspace.members.filter((member) => member.active && member.email === normalizedEmail && member.pinHash === pinHash);
  if (!candidates.length) return undefined;
  const member = candidates.find((item) => item.companyId === workspace.activeCompanyId) || candidates[0];
  const session = { memberId: member.id, companyId: member.companyId, signedInAt: new Date().toISOString() } satisfies WorkspaceSession;
  saveWorkspace({ ...workspace, members: workspace.members.map((item) => item.id === member.id ? { ...item, lastLoginAt: session.signedInAt } : item) });
  setActiveWorkspaceScope(member.companyId);
  saveWorkspaceSession(session);
  return session;
}

export function hasLocalLogin(data = loadWorkspace()) { return data.members.some((member) => member.active && Boolean(member.pinHash)); }
export function can(role: MemberRole, permission: string) { return rolePermissions[role].includes(permission); }
