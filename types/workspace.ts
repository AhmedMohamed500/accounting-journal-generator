export type MemberRole = "owner" | "manager" | "accountant" | "reviewer" | "viewer";
export interface Company { id: string; nameAr: string; nameEn: string; country: string; currency: string; fiscalYearStart: string; taxNumber?: string; active: boolean; createdAt: string }
export interface WorkspaceMember { id: string; companyId: string; name: string; email: string; role: MemberRole; active: boolean; createdAt: string }
export interface WorkspaceData { companies: Company[]; members: WorkspaceMember[]; activeCompanyId?: string }
