import { describe, expect, it } from "vitest";
import { accountLearningGuide, findAccountLearningGuide } from "@/data/account-learning-guide";

describe("account learning guide", () => {
  it("covers the main financial statement account families", () => {
    expect(accountLearningGuide.length).toBeGreaterThanOrEqual(90);
    expect(new Set(accountLearningGuide.map((item) => item.code)).size).toBe(accountLearningGuide.length);
    for (const category of ["assets", "liabilities", "equity", "revenue", "expenses", "contra"]) {
      expect(accountLearningGuide.some((item) => item.category === category)).toBe(true);
    }
  });

  it("keeps normal balance and movement rules consistent", () => {
    for (const account of accountLearningGuide) {
      expect(account.increaseSideAr).toBe(account.normalAr === "مدينة" ? "مدين" : "دائن");
      expect(account.decreaseSideAr).toBe(account.normalAr === "مدينة" ? "دائن" : "مدين");
      expect(account.statementAr.length).toBeGreaterThan(10);
      expect(account.documentsAr.length).toBeGreaterThan(10);
      expect(account.cycleAr).toContain("←");
    }
  });

  it("resolves accounts used by teaching entries", () => {
    expect(findAccountLearningGuide("البنك", "Bank")?.code).toBe("1110");
    expect(findAccountLearningGuide("الموردون", "Accounts payable")?.code).toBe("2100");
    expect(findAccountLearningGuide("مصروف الإيجار", "Rent expense")?.code).toBe("5100");
  });
});
