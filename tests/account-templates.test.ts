import { describe, expect, it } from "vitest";
import { accountTemplates } from "@/data/account-templates";

describe("professional chart of accounts templates", () => {
  it.each(accountTemplates)("keeps $id codes unique and hierarchy valid", (template) => {
    const ids = new Set(template.accounts.map((account) => account.id));
    const codes = template.accounts.map((account) => account.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const account of template.accounts) {
      if (!account.parentId) continue;
      expect(ids.has(account.parentId)).toBe(true);
      expect(template.accounts.find((parent) => parent.id === account.parentId)?.type).toBe(account.type);
    }
  });

  it("uses correct contra-account normal balances", () => {
    const general = accountTemplates.find((template) => template.id === "general")!;
    expect(general.accounts.find((account) => account.id === "accumulated-depreciation")?.normalBalance).toBe("credit");
    expect(general.accounts.find((account) => account.id === "sales-returns")?.normalBalance).toBe("debit");
    expect(general.accounts.find((account) => account.id === "drawings")?.normalBalance).toBe("debit");
  });
});
