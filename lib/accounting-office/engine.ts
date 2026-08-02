import type {
  AccountingOfficeData, ClientHealthFactor, ClientHealthScore, ClientProfitability, EmployeeWorkload,
  MonthlyClientFile, OfficeClient, OfficeDashboardMetrics, OfficeEmployee, OfficeTask, RevenueOpportunity,
  TimeEntry, WorkflowTemplate,
} from "@/types";

export const officeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const round = (value: number, precision = 2) => Number(value.toFixed(precision));
const periodOf = (iso: string) => iso.slice(0, 7);
const monthEnd = (period: string, day: number) => {
  const [year, month] = period.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${period}-${String(Math.min(Math.max(day, 1), last)).padStart(2, "0")}`;
};
const activeTask = (task: OfficeTask) => !["completed", "cancelled"].includes(task.status);

export function fileCompletion(file: MonthlyClientFile, tasks: OfficeTask[], receivedDocuments?: number) {
  const linked = tasks.filter((task) => task.monthlyFileId === file.id && task.status !== "cancelled");
  const taskScore = linked.length ? linked.reduce((sum, task) => sum + (task.status === "completed" ? 100 : task.checklist.length ? task.checklist.filter((item) => item.completed).length / task.checklist.length * 100 : task.actualHours / Math.max(task.expectedHours, 1) * 70), 0) / linked.length : 0;
  const received = receivedDocuments ?? file.receivedDocuments;
  const documentScore = file.expectedDocuments ? Math.min(100, received / file.expectedDocuments * 100) : 100;
  return Math.round(taskScore * .7 + documentScore * .3);
}

function employeeForRole(employees: OfficeEmployee[], role: OfficeEmployee["role"], fallbackId: string) {
  return employees.find((employee) => employee.active && employee.role === role)?.id || fallbackId;
}

export function tasksFromTemplate(template: WorkflowTemplate, file: MonthlyClientFile, client: OfficeClient, employees: OfficeEmployee[], createdAt = new Date().toISOString()) {
  return template.tasks.map((item, index): OfficeTask => {
    const assigneeId = item.responsibleRole === "reviewer" ? client.reviewerId || client.accountantId : item.responsibleRole === "accountant" ? client.accountantId : employeeForRole(employees, item.responsibleRole, client.accountantId);
    const employee = employees.find((person) => person.id === assigneeId);
    return {
      id: officeId("task"), title: item.titleAr, clientId: client.id, monthlyFileId: file.id, serviceId: template.serviceId, assigneeId, reviewerId: client.reviewerId,
      priority: client.priority, status: "new", startDate: `${file.period}-01`, dueDate: monthEnd(file.period, item.relativeDueDay), expectedHours: item.expectedHours, actualHours: 0,
      hourlyCost: employee?.hourlyCost || 0, dependencyIds: index ? [] : [], checklist: item.checklist.map((title) => ({ id: officeId("check"), title, completed: false })), recurring: true, recurrenceRule: "monthly", createdAt,
    };
  });
}

export function generateMonthlyFiles(data: AccountingOfficeData, period: string, clientIds?: string[], carryIncomplete = false) {
  const eligible = data.clients.filter((client) => client.status === "active" && client.serviceFrequency === "monthly" && (!clientIds || clientIds.includes(client.id)));
  const files = [...data.monthlyFiles], tasks = [...data.tasks], documents = [...data.requiredDocuments];
  const created: MonthlyClientFile[] = [];
  for (const client of eligible) {
    if (files.some((file) => file.clientId === client.id && file.period === period)) continue;
    const template = data.templates.find((item) => item.id === client.workflowTemplateId && item.active);
    const file: MonthlyClientFile = { id: officeId("file"), clientId: client.id, period, templateId: template?.id, accountantId: client.accountantId, reviewerId: client.reviewerId, dueDate: monthEnd(period, 25), status: "not-started", expectedDocuments: template?.documents.filter((item) => item.required).length || 0, receivedDocuments: 0, createdAt: new Date().toISOString(), carriedTaskIds: [] };
    const generatedTasks = template ? tasksFromTemplate(template, file, client, data.employees) : [];
    if (carryIncomplete) {
      const previous = files.filter((item) => item.clientId === client.id && item.period < period).sort((a, b) => b.period.localeCompare(a.period))[0];
      const carried = tasks.filter((task) => task.monthlyFileId === previous?.id && activeTask(task)).map((task): OfficeTask => ({ ...task, id: officeId("task"), monthlyFileId: file.id, status: "carried-forward", startDate: `${period}-01`, dueDate: monthEnd(period, 7), actualHours: 0, carriedFromTaskId: task.id, createdAt: new Date().toISOString() }));
      generatedTasks.unshift(...carried);
      file.carriedTaskIds = carried.map((task) => task.id);
    }
    const generatedDocuments = (template?.documents || []).filter((item) => item.required).map((item) => ({ id: officeId("doc"), clientId: client.id, monthlyFileId: file.id, type: item.nameAr, period, status: "not-requested" as const, followUpEmployeeId: client.accountantId, reminderCount: 0, createdAt: new Date().toISOString() }));
    files.push(file); tasks.push(...generatedTasks); documents.push(...generatedDocuments); created.push(file);
  }
  return { data: { ...data, monthlyFiles: files, tasks, requiredDocuments: documents }, created };
}

export function overdueTasks(tasks: OfficeTask[], today = new Date().toISOString().slice(0, 10)) { return tasks.filter((task) => activeTask(task) && task.dueDate < today); }

export function startTimer(data: AccountingOfficeData, entry: Omit<TimeEntry, "id" | "startedAt" | "hours" | "hourlyCost" | "createdAt">, now = new Date().toISOString()) {
  if (data.timeEntries.some((item) => !item.endedAt)) throw new Error("active-timer-exists");
  const employee = data.employees.find((item) => item.id === entry.employeeId);
  const timer: TimeEntry = { ...entry, id: officeId("time"), startedAt: now, hours: 0, hourlyCost: employee?.hourlyCost || 0, createdAt: now };
  return { ...data, timeEntries: [timer, ...data.timeEntries] };
}

export function stopTimer(data: AccountingOfficeData, timerId: string, now = new Date().toISOString()) {
  let recordedHours = 0;
  const timeEntries = data.timeEntries.map((entry) => {
    if (entry.id !== timerId || entry.endedAt) return entry;
    recordedHours = round(Math.max(0, new Date(now).getTime() - new Date(entry.startedAt).getTime()) / 3_600_000);
    return { ...entry, endedAt: now, hours: recordedHours };
  });
  const activeEntry = data.timeEntries.find((entry) => entry.id === timerId);
  const tasks = data.tasks.map((task) => task.id === activeEntry?.taskId ? { ...task, actualHours: round(task.actualHours + recordedHours) } : task);
  return { ...data, timeEntries, tasks };
}

export function timeCost(entries: TimeEntry[], employeeId?: string) { return round(entries.filter((entry) => entry.endedAt && (!employeeId || entry.employeeId === employeeId)).reduce((sum, entry) => sum + entry.hours * entry.hourlyCost, 0)); }

export function clientProfitability(data: AccountingOfficeData, clientId: string, period: string): ClientProfitability {
  const client = data.clients.find((item) => item.id === clientId);
  if (!client) throw new Error("client-not-found");
  const entries = data.timeEntries.filter((item) => item.clientId === clientId && periodOf(item.startedAt) === period);
  const fees = data.fees.filter((item) => item.clientId === clientId && item.period === period && item.status !== "cancelled");
  const revenue = round(fees.reduce((sum, fee) => sum + fee.amount, 0));
  const actualHours = round(entries.reduce((sum, entry) => sum + entry.hours, 0));
  const nonBillableHours = round(entries.filter((entry) => !entry.billable).reduce((sum, entry) => sum + entry.hours, 0));
  const laborCost = timeCost(entries), additionalCost = client.extraMonthlyCosts, totalCost = round(laborCost + additionalCost), grossProfit = round(revenue - totalCost), margin = revenue ? round(grossProfit / revenue * 100) : -100;
  const t = data.settings.profitabilityThresholds;
  const classification: ClientProfitability["classification"] = margin >= t.veryProfitable ? "very-profitable" : margin >= t.profitable ? "profitable" : margin >= t.review ? "review" : margin >= t.low ? "low" : "loss";
  const reasons: string[] = [];
  if (actualHours > client.expectedHours) reasons.push("الساعات الفعلية تجاوزت الحد المتفق عليه");
  if (nonBillableHours > actualHours * .2) reasons.push("وقت غير قابل للفوترة مرتفع");
  if (client.reworkRate > 15) reasons.push("إعادة العمل أعلى من المستوى المناسب");
  if (client.documentCommitment < 60) reasons.push("تأخر المستندات يستهلك وقت الفريق");
  if (margin < t.review) reasons.push("الأتعاب الحالية منخفضة مقارنة بتكلفة التنفيذ");
  return { clientId, period, laborCost, additionalCost, totalCost, revenue, grossProfit, margin, revenuePerHour: actualHours ? round(revenue / actualHours) : revenue, agreedHours: client.expectedHours, actualHours, nonBillableHours, classification, reasons };
}

export function employeeWorkload(data: AccountingOfficeData, employeeId: string, today = new Date().toISOString().slice(0, 10), horizonDays = 30): EmployeeWorkload {
  const employee = data.employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error("employee-not-found");
  const end = new Date(`${today}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + horizonDays);
  const endIso = end.toISOString().slice(0, 10);
  const tasks = data.tasks.filter((task) => task.assigneeId === employeeId && activeTask(task) && task.dueDate <= endIso);
  const requiredHours = round(tasks.reduce((sum, task) => sum + Math.max(0, task.expectedHours - task.actualHours), 0));
  const availableHours = employee.dailyCapacityHours * Math.max(1, Math.round(horizonDays / 7 * data.settings.workingDays.length));
  const utilization = round(requiredHours / Math.max(availableHours, 1) * 100);
  const urgentTasks = tasks.filter((task) => task.priority === "critical").length, overdue = tasks.filter((task) => task.dueDate < today).length;
  const thresholds = data.settings.workloadThresholds;
  const level: EmployeeWorkload["level"] = utilization >= thresholds.critical || overdue >= 4 ? "critical" : utilization >= thresholds.high || overdue >= 2 ? "high" : utilization >= thresholds.balanced ? "balanced" : "available";
  const suggestion = level === "critical" ? "انقل مهمة عاجلة لموظف أقل ضغطًا بعد التأكيد" : level === "high" ? "راجع المواعيد وقسّم المهام الكبيرة" : level === "available" ? "يمكن إسناد أعمال إضافية لهذا الموظف" : "توزيع العمل متوازن";
  return { employeeId, requiredHours, availableHours, utilization, urgentTasks, overdueTasks: overdue, level, suggestion };
}

