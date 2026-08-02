import { beforeEach, describe, expect, it } from "vitest";
import { createOfficeSeed } from "@/data/accounting-office";
import {
  canArchiveClient, clientHealth, clientProfitability, dashboardMetrics, detectRevenueOpportunities, employeeWorkload,
  feeSummary, fileCompletion, generateMonthlyFiles, overdueTasks, startTimer, stopTimer, tasksFromTemplate, timeCost,
} from "@/lib/accounting-office/engine";
import { loadOfficeData, officeStorageKey, saveOfficeData } from "@/lib/storage/accounting-office";
import { createBackup, restoreBackup } from "@/lib/storage/backup";

describe("accounting office operating center", () => {
  beforeEach(() => localStorage.clear());

  it("prevents duplicate monthly files for the same client and period", () => {
    const seed = createOfficeSeed("personal");
    const first = generateMonthlyFiles(seed, "2026-09", ["client-1"]);
    const second = generateMonthlyFiles(first.data, "2026-09", ["client-1"]);
    expect(first.created).toHaveLength(1);
    expect(second.created).toHaveLength(0);
    expect(second.data.monthlyFiles.filter((file) => file.clientId === "client-1" && file.period === "2026-09")).toHaveLength(1);
  });

  it("creates tasks and documents from a workflow template", () => {
    const seed = createOfficeSeed("personal"), result = generateMonthlyFiles(seed, "2026-09", ["client-1"]), file = result.created[0];
    const template = seed.templates.find((item) => item.id === "tpl-trading")!;
    expect(result.data.tasks.filter((task) => task.monthlyFileId === file.id)).toHaveLength(template.tasks.length);
    expect(result.data.requiredDocuments.filter((doc) => doc.monthlyFileId === file.id)).toHaveLength(template.documents.length);
  });

  it("assigns template tasks to the client team", () => {
    const seed = createOfficeSeed("personal"), template = seed.templates[0], client = seed.clients[0], file = { ...seed.monthlyFiles[0], id: "new-file", period: "2026-10" };
    const tasks = tasksFromTemplate(template, file, client, seed.employees, "2026-09-30T00:00:00.000Z");
    expect(tasks.some((task) => task.assigneeId === client.accountantId)).toBe(true);
    expect(tasks.some((task) => task.assigneeId === client.reviewerId)).toBe(true);
    expect(tasks.every((task) => task.clientId === client.id && task.monthlyFileId === file.id)).toBe(true);
  });

  it("carries incomplete tasks to the next month with traceability", () => {
    const seed = createOfficeSeed("personal"), result = generateMonthlyFiles(seed, "2026-09", ["client-1"], true), file = result.created[0];
    const carried = result.data.tasks.filter((task) => task.monthlyFileId === file.id && task.carriedFromTaskId);
    expect(carried.length).toBeGreaterThan(0);
    expect(file.carriedTaskIds).toEqual(carried.map((task) => task.id));
  });

  it("calculates monthly file completion from tasks and documents", () => {
    const seed = createOfficeSeed("personal"), file = seed.monthlyFiles.find((item) => item.id === "file-3")!;
    const result = fileCompletion(file, seed.tasks);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("detects overdue tasks", () => {
    const seed = createOfficeSeed("personal"), result = overdueTasks(seed.tasks, "2026-08-02");
    expect(result.map((task) => task.id)).toContain("task-3");
    expect(result.every((task) => task.status !== "completed")).toBe(true);
  });

  it("calculates an understandable employee workload", () => {
    const seed = createOfficeSeed("personal"), workload = employeeWorkload(seed, "emp-4", "2026-08-02", 7);
    expect(workload.requiredHours).toBeGreaterThan(0);
    expect(workload.availableHours).toBeGreaterThan(0);
    expect(["available", "balanced", "high", "critical"]).toContain(workload.level);
    expect(workload.suggestion.length).toBeGreaterThan(5);
  });

  it("allows only one active timer and records stopped time", () => {
    const seed = createOfficeSeed("personal"), started = startTimer(seed, { employeeId: "emp-3", clientId: "client-1", taskId: "task-2", billable: true, description: "اختبار" }, "2026-08-02T08:00:00.000Z");
    expect(() => startTimer(started, { employeeId: "emp-4", clientId: "client-2", billable: true, description: "ثان" }, "2026-08-02T08:05:00.000Z")).toThrow("active-timer-exists");
    const stopped = stopTimer(started, started.timeEntries[0].id, "2026-08-02T10:30:00.000Z");
    expect(stopped.timeEntries[0].hours).toBe(2.5);
    expect(stopped.timeEntries[0].endedAt).toBeTruthy();
  });

  it("calculates labor cost from hours and employee rate", () => {
    const seed = createOfficeSeed("personal"), entries = seed.timeEntries.filter((item) => item.employeeId === "emp-2");
    expect(timeCost(entries)).toBe(3.5 * 220);
  });

  it("calculates client profit, margin, hours, and classification", () => {
    const seed = createOfficeSeed("personal"), result = clientProfitability(seed, "client-1", "2026-08");
    expect(result.revenue).toBe(10500);
    expect(result.totalCost).toBe(result.laborCost + result.additionalCost);
    expect(result.grossProfit).toBe(result.revenue - result.totalCost);
    expect(result.margin).toBeCloseTo(result.grossProfit / result.revenue * 100, 1);
    expect(["very-profitable", "profitable", "review", "low", "loss"]).toContain(result.classification);
  });

  it("calculates fees, collections, outstanding, and collection rate", () => {
    const summary = feeSummary(createOfficeSeed("personal"), "2026-08");
    expect(summary.total).toBeGreaterThan(summary.collected);
    expect(summary.outstanding).toBe(summary.total - summary.collected);
    expect(summary.collectionRate).toBeGreaterThan(0);
  });

  it("detects explainable revenue opportunities without external AI", () => {
    const opportunities = detectRevenueOpportunities(createOfficeSeed("personal"), "2026-08");
    expect(opportunities.length).toBeGreaterThan(3);
    expect(opportunities.some((item) => item.rule === "payroll-needed")).toBe(true);
    expect(opportunities.every((item) => item.reason && item.expectedProfit === item.expectedMonthlyRevenue - item.expectedCost)).toBe(true);
  });

  it("calculates client health with visible weighted factors", () => {
    const result = clientHealth(createOfficeSeed("personal"), "client-4", "2026-08", "2026-08-02");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveLength(8);
    expect(result.factors.every((factor) => factor.explanation.length > 0)).toBe(true);
  });

  it("saves and restores office data through local company storage", () => {
    const seed = createOfficeSeed("personal"); seed.office.nameAr = "مكتب الاختبار";
    saveOfficeData(seed);
    expect(localStorage.getItem(officeStorageKey("personal"))).toBeTruthy();
    expect(loadOfficeData("personal").office.nameAr).toBe("مكتب الاختبار");
  });

  it("includes office data in the full company backup and restores it", () => {
    const seed = createOfficeSeed("personal"); seed.office.nameAr = "مكتب محفوظ"; saveOfficeData(seed);
    const backup = createBackup();
    expect(backup.data[officeStorageKey("personal")]).toBeTruthy();
    localStorage.removeItem(officeStorageKey("personal")); restoreBackup(backup);
    expect(loadOfficeData("personal").office.nameAr).toBe("مكتب محفوظ");
  });

  it("prevents destructive client deletion while related records exist", () => {
    const guard = canArchiveClient(createOfficeSeed("personal"), "client-1");
    expect(guard.allowed).toBe(false);
    expect(guard.reasons.length).toBeGreaterThan(0);
  });

  it("computes dashboard indicators from actual local records", () => {
    const seed = createOfficeSeed("personal"), result = dashboardMetrics(seed, "2026-08", "2026-08-02");
    expect(result.activeClients).toBe(seed.clients.filter((item) => item.status === "active").length);
    expect(result.openFiles).toBe(seed.monthlyFiles.filter((item) => item.period === "2026-08" && item.status !== "closed").length);
    expect(result.fees).toBe(seed.fees.reduce((sum, fee) => sum + fee.amount, 0));
    expect(result.teamUtilization).toBeGreaterThanOrEqual(0);
  });
});
