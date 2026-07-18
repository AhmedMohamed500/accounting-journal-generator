import type { BankTransaction } from "@/types";
import { normalizeArabicNumbers } from "@/lib/parser/normalize";

const split = (line: string) => { const cells: string[] = []; let value = "", quoted = false; for (let index = 0; index < line.length; index++) { const character = line[index]; if (character === '"') { if (quoted && line[index + 1] === '"') { value += '"'; index++; } else quoted = !quoted; } else if (character === "," && !quoted) { cells.push(value.trim()); value = ""; } else value += character; } cells.push(value.trim()); return cells; };
const numeric = (value: string) => Number(normalizeArabicNumbers(value).replace(/[^0-9.-]/g, "")) || 0;

export function parseBankCsv(text: string, currency = "EGP"): BankTransaction[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean); if (lines.length < 2) return [];
  const headers = split(lines[0]).map((header) => header.toLowerCase().trim());
  const find = (names: string[]) => headers.findIndex((header) => names.some((name) => header.includes(name)));
  const date = find(["date", "تاريخ"]), description = find(["description", "details", "narration", "بيان", "وصف"]), reference = find(["reference", "ref", "مرجع"]), debit = find(["debit", "withdrawal", "مدين", "سحب"]), credit = find(["credit", "deposit", "دائن", "إيداع"]), amount = find(["amount", "مبلغ"]), balance = find(["balance", "رصيد"]);
  return lines.slice(1).map((line, index): BankTransaction => { const cells = split(line); let debitValue = debit >= 0 ? numeric(cells[debit]) : 0, creditValue = credit >= 0 ? numeric(cells[credit]) : 0; if (amount >= 0 && !debitValue && !creditValue) { const signed = numeric(cells[amount]); if (signed < 0) debitValue = Math.abs(signed); else creditValue = signed; } return { id: `bank-${Date.now()}-${index}`, date: cells[date] || "", description: cells[description] || "", reference: cells[reference] || "", debit: debitValue, credit: creditValue, balance: balance >= 0 ? numeric(cells[balance]) : undefined, currency, status: "unmatched" }; }).filter((transaction) => transaction.date && (transaction.debit > 0 || transaction.credit > 0));
}
