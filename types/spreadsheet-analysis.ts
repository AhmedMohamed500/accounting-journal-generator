export type CellValue = string | number | boolean | Date | null;
export interface SpreadsheetReadDiagnostics { headerConfidence: number; titleRowsSkipped: number; blankRowsRemoved: number; blankColumnsRemoved: number; sourceColumnCount: number; warnings: string[] }
export interface SheetData { name: string; headers: string[]; rows: CellValue[][]; headerRowIndex?: number; sourceRowCount?: number; readDiagnostics?: SpreadsheetReadDiagnostics }
export type SpreadsheetAggregate = "sum" | "average" | "count" | "min" | "max";
export interface SpreadsheetFilter { column: string; operator: "equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "not-empty"; value?: string | number }
export interface SpreadsheetQuery { groupBy: string; valueColumn?: string; aggregate: SpreadsheetAggregate; filters?: SpreadsheetFilter[]; topN?: number; sort?: "asc" | "desc" }
export interface SpreadsheetQueryRow { label: string; value: number; count: number; percentage: number }
export interface SpreadsheetQueryResult { title: string; total: number; rows: SpreadsheetQueryRow[]; matchedRows: number }
export interface NumericProfile { column: string; count: number; missing: number; sum: number; average: number; minimum: number; maximum: number; median: number; negative: number; zero: number; shareOfNumericTotal: number }
export interface CategoricalProfile { column: string; count: number; missing: number; unique: number; topValues: { value: string; count: number; percentage: number }[] }
export interface DateProfile { column: string; count: number; missing: number; earliest: string; latest: string }
export interface DataQualityIssue { severity: "high" | "medium" | "low"; code: string; message: string; column?: string }
export interface SpreadsheetColumnInsight { column: string; type: "number" | "date" | "category" | "identifier" | "boolean" | "mixed"; confidence: number; completeness: number; distinct: number; role: "measure" | "amount" | "date" | "category" | "identifier" | "text" }
export interface CategoryBreakdownItem { label: string; value: number; percentage: number }
export interface CategoryBreakdown { title: string; total: number; items: CategoryBreakdownItem[] }
export interface SheetAnalysis { name: string; headers: string[]; rows: CellValue[][]; headerRowIndex?: number; rowCount: number; analyzedRows: number; sampled: boolean; completeness: number; qualityScore: number; duplicateRows: number; columnCount: number; numeric: NumericProfile[]; categorical: CategoricalProfile[]; dates: DateProfile[]; columns: SpreadsheetColumnInsight[]; quality: DataQualityIssue[]; readDiagnostics?: SpreadsheetReadDiagnostics; breakdown?: CategoryBreakdown; preview: CellValue[][] }

export type AccountingSpreadsheetCategory = "revenue" | "purchases" | "cost-of-sales" | "administrative-expense" | "bank-expense" | "payroll" | "rent" | "utilities" | "maintenance" | "marketing" | "tax" | "asset" | "inventory" | "loan" | "capital" | "transfer" | "unclassified";
export interface AccountingSpreadsheetMapping { date?: string; description?: string; amount?: string; debit?: string; credit?: string; category?: string; accountCode?: string; counterAccountCode?: string; reference?: string; party?: string }
export interface AccountingSpreadsheetRow {
  id: string; rowNumber: number; date: string; description: string; reference?: string; party?: string; amount: number; direction: "in" | "out";
  category: AccountingSpreadsheetCategory; categoryAr: string; categoryEn: string; accountCode: string; counterAccountCode: string; confidence: number;
  warnings: string[]; source: CellValue[];
}
export interface AccountingSpreadsheetSummary { totalIn: number; totalOut: number; netCashFlow: number; categorized: number; needsReview: number; categories: { category: AccountingSpreadsheetCategory; labelAr: string; labelEn: string; count: number; amount: number }[] }
export interface AccountingSpreadsheetResult { mapping: AccountingSpreadsheetMapping; rows: AccountingSpreadsheetRow[]; summary: AccountingSpreadsheetSummary; warnings: string[] }
