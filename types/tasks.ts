export type TaskStatus = "new" | "in-progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskCategory = "entries" | "taxes" | "banks" | "customers" | "suppliers" | "payroll" | "closing" | "other";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";
export interface AccountingTask { id: string; title: string; description: string; dueDate: string; status: TaskStatus; priority: TaskPriority; category: TaskCategory; recurrence: TaskRecurrence; linkedEntryId?: string; createdAt: string; completedAt?: string }
