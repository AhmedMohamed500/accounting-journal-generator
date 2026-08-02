import { describe, expect, it } from "vitest";
import { parseTransaction } from "@/lib/parser";
import { generateJournalEntry } from "@/rules";

describe("natural-language journal generator", () => {
  it("understands colloquial customer cheque collection", () => {
    const parsed = parseTransaction("حصلت شيكات من العميل احمد بمبلغ 5000 جنيه");
    expect(parsed.input).toMatchObject({ type: "customer-collection", amount: 5000, paymentMethod: "cheque", customer: "احمد" });
    expect(parsed.missingFields).toEqual([]);
    const entry = generateJournalEntry(parsed.input as Parameters<typeof generateJournalEntry>[0]);
    expect(entry.lines.find((line) => line.accountCode === "1110")?.debit).toBe(5000);
    expect(entry.lines.find((line) => line.accountCode === "1120")?.credit).toBe(5000);
  });

  it("understands supplier payment through the bank", () => {
    expect(parseTransaction("دفعت للمورد النور ٣٥٠٠ جنيه بتحويل بنكي").input).toMatchObject({
      type: "supplier-payment", amount: 3500, paymentMethod: "bank", supplier: "النور",
    });
  });

  it("understands fixed asset purchases and thousand suffixes", () => {
    expect(parseTransaction("اشترينا أجهزة كمبيوتر بمبلغ 20 ألف من البنك").input).toMatchObject({
      type: "fixed-asset-purchase", amount: 20000, paymentMethod: "bank",
    });
  });

  it("keeps VAT percentages separate from the amount", () => {
    expect(parseTransaction("بعنا بضاعة على الحساب للعميل محمد 12000 وضريبة 14%").input).toMatchObject({
      type: "credit-sale", amount: 12000, paymentMethod: "credit", vatRate: 14,
    });
  });

  it.each([
    ["اشتريت أقلام وورق تصوير بمبلغ 900 نقدي", "office-supplies-expense", "5120"],
    ["دفعت إعلان وتسويق 2500 من البنك", "marketing-expense", "5400"],
    ["سددت أتعاب المحامي 3000 نقدي", "professional-fees", "5500"],
    ["دفعت مصروف نظافة 700 من الصندوق", "general-expense", "5190"],
  ])("classifies expense wording: %s", (text, type, debitCode) => {
    const parsed = parseTransaction(text);
    expect(parsed.input.type).toBe(type);
    const entry = generateJournalEntry(parsed.input as Parameters<typeof generateJournalEntry>[0]);
    expect(entry.lines[0].accountCode).toBe(debitCode);
    expect(entry.isBalanced).toBe(true);
  });
});
