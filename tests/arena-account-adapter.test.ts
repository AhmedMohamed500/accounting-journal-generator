import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { arenaTasks } from "@/data/arena-tasks";
import { ARENA_ACCOUNT_SOURCE, createTrainingAccountSnapshot, getArenaAccountByCode, validateArenaJournal } from "@/lib/arena/account-adapter";
import { calculateHiringReadiness, financialImpactFor, isExactTaskAnswer, scoreArenaTask } from "@/lib/arena/task-engine";
import { createArenaProfile } from "@/lib/arena/profile";

const expectedLines = arenaTasks[0].expectedLines;

describe("Arena real-account adapter", () => {
  it("derives cards from FINORA's existing chart", () => {
    const snapshot = createTrainingAccountSnapshot();
    const inventory = snapshot.find((account) => account.id === "inventory");
    expect(inventory).toMatchObject({ code: "1200", nameEn: "Inventory", source: ARENA_ACCOUNT_SOURCE });
    expect(defaultAccounts.some((account) => account.id === inventory?.id && account.code === inventory.code)).toBe(true);
  });

  it("returns cloned training objects rather than mutable company objects", () => {
    const snapshot = createTrainingAccountSnapshot();
    expect(snapshot.find((account) => account.id === "bank")).not.toBe(defaultAccounts.find((account) => account.id === "bank"));
  });

  it("exposes only active postable leaf accounts", () => {
    const snapshot = createTrainingAccountSnapshot();
    expect(snapshot.some((account) => account.id === "assets")).toBe(false);
    expect(snapshot.every((account) => account.active && account.allowPosting !== false)).toBe(true);
  });

  it("resolves bilingual real accounts by code", () => {
    expect(getArenaAccountByCode("2100")).toMatchObject({ id: "payables", nameAr: "الموردون", nameEn: "Accounts payable" });
  });

  it("validates the mission through the existing journal validator", () => {
    expect(validateArenaJournal(expectedLines)).toMatchObject({ valid: true, totalDebit: 28500, totalCredit: 28500 });
  });

  it("rejects unknown and non-postable parent accounts", () => {
    expect(validateArenaJournal([{ accountCode: "9999", side: "debit", amount: 1 }, { accountCode: "2100", side: "credit", amount: 1 }]).errors.some((error) => error.code === "unknown-account")).toBe(true);
    expect(validateArenaJournal([{ accountCode: "11", side: "debit", amount: 1 }, { accountCode: "2100", side: "credit", amount: 1 }]).errors.some((error) => error.code === "blocked-account")).toBe(true);
  });
});

describe("Arena task assessment", () => {
  it("recognizes only the exact accounting answer", () => {
    expect(isExactTaskAnswer(arenaTasks[0], expectedLines)).toBe(true);
    expect(isExactTaskAnswer(arenaTasks[0], expectedLines.map((line, index) => index === 0 ? { ...line, amount: 24000 } : line))).toBe(false);
  });

  it("awards a perfect accounting result without collapsing all dimensions", () => {
    const score = scoreArenaTask(arenaTasks[0], expectedLines, 0, 240);
    expect(score).toMatchObject({ accountingAccuracy: 100, accountSelection: 100, debitCreditAccuracy: 100, amountAccuracy: 100, hints: 100 });
    expect(score.total).toBeGreaterThanOrEqual(90);
  });

  it("explains the financial impact using each account's normal balance", () => {
    expect(financialImpactFor(expectedLines)).toEqual(expect.arrayContaining([
      expect.objectContaining({ accountCode: "1200", type: "asset", direction: "increase", amount: 25000 }),
      expect.objectContaining({ accountCode: "2100", type: "liability", direction: "increase", amount: 28500 }),
    ]));
  });

  it("keeps hiring readiness evidence-based and bounded", () => {
    const readiness = calculateHiringReadiness(createArenaProfile());
    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.level).toBe("building");
  });
});
