import type { ArenaTaskDefinition } from "@/types";

export const arenaTasks: ArenaTaskDefinition[] = [
  {
    id: "supplier-materials-001", companyAr: "شركة النور للصناعات", companyEn: "Al Noor Industries", titleAr: "تسجيل شراء خامات من مورد جديد", titleEn: "Record materials purchased from a new supplier",
    objectiveAr: "راجع فاتورة المورد، حدد الحسابات، وأنشئ القيد الصحيح دون التأثير على النقدية.", objectiveEn: "Review the supplier invoice, select the accounts, and build the correct entry without changing cash.",
    priority: "important", estimatedMinutes: 6, difficulty: "intermediate", reward: 780, skillIds: ["account-nature", "debit-credit", "journal-entries", "suppliers-ap", "financial-impact"],
    document: { type: "supplier-invoice", number: "INV-2048", date: "2026-09-03", partyAr: "المتحدة لتوريد الخامات", partyEn: "United Materials Supply", net: 25000, vat: 3500, total: 28500, currency: "EGP" },
    expectedLines: [{ accountCode: "1200", side: "debit", amount: 25000 }, { accountCode: "1151", side: "debit", amount: 3500 }, { accountCode: "2100", side: "credit", amount: 28500 }],
  },
];

export const companyChallenges = [
  ["customer-overdues", "تسوية حسابات العملاء المتأخرة", "Resolve overdue customer balances", "customers-ar"],
  ["bank-reconciliation", "تسوية البنك", "Bank reconciliation", "banking"],
  ["supplier-investigation", "التحقيق في رصيد مورد", "Supplier balance investigation", "suppliers-ap"],
  ["vat-review", "مراجعة ضريبة القيمة المضافة", "VAT review", "vat"],
  ["month-close", "إقفال نهاية الشهر", "Month-end close", "closing"],
] as const;

export const demoTalentCompanies = ["Northstar Advisory", "Delta Finance Lab", "Cairo Business Services"];
