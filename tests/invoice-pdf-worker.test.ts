import { describe, expect, it } from "vitest";
import { PDF_WORKER_URL, textFromPdfItems } from "@/lib/invoice/extract";

describe("invoice PDF reader", () => {
  it("configures the bundled PDF.js worker used by browser extraction", () => {
    expect(PDF_WORKER_URL).toContain("pdf.worker.min.mjs");
    expect(PDF_WORKER_URL.length).toBeGreaterThan(20);
  });

  it("rejoins Arabic glyphs embedded as separate PDF text items", () => {
    const glyphs = ["ﻓ", "ﺎ", "ﺗ", "ﻮ", "ر", "ة"];
    const text = textFromPdfItems(glyphs.map((glyph, index) => ({
      text: glyph,
      x: 100 - index * 8,
      y: 500,
      width: 7,
      fontSize: 12,
    })));
    expect(text.normalize("NFKC")).toBe("فاتورة");
  });
});
