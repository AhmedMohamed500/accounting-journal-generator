import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BilingualAccountingLabels } from "@/components/i18n/bilingual-accounting-labels";

describe("global bilingual accounting labels", () => {
  it("adds English labels beside Arabic accounting terms and to options", async () => {
    const { container } = render(<div lang="ar" data-bilingual-accounting-root><BilingualAccountingLabels enabled/><table><thead><tr><th>مدين</th><th>دائن</th></tr></thead></table><select><option>الخزينة</option></select></div>);
    await waitFor(() => expect(container.querySelector("th")?.getAttribute("data-en-label")).toBe("Debit"));
    const headers = container.querySelectorAll("th");
    expect(headers[1].getAttribute("data-en-label")).toBe("Credit");
    expect(container.querySelector("option")?.label).toBe("الخزينة · Cash on hand");
  });
});
