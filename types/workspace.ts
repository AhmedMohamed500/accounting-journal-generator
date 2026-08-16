export type MemberRole = "owner" | "manager" | "accountant" | "reviewer" | "viewer";

export interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  country: string;
  currency: string;
  fiscalYearStart: string;
  taxNumber?: string;
  active: boolean;
  createdAt: string;
}

export interface WorkspaceBranch {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  active: boolean;
  createdAt: string;
}

export interface WorkspaceFiscalYear {
  id: string;
  companyId: string;
  label: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: MemberRole;
  active: boolean;
  pinHash?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface WorkspaceSession {
  memberId: string;
  companyId: string;
  signedInAt: string;
}

export interface WorkspaceData {
  companies: Company[];
  branches: WorkspaceBranch[];
  fiscalYears: WorkspaceFiscalYear[];
  members: WorkspaceMember[];
  activeCompanyId?: string;
  activeBranchId?: string;
  activeFiscalYearId?: string;
}

export interface WorkspaceScope {
  companyId: string;
  branchId: string;
  fiscalYearId: string;
}
