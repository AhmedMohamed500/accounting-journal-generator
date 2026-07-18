import { describe, expect, it } from "vitest";
import { analyzeSheet } from "@/lib/spreadsheet/analyzer";

describe("horizontal expense analysis", () => {
  it("uses category columns and excludes the total column", () => {
    const result = analyzeSheet({ name: "مصروفات", headers: ["كهرباء", "مياه", "غاز", "سيارة", "الإجمالي"], rows: [[5000, 4000, 3000, 2000, 14000], [.3571, .2857, .2143, .1429, null]] });
    expect(result.breakdown?.total).toBe(14000);
    expect(result.breakdown?.items).toHaveLength(4);
    expect(result.breakdown?.items[0]).toMatchObject({ label: "كهرباء", value: 5000, percentage: 35.71 });
  });
});