function collectionRate(data: AccountingOfficeData, clientId: string, period: string) {
  const fees = data.fees.filter((item) => item.clientId === clientId && item.period === period && item.status !== "cancelled");
  const total = fees.reduce((sum, fee) => sum + fee.amount, 0), collected = fees.reduce((sum, fee) => sum + fee.collectedAmount, 0);
  return total ? Math.min(100, collected / total * 100) : 100;
}

export function clientHealth(data: AccountingOfficeData, clientId: string, period: string, today = new Date().toISOString().slice(0, 10)): ClientHealthScore {
  const client = data.clients.find((item) => item.id === clientId); if (!client) throw new Error("client-not-found");
  const profitability = clientProfitability(data, clientId, period), files = data.monthlyFiles.filter((item) => item.clientId === clientId && item.period === period);
  const delayedByClient = data.tasks.filter((task) => task.clientId === clientId && task.status === "waiting-client" && task.dueDate < today).length;
  const deadlines = data.deadlines.filter((item) => item.clientId === clientId && item.status !== "completed"), urgentDeadlines = deadlines.filter((item) => ["urgent", "overdue"].includes(item.status)).length;
  const weights = data.settings.healthWeights;
  const raw: Array<[keyof typeof weights, string, number, string]> = [
    ["documents", "الالتزام بالمستندات", client.documentCommitment, client.documentCommitment >= 75 ? "المستندات تصل بانتظام" : "المستندات تتأخر أو تصل ناقصة"],
    ["collections", "انتظام الأتعاب", collectionRate(data, clientId, period), "مبني على نسبة الأتعاب المحصلة"],
    ["delays", "التأخير بسبب العميل", Math.max(0, 100 - delayedByClient * 25), delayedByClient ? `${delayedByClient} مهمة متأخرة بانتظار العميل` : "لا توجد مهام متأخرة بسبب العميل"],
    ["profitability", "الربحية", Math.max(0, Math.min(100, profitability.margin + 45)), `هامش الربح ${profitability.margin}%`],
    ["rework", "معدل إعادة العمل", Math.max(0, 100 - client.reworkRate * 3), `إعادة العمل ${client.reworkRate}%`],
    ["completeness", "اكتمال الملف", files.length ? files.reduce((sum, file) => sum + fileCompletion(file, data.tasks), 0) / files.length : 50, "نسبة اكتمال الملفات والمهام"],
    ["deadlines", "الالتزامات القريبة", Math.max(0, 100 - urgentDeadlines * 25), urgentDeadlines ? `${urgentDeadlines} التزام عاجل أو متأخر` : "لا توجد التزامات حرجة"],
    ["response", "سرعة الرد", client.responseSpeed, client.responseSpeed >= 75 ? "العميل سريع الاستجابة" : "استجابة العميل تحتاج متابعة"],
  ];
  const factors: ClientHealthFactor[] = raw.map(([key, label, score, explanation]) => ({ key, label, score: Math.round(score), weight: weights[key], explanation }));
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0), score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight);
  return { clientId, score, classification: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "follow-up" : "at-risk", factors };
}

