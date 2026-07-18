import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpreadsheetAnalyzer } from "@/components/spreadsheet/spreadsheet-analyzer";

describe("spreadsheet analysis with repeated labels", () => {
  afterEach(() => vi.restoreAllMocks());
  it("renders duplicate headers and categories without React key warnings", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined), csv = "سلف عاملين,سلف عاملين,مصروف\n100,200,300\n50,60,70";
    const file = new File([csv], "duplicate-labels.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });
    const { container, getByText } = render(<SpreadsheetAnalyzer locale="ar" />), input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(getByText("تم تحليل 1 ورقة.")).toBeInTheDocument());
    expect(error.mock.calls.flat().join(" ")).not.toContain("same key");
  });
});
