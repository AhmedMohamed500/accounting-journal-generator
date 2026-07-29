import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/data/accounts";
import { custodyOutstanding, custodyReimbursementDue, issueCustody, reimburseCustody, replenishPermanentCustody, settleCustody } from "@/lib/custody/settlement";

const issue = () => issueCustody({ employee: "أحمد محمد", purpose: "شراء أدوات مكتبية", issueDate: "2026-07-13", amount: 1000, currency: "EGP", paymentAccountId: "cash" }, defaultAccounts);

describe("employee custody workflow", () => {
  it("includes a dedicated office supplies expense account", () => {
    expect(defaultAccounts.find((account) => account.id === "office-supplies")).toMatchObject({ code: "5120", type: "expense", allowPosting: true });
  });

  it("posts the custody issue as a balanced entry", () => {
    const result = issue();
    expect(result.entry.isBalanced).toBe(true);
    expect(result.entry.totalDebit).toBe(1000);
    expect(result.entry.lines.find((line) => line.accountCode === "1130")?.debit).toBe(1000);
    expect(result.entry.lines.find((line) => line.accountCode === "1100")?.credit).toBe(1000);
    expect(custodyOutstanding(result.custody)).toBe(1000);
  });

  it("settles pens and closes the custody automatically", () => {
    const issued = issue();
    const result = settleCustody(issued.custody, { date: "2026-07-14", description: "شراء أقلام", expenseAccountId: "professional-fees", netAmount: 1000, vatAmount: 0, returnedAmount: 0, documentReference: "INV-1" }, defaultAccounts);
    expect(result.entry.isBalanced).toBe(true);
    expect(result.entry.lines.find((line) => line.accountCode === "1130")?.credit).toBe(1000);
    expect(result.custody.status).toBe("settled");
    expect(custodyOutstanding(result.custody)).toBe(0);
  });

  it("supports partial documents, VAT, and returned cash", () => {
    const issued = issue();
    const partial = settleCustody(issued.custody, { date: "2026-07-14", description: "مشتريات", expenseAccountId: "professional-fees", netAmount: 500, vatAmount: 70, returnedAmount: 0 }, defaultAccounts);
    expect(partial.custody.status).toBe("partial");
    expect(custodyOutstanding(partial.custody)).toBe(430);
    const closed = settleCustody(partial.custody, { date: "2026-07-15", description: "رد المتبقي", netAmount: 0, vatAmount: 0, returnedAmount: 430 }, defaultAccounts);
    expect(closed.custody.status).toBe("settled");
    expect(closed.entry.lines.find((line) => line.accountCode === "1100")?.debit).toBe(430);
  });

  it("records overspending as an amount due to the employee and pays it", () => {
    const issued = issue();
    const settled = settleCustody(issued.custody, { date: "2026-07-14", description: "مشتريات أكبر من العهدة", expenseAccountId: "office-supplies", netAmount: 1200, vatAmount: 0, returnedAmount: 0 }, defaultAccounts);
    expect(settled.entry.isBalanced).toBe(true);
    expect(settled.entry.lines.find((line) => line.accountCode === "1130")?.credit).toBe(1000);
    expect(settled.entry.lines.find((line) => line.accountCode === "2230")?.credit).toBe(200);
    expect(settled.custody.status).toBe("reimbursement-due");
    expect(custodyReimbursementDue(settled.custody)).toBe(200);
    const paid = reimburseCustody(settled.custody, "2026-07-15", "cash", defaultAccounts);
    expect(paid.entry.lines.find((line) => line.accountCode === "2230")?.debit).toBe(200);
    expect(paid.entry.lines.find((line) => line.accountCode === "1100")?.credit).toBe(200);
    expect(paid.custody.status).toBe("settled");
  });

  it("keeps permanent custody active and replenishes it to the approved balance", () => {
    const issued = issueCustody({ employee: "أحمد محمد", purpose: "مصروفات تشغيل", issueDate: "2026-07-01", amount: 1000, currency: "EGP", paymentAccountId: "cash", kind: "permanent", replenishmentPolicy: "monthly" }, defaultAccounts);
    const settled = settleCustody(issued.custody, { date: "2026-07-10", description: "أدوات مكتبية", expenseAccountId: "office-supplies", netAmount: 800, vatAmount: 0, returnedAmount: 0 }, defaultAccounts);
    expect(settled.custody.status).toBe("permanent-active");
    expect(custodyOutstanding(settled.custody)).toBe(200);
    const replenished = replenishPermanentCustody(settled.custody, "2026-07-11", "cash", defaultAccounts);
    expect(replenished.amount).toBe(800);
    expect(custodyOutstanding(replenished.custody)).toBe(1000);
    expect(replenished.entry.isBalanced).toBe(true);
  });
});