export function detectRevenueOpportunities(data: AccountingOfficeData, period: string): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = [];
  const add = (client: OfficeClient, serviceId: string | undefined, serviceName: string, reason: string, rule: string, revenue: number, cost: number, priority: RevenueOpportunity["priority"]) => {
    const key = `${client.id}|${rule}`; if (opportunities.some((item) => `${item.clientId}|${item.rule}` === key)) return;
    opportunities.push({ id: officeId("opp"), clientId: client.id, serviceId, serviceName, reason, rule, expectedMonthlyRevenue: revenue, expectedCost: cost, expectedProfit: revenue - cost, priority, status: "new", createdAt: new Date().toISOString() });
  };
  for (const client of data.clients.filter((item) => item.status !== "archived")) {
    const p = clientProfitability(data, client.id, period);
    if (p.actualHours > client.expectedHours * 1.1) add(client, undefined, "تعديل الباقة أو سعر الخدمة", `الساعات الفعلية ${p.actualHours} تجاوزت المتفق عليه ${client.expectedHours}`, "hours-over-package", Math.max(1500, client.feeAmount * .2), 300, "high");
    if (client.bankTransactionVolume > 300 && !client.includedServiceIds.includes("svc-bank")) add(client, "svc-bank", "التسوية البنكية", `حجم الحركات البنكية ${client.bankTransactionVolume} حركة شهرياً`, "high-bank-volume", 2500, 750, "high");
    if (client.employeeCount >= 12 && !client.includedServiceIds.includes("svc-payroll")) add(client, "svc-payroll", "إدارة الرواتب والتأمينات", `لدى العميل ${client.employeeCount} موظفاً والخدمة غير مشمولة`, "payroll-needed", 3000, 900, "medium");
    if (client.branches > 1 && !client.includedServiceIds.includes("svc-management")) add(client, "svc-management", "تقارير الفروع والإدارة", `لدى العميل ${client.branches} فروع بدون تقارير إدارة ضمن الباقة`, "multi-branch-reporting", 5000, 1600, "high");
    if (client.frequentExcelAnalysis && !client.includedServiceIds.includes("svc-management")) add(client, "svc-management", "تحليل البيانات الدوري", "العميل يحتاج تحليل Excel بصورة متكررة", "frequent-excel", 2800, 850, "medium");
    if (client.documentCommitment < 60 && !client.includedServiceIds.includes("svc-digitization")) add(client, "svc-digitization", "رقمنة وأرشفة المستندات", "تأخر ونقص المستندات يستهلك وقت التنفيذ", "documents-digitization", 2200, 650, "medium");
    if (["low", "loss"].includes(p.classification)) add(client, undefined, "مراجعة التعاقد والأتعاب", `هامش الربح الحالي ${p.margin}%`, "low-profitability", Math.max(1000, client.feeAmount * .15), 100, "critical");
  }
  return opportunities;
}

