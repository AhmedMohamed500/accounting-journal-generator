import { beforeEach, describe, expect, it } from "vitest";
import { companyKey, operationalKey } from "@/lib/storage/accounting";
import {
  activeWorkspaceScope,
  createDefaultBranch,
  createDefaultWorkspaceYear,
  normalizeWorkspace,
  saveWorkspace,
  setActiveWorkspaceScope,
} from "@/lib/storage/workspace";
import type { Company, WorkspaceData } from "@/types";

const company = (id: string): Company => ({ id, nameAr: `شركة ${id}`, nameEn: `Company ${id}`, country: "EG", currency: "EGP", fiscalYearStart: "2026-01-01", active: true, createdAt: "2026-01-01T00:00:00.000Z" });

function workspace(): WorkspaceData {
  const first = company("c1"), second = company("c2");
  const firstBranch = createDefaultBranch(first), secondBranch = createDefaultBranch(second);
  const firstYear = createDefaultWorkspaceYear(first, 2026), nextYear = createDefaultWorkspaceYear(first, 2027), secondYear = createDefaultWorkspaceYear(second, 2026);
  return { companies: [first, second], branches: [firstBranch, { ...firstBranch, id: "c1-alex", code: "ALX", nameAr: "الإسكندرية", nameEn: "Alexandria" }, secondBranch], fiscalYears: [firstYear, nextYear, secondYear], members: [], activeCompanyId: first.id, activeBranchId: firstBranch.id, activeFiscalYearId: firstYear.id };
}

describe("local workspace isolation", () => {
  beforeEach(() => localStorage.clear());

  it("upgrades old companies with a default branch and fiscal year", () => {
    const first = company("legacy");
    const normalized = normalizeWorkspace({ companies: [first], members: [] });
    expect(normalized.branches).toHaveLength(1);
    expect(normalized.fiscalYears).toHaveLength(1);
    expect(normalized.activeBranchId).toBe("legacy-main");
  });

  it("keeps company master data shared while operational data changes by branch and year", () => {
    saveWorkspace(workspace());
    const companyAccounts = companyKey("journal-chart-accounts");
    const firstScope = operationalKey("journal-recent");
    setActiveWorkspaceScope("c1", "c1-alex", "c1-fy-2027");
    const secondScope = operationalKey("journal-recent");
    expect(companyKey("journal-chart-accounts")).toBe(companyAccounts);
    expect(secondScope).not.toBe(firstScope);
    expect(secondScope).toContain(":c1:branch:c1-alex:year:c1-fy-2027");
  });

  it("switches all three active scope dimensions safely", () => {
    saveWorkspace(workspace());
    setActiveWorkspaceScope("c2");
    expect(activeWorkspaceScope()).toEqual({ companyId: "c2", branchId: "c2-main", fiscalYearId: "c2-fy-2026" });
  });
});
