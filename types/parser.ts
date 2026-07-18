import type { TransactionInput } from "./accounting";
export interface ParseResult { input: Partial<TransactionInput>; confidence: number; missingFields: string[]; warningsAr: string[]; warningsEn: string[] }
