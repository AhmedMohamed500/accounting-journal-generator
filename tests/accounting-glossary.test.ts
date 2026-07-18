import { describe, expect, it } from "vitest";
import { accountingGlossarySize, englishForArabic } from "@/lib/i18n/accounting-glossary";

describe("bilingual accounting glossary", () => {
  it("translates core accounting labels", () => {
    expect(englishForArabic("مدين")).toBe("Debit");
    expect(englishForArabic("دائن")).toBe("Credit");
    expect(englishForArabic("السيولة")).toBe("Liquidity");
  });

  it("includes chart accounts and journal entry types", () => {
    expect(englishForArabic("الخزينة")).toBe("Cash on hand");
    expect(englishForArabic("مصروف الصيانة والإصلاح")).toBe("Maintenance and repairs");
    expect(englishForArabic("بيع نقدي")).toBe("Cash sale");
    expect(accountingGlossarySize).toBeGreaterThan(120);
  });

  it("recognizes a translated entry title followed by a reference", () => {
    expect(englishForArabic("شراء آجل — PI-0001")).toBe("Credit purchase");
    expect(englishForArabic("1100 — الخزينة")).toBe("Cash on hand");
  });
});