export function feeSummary(data: AccountingOfficeData, period: string) {
  const fees = data.fees.filter((item) => item.period === period && item.status !== "cancelled");
  const total = round(fees.reduce((sum, item) => sum + item.amount, 0)), collected = round(fees.reduce((sum, item) => sum + item.collectedAmount, 0));
  return { total, collected, outstanding: round(total - collected), overdue: round(fees.filter((item) => item.status === "overdue").reduce((sum, item) => sum + item.amount - item.collectedAmount, 0)), collectionRate: total ? round(collected / total * 100) : 100 };
}

export function dashboardMetrics(data: AccountingOfficeData, period: string, today = new Date().toISOString().slice(0, 10)): OfficeDashboardMetrics {
  const files = data.monthlyFiles.filter((item) => item.period === period), tasks = data.tasks.filter((item) => item.startDate.slice(0, 7) <= period && item.dueDate.slice(0, 7) >= period);
  const fees = feeSummary(data, period), activeClients = data.clients.filter((item) => item.status === "active").length;
  const profit = data.clients.filter((item) => item.status !== "archived").map((client) => clientProfitability(data, client.id, period));
  const workload = data.employees.filter((item) => item.active).map((employee) => employeeWorkload(data, employee.id, today));
  return {
    activeClients, openFiles: files.filter((item) => item.status !== "closed").length, readyForReview: files.filter((item) => item.status === "ready-review").length,
    overdueFiles: files.filter((item) => item.status === "overdue" || (item.status !== "closed" && item.dueDate < today)).length,
    dueToday: tasks.filter((item) => activeTask(item) && item.dueDate === today).length, overdueTasks: overdueTasks(tasks, today).length,
    upcomingDeadlines: data.deadlines.filter((item) => item.status !== "completed" && item.dueDate >= today && item.dueDate <= monthEnd(period, 31)).length,
    missingDocuments: data.requiredDocuments.filter((item) => item.period === period && !["received", "not-required"].includes(item.status)).length,
    recordedHours: round(data.timeEntries.filter((item) => periodOf(item.startedAt) === period).reduce((sum, item) => sum + item.hours, 0)), fees: fees.total, collected: fees.collected,
    outstanding: fees.outstanding, overdueFees: fees.overdue, executionCost: round(profit.reduce((sum, item) => sum + item.totalCost, 0)), estimatedProfit: round(profit.reduce((sum, item) => sum + item.grossProfit, 0)),
    averageClientMargin: profit.length ? round(profit.reduce((sum, item) => sum + item.margin, 0) / profit.length) : 0, teamUtilization: workload.length ? round(workload.reduce((sum, item) => sum + item.utilization, 0) / workload.length) : 0,
  };
}

export function canArchiveClient(data: AccountingOfficeData, clientId: string) {
  const openFile = data.monthlyFiles.some((file) => file.clientId === clientId && file.status !== "closed");
  const openTask = data.tasks.some((task) => task.clientId === clientId && activeTask(task));
  const outstandingFee = data.fees.some((fee) => fee.clientId === clientId && fee.amount > fee.collectedAmount && !["cancelled", "collected"].includes(fee.status));
  return { allowed: !openFile && !openTask && !outstandingFee, reasons: [openFile && "يوجد ملف شهري مفتوح", openTask && "توجد مهام غير مكتملة", outstandingFee && "توجد أتعاب مستحقة"].filter(Boolean) as string[] };
}

export function mergeOfficeForBackup(original: AccountingOfficeData, restored: AccountingOfficeData) {
  if (restored.schemaVersion !== 2 || restored.companyId !== original.companyId) throw new Error("invalid-office-backup");
  return restored;
}
