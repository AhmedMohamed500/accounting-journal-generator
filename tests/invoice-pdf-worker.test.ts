import { describe, expect, it } from "vitest";
import { PDF_WORKER_URL } from "@/lib/invoice/extract";

describe("invoice PDF reader", () => {
  it("configures the bundled PDF.js worker used by browser extraction", () => {
    expect(PDF_WORKER_URL).toContain("pdf.worker.min.mjs");
    expect(PDF_WORKER_URL.length).toBeGreaterThan(20);
  });
});
