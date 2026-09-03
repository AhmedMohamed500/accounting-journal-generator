import type { PosProviderId } from "./pos";

export type LocalRole = "owner" | "manager" | "cashier" | "accountant" | "viewer";
export type DemoPermission = "manage-users" | "manage-settings" | "manage-shifts" | "create-operation" | "reverse-operation" | "view-reports" | "view-journals" | "backup";
export type PlanId = "starter" | "pro" | "business";
export type SubscriptionStatus = "trial" | "active-demo" | "expired-demo" | "cancelled-demo";

export interface ServicePointDemoSettings {
  schemaVersion: 1;
  onboardingComplete: boolean;
  profileMode: "empty" | "demo";
  businessName: string;
  enabledProviders: PosProviderId[];
  salesDemoMode: boolean;
  tourComplete: boolean;
  lastBackupAt?: string;
  demoStoreIds?: string[];
}

export interface LocalUser {
  id: string;
  name: string;
  role: LocalRole;
  pinSalt: string;
  pinHash: string;
  active: boolean;
  createdAt: string;
}

export interface LocalAuditEntry {
  id: string;
  at: string;
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
}

export interface LocalSubscription {
  trialStartedAt: string;
  trialEndsAt: string;
  currentPlan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: "monthly" | "annual";
  activationCode?: string;
}

export interface ServicePointBackup {
  product: "FINORA Service Point";
  schemaVersion: 1;
  exportedAt: string;
  businessName: string;
  settings: ServicePointDemoSettings;
  users: LocalUser[];
  audit: LocalAuditEntry[];
  subscription: LocalSubscription;
  stores: unknown[];
  storeData: Record<string, { shifts: unknown[]; operations: unknown[]; entries: unknown[] }>;
}
