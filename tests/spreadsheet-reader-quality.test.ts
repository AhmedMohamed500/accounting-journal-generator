import {describe,expect,it} from "vitest";
import {normalizeSheet,spreadsheetCellValue} from "@/lib/spreadsheet/reader";

describe("spreadsheet reader quality",()=>{
 it("skips a title row and detects the real headers",()=>{const sheet=normalizeSheet("Sales",[["تقرير المبيعات"],[null,null,null],["التاريخ","البيان","المبلغ"],["2026-08-01","بيع",100]]);expect(sheet.headers).toEqual(["التاريخ","البيان","المبلغ"]);expect(sheet.headerRowIndex).toBe(1);expect(sheet.readDiagnostics?.titleRowsSkipped).toBe(1);});
 it("removes fully empty columns",()=>{const sheet=normalizeSheet("x",[["Name",null,"Amount"],["A",null,10]]);expect(sheet.headers).toEqual(["Name","Amount"]);expect(sheet.readDiagnostics?.blankColumnsRemoved).toBe(1);});
 it("parses Arabic digits and currency suffixes",()=>expect(spreadsheetCellValue("١٬٢٥٠٫٥٠ ج.م")).toBe(1250.5));
 it("parses accounting negatives",()=>expect(spreadsheetCellValue("(2,500.25)")).toBe(-2500.25));
 it("parses Arabic percentages",()=>expect(spreadsheetCellValue("١٤٪")).toBe(.14));
 it("preserves phone numbers with a leading zero",()=>expect(spreadsheetCellValue("01012345678")).toBe("01012345678"));
 it("parses European decimal notation",()=>expect(spreadsheetCellValue("1.250,75")).toBe(1250.75));
 it("returns diagnostics for empty sheets",()=>expect(normalizeSheet("Empty",[[null],[null]]).readDiagnostics?.headerConfidence).toBe(0));
});
