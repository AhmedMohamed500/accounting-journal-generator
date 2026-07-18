import type { AccountingTask } from "@/types";
import { companyKey } from "./accounting";
export const TASKS_KEY = "accountant-daily-tasks";
export function loadTasks(): AccountingTask[] { if (typeof window === "undefined") return []; try { const scoped = companyKey(TASKS_KEY); const value = localStorage.getItem(scoped); if (value) return JSON.parse(value) as AccountingTask[]; const legacy = localStorage.getItem(TASKS_KEY); if (legacy) { localStorage.setItem(scoped, legacy); return JSON.parse(legacy) as AccountingTask[]; } return []; } catch { return []; } }
export function saveTasks(tasks: AccountingTask[]) { localStorage.setItem(companyKey(TASKS_KEY), JSON.stringify(tasks)); }
export function taskMetrics(tasks: AccountingTask[], today: string) { const dueToday = tasks.filter((task) => task.dueDate === today && task.status !== "completed").length; const overdue = tasks.filter((task) => task.dueDate < today && task.status !== "completed").length; const completed = tasks.filter((task) => task.status === "completed").length; return { dueToday, overdue, completed, open: tasks.length - completed }; }
