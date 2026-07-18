export const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function validateVatPercentage(rate: number) { return Number.isFinite(rate) && rate >= 0 && rate <= 100 }
export function calculateVatFromNet(net: number, rate: number) { if (!validateVatPercentage(rate)) throw new Error("Invalid VAT percentage"); return roundCurrency(net * rate / 100) }
export function calculateGrossFromNet(net: number, rate: number) { return roundCurrency(net + calculateVatFromNet(net, rate)) }
export function calculateNetFromGross(gross: number, rate: number) { if (!validateVatPercentage(rate)) throw new Error("Invalid VAT percentage"); return roundCurrency(gross / (1 + rate / 100)) }
export function extractVatFromGross(gross: number, rate: number) { return roundCurrency(gross - calculateNetFromGross(gross, rate)) }
export function calculateWithholding(base: number, rate: number) { if (!validateVatPercentage(rate)) throw new Error("Invalid withholding percentage"); return roundCurrency(base * rate / 100) }
export function applyDiscount(amount: number, discount = 0) { if (discount < 0 || discount > amount) throw new Error("Invalid discount"); return roundCurrency(amount - discount) }
