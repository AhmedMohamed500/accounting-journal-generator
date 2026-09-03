import { annualPlanPrice, servicePointCommercialConfig } from "@/data/service-point-plans";
import type { DemoPermission, LocalRole, LocalSubscription, PlanId, SubscriptionStatus } from "@/types/service-point-demo";

const rolePermissions: Record<LocalRole, DemoPermission[]> = {
  owner: ["manage-users","manage-settings","manage-shifts","create-operation","reverse-operation","view-reports","view-journals","backup"],
  manager: ["manage-shifts","create-operation","reverse-operation","view-reports","backup"],
  cashier: ["manage-shifts","create-operation"],
  accountant: ["view-reports","view-journals","backup"],
  viewer: ["view-reports"],
};

export const canLocalRole = (role: LocalRole, permission: DemoPermission) => rolePermissions[role].includes(permission);

export function createLocalTrial(now = new Date(), plan: PlanId = "pro"): LocalSubscription {
  const end = new Date(now); end.setDate(end.getDate() + servicePointCommercialConfig.trialDays);
  return { trialStartedAt: now.toISOString(), trialEndsAt: end.toISOString(), currentPlan: plan, subscriptionStatus: "trial", billingCycle: "monthly" };
}

export function trialDaysRemaining(subscription: LocalSubscription, now = new Date()) {
  return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - now.getTime()) / 86_400_000));
}

export function effectiveSubscriptionStatus(subscription: LocalSubscription, now = new Date()): SubscriptionStatus {
  return subscription.subscriptionStatus === "trial" && trialDaysRemaining(subscription, now) === 0 ? "expired-demo" : subscription.subscriptionStatus;
}

export function planPrice(plan: { monthlyPrice: number }, cycle: "monthly" | "annual") {
  return cycle === "annual" ? annualPlanPrice(plan.monthlyPrice) : plan.monthlyPrice;
}

export function activationRequestCode(plan: PlanId, seed = Math.random().toString(36).slice(2, 8)) {
  return `FINORA-${plan.toUpperCase()}-${seed.toUpperCase().padEnd(6, "0").slice(0, 6)}`;
}

export async function hashLocalPin(pin: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${pin}:finora-local-demo`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
