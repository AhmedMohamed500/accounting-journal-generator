import type { AccountingTask } from "@/types";
import { loadOperationalData, saveOperationalData } from "./accounting";
export const TASKS_KEY = "accountant-daily-tasks";
export function loadTasks(): AccountingTask[] { return loadOperationalData<AccountingTask[]>(TASKS_KEY, []); }
export function saveTasks(tasks: AccountingTask[]) { saveOperationalData(TASKS_KEY, tasks); }
export function taskMetrics(tasks: AccountingTask[], today: string) { const dueToday = tasks.filter((task) => task.dueDate === today && task.status !== "completed").length; const overdue = tasks.filter((task) => task.dueDate < today && task.status !== "completed").length; const completed = tasks.filter((task) => task.status === "completed").length; return { dueToday, overdue, completed, open: tasks.length - completed }; }
