export type CellValue = string | number | boolean | Date | null;
export interface SheetData { name: string; headers: string[]; rows: CellValue[][] }
export interface NumericProfile { column: string; count: number; missing: number; sum: number; average: number; minimum: number; maximum: number; median: number; negative: number; zero: number; shareOfNumericTotal: number }
export interface CategoricalProfile { column: string; count: number; missing: number; unique: number; topValues: { value: string; count: number; percentage: number }[] }
export interface DateProfile { column: string; count: number; missing: number; earliest: string; latest: string }
export interface DataQualityIssue { severity: "high" | "medium" | "low"; code: string; message: string; column?: string }
export interface CategoryBreakdownItem { label: string; value: number; percentage: number }
export interface CategoryBreakdown { title: string; total: number; items: CategoryBreakdownItem[] }
export interface SheetAnalysis { name: string; headers: string[]; rowCount: number; analyzedRows: number; sampled: boolean; completeness: number; duplicateRows: number; columnCount: number; numeric: NumericProfile[]; categorical: CategoricalProfile[]; dates: DateProfile[]; quality: DataQualityIssue[]; breakdown?: CategoryBreakdown; preview: CellValue[][] }
