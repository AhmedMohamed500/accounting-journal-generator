import { describe, expect, it } from "vitest";
import { taskMetrics } from "@/lib/storage/tasks";
import type { AccountingTask } from "@/types";
const task = (id: string, dueDate: string, status: AccountingTask["status"]): AccountingTask => ({ id, title: id, description: "", dueDate, status, priority: "medium", category: "entries", recurrence: "none", createdAt: "2026-01-01" });
describe("task dashboard", () => { it("calculates daily workload", () => { const metrics = taskMetrics([task("a", "2026-07-12", "new"), task("b", "2026-07-11", "in-progress"), task("c", "2026-07-10", "completed")], "2026-07-12"); expect(metrics).toEqual({ dueToday: 1, overdue: 1, completed: 1, open: 2 }); }); });
