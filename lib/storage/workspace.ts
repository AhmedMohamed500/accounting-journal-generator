import type { MemberRole, WorkspaceData } from "@/types";
export const WORKSPACE_KEY = "accountant-workspace";
export const rolePermissions: Record<MemberRole, string[]> = { owner: ["manage-company", "manage-team", "create", "review", "post", "reports"], manager: ["manage-team", "create", "review", "post", "reports"], accountant: ["create", "reports"], reviewer: ["review", "reports"], viewer: ["reports"] };
export function loadWorkspace(): WorkspaceData { if (typeof window === "undefined") return { companies: [], members: [] }; try { return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{"companies":[],"members":[]}') as WorkspaceData; } catch { return { companies: [], members: [] }; } }
export function saveWorkspace(data: WorkspaceData) { localStorage.setItem(WORKSPACE_KEY, JSON.stringify(data)); }
export function can(role: MemberRole, permission: string) { return rolePermissions[role].includes(permission); }
