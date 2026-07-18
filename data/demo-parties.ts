import type { Party } from "@/types";

const createdAt = "2026-01-01T00:00:00.000Z";

export const demoParties: Party[] = [
  { id: "demo-supplier-noor", type: "supplier", code: "S-0001", nameAr: "شركة النور للتوريدات", nameEn: "Al Noor Supplies", taxNumber: "200000001", email: "accounts@alnoor.example", phone: "01000000001", creditDays: 30, accountCode: "2101", active: true, createdAt },
  { id: "demo-supplier-amal", type: "supplier", code: "S-0002", nameAr: "مؤسسة الأمل للتجارة", nameEn: "Al Amal Trading", taxNumber: "200000002", email: "finance@alamal.example", phone: "01000000002", creditDays: 45, accountCode: "2102", active: true, createdAt },
  { id: "demo-supplier-delta", type: "supplier", code: "S-0003", nameAr: "دلتا للتوريدات العامة", nameEn: "Delta General Supplies", taxNumber: "200000003", phone: "01000000003", creditDays: 30, accountCode: "2103", active: true, createdAt },
  { id: "demo-supplier-future", type: "supplier", code: "S-0004", nameAr: "مكتبة المستقبل", nameEn: "Future Stationery", taxNumber: "200000004", phone: "01000000004", creditDays: 15, accountCode: "2104", active: true, createdAt },
  { id: "demo-supplier-united", type: "supplier", code: "S-0005", nameAr: "المتحدة للخدمات والصيانة", nameEn: "United Services & Maintenance", taxNumber: "200000005", phone: "01000000005", creditDays: 30, accountCode: "2105", active: true, createdAt },
  { id: "demo-customer-pioneer", type: "customer", code: "C-0001", nameAr: "شركة الرواد للتجارة", nameEn: "Pioneers Trading", taxNumber: "300000001", email: "accounts@pioneers.example", phone: "01100000001", creditDays: 30, accountCode: "1121", active: true, createdAt },
  { id: "demo-customer-horizon", type: "customer", code: "C-0002", nameAr: "مؤسسة الأفق", nameEn: "Al Ofoq Establishment", taxNumber: "300000002", phone: "01100000002", creditDays: 45, accountCode: "1122", active: true, createdAt },
  { id: "demo-customer-safa", type: "customer", code: "C-0003", nameAr: "شركة الصفوة", nameEn: "Al Safwa Company", taxNumber: "300000003", phone: "01100000003", creditDays: 30, accountCode: "1123", active: true, createdAt },
];
