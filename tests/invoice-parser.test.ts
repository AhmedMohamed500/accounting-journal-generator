import { describe, expect, it } from "vitest";
import { parseInvoiceText } from "@/lib/invoice/parser";

describe("invoice extraction", () => {
  it("extracts English invoice totals", () => {
    const invoice = parseInvoiceText("Supplier: Nile Supplies\nInvoice No: INV-100\nDate: 2026-07-12\nSubtotal: 10,000\nVAT amount: 1,400\nGrand Total: 11,400 EGP");
    expect(invoice.supplier).toBe("Nile Supplies");
    expect(invoice.net).toBe(10000);
    expect(invoice.vat).toBe(1400);
    expect(invoice.total).toBe(11400);
  });

  it("extracts Arabic invoice totals", () => {
    const invoice = parseInvoiceText("المورد: شركة النور\nرقم الفاتورة: ١٢٣٤\nالتاريخ: 2026-07-12\nالصافي: ١٠,٠٠٠\nقيمة الضريبة: ١,٤٠٠\nإجمالي الفاتورة: ١١,٤٠٠");
    expect(invoice.net).toBe(10000);
    expect(invoice.total).toBe(11400);
  });

  it("extracts dates and detailed line items", () => {
    const invoice = parseInvoiceText([
      "Supplier: Smart Office",
      "Invoice No: SO-22",
      "Date: 12/07/2026",
      "Due Date: 27/07/2026",
      "Blue pens 2 100 14% 228",
      "Printer paper 1 500 14% 570",
      "Subtotal: 700",
      "VAT amount: 98",
      "Grand Total: 798 EGP",
    ].join("\n"));

    expect(invoice.date).toBe("2026-07-12");
    expect(invoice.dueDate).toBe("2026-07-27");
    expect(invoice.lines).toHaveLength(2);
    expect(invoice.lines[0]).toMatchObject({ description: "Blue pens", quantity: 2, unitPrice: 100, net: 200, vat: 28, total: 228 });
    expect(invoice.lines[1]).toMatchObject({ description: "Printer paper", quantity: 1, unitPrice: 500, net: 500, vat: 70, total: 570 });
  });

  it("handles invoice rows that include net and VAT columns", () => {
    const invoice = parseInvoiceText([
      "Supplier: Cairo Office Supplies",
      "Invoice No: CO-77",
      "Invoice Date: 15/07/2026",
      "Printer paper 2 100 200 28 228",
      "Subtotal: 200",
      "VAT amount: 28",
      "Grand Total: 228 EGP",
    ].join("\n"));

    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lines[0]).toMatchObject({ description: "Printer paper", quantity: 2, unitPrice: 100, net: 200, vat: 28, total: 228 });
  });

  it("reads Arabic values placed before their labels", () => {
    const invoice = parseInvoiceText([
      "فاتورة ضريبية",
      "شركة النور : المورد",
      "INV-44 : رقم الفاتورة",
      "2026-07-15 : تاريخ الفاتورة",
      "10,000 : الصافي",
      "1,400 : قيمة الضريبة",
      "11,400 : إجمالي الفاتورة",
    ].join("\n"));

    expect(invoice.supplier).toBe("شركة النور");
    expect(invoice.net).toBe(10000);
    expect(invoice.vat).toBe(1400);
    expect(invoice.total).toBe(11400);
  });

  it("warns when an uploaded document does not look like an invoice", () => {
    const document = parseInvoiceText("Employee attendance report for July");
    expect(document.warnings).toContain("possibly-not-invoice");
  });

  it("does not turn report dates and payment metadata into invoice lines", () => {
    const report = parseInvoiceText([
      "ALL Sectors ALL Areas Detail Orders List",
      "Working Date: 15/02/2025 16/02/2025",
      "قرية عبد المجيد 16 2 2025",
      "VISA/MASTER طريقة الدفع 9 35 315",
      "Page 1 1 44",
    ].join("\n"));

    expect(report.lines).toHaveLength(0);
    expect(report.date).toBe("");
    expect(report.total).toBe(0);
    expect(report.warnings).toContain("possibly-not-invoice");
  });

  it("rebuilds Arabic RTL line items when OCR returns the numeric columns in reverse order", () => {
    const invoice = parseInvoiceText([
      "فاتورة ضريبية",
      "المورد: شركة النور للتوريدات",
      "رقم الفاتورة: INV-88",
      "تاريخ الفاتورة: 2026-07-15",
      "228 28 200 100 2 أقلام زرقاء",
      "الصافي: 200",
      "قيمة الضريبة: 28",
      "إجمالي الفاتورة: 228",
    ].join("\n"));
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lines[0]).toMatchObject({ description: "أقلام زرقاء", quantity: 2, unitPrice: 100, net: 200, vat: 28, total: 228 });
  });
});
