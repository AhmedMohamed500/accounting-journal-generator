import { beforeEach,describe,expect,it } from "vitest";
import { annualPlanPrice,servicePointCommercialConfig } from "@/data/service-point-plans";
import { activationRequestCode,canLocalRole,createLocalTrial,effectiveSubscriptionStatus,hashLocalPin,planPrice,trialDaysRemaining } from "@/lib/pos/demo";
import { appendLocalAudit,createLocalUser,exportServicePointBackup,loadLocalAudit,loadLocalUsers,parseServicePointBackup,resetSalesDemo,restoreServicePointBackup,saveServicePointSettings,seedSalesDemo,verifyLocalPin } from "@/lib/storage/service-point-demo";
import { createPosStore,loadPosOperations,loadPosStores } from "@/lib/storage/pos";

describe("Service Point Zero-Cost Demo Edition",()=>{
 beforeEach(()=>localStorage.clear());

 it("creates a configurable 14-day trial and detects expiry",()=>{const started=new Date("2026-09-01T00:00:00Z"),trial=createLocalTrial(started,"pro");expect(trialDaysRemaining(trial,new Date("2026-09-03T00:00:00Z"))).toBe(12);expect(effectiveSubscriptionStatus(trial,new Date("2026-09-15T00:00:01Z"))).toBe("expired-demo");});
 it("calculates monthly and annual pricing from central config",()=>{const plan=servicePointCommercialConfig.plans[0];expect(planPrice(plan,"monthly")).toBe(plan.monthlyPrice);expect(planPrice(plan,"annual")).toBe(annualPlanPrice(plan.monthlyPrice));expect(planPrice(plan,"annual")).toBe(plan.monthlyPrice*10);});
 it("generates a readable local activation request code",()=>expect(activationRequestCode("pro","abc123")).toBe("FINORA-PRO-ABC123"));
 it("applies the documented local permissions",()=>{expect(canLocalRole("owner","manage-users")).toBe(true);expect(canLocalRole("cashier","create-operation")).toBe(true);expect(canLocalRole("cashier","reverse-operation")).toBe(false);expect(canLocalRole("viewer","view-reports")).toBe(true);});
 it("stores salted PIN hashes and verifies them",async()=>{const user=await createLocalUser("Cashier","cashier","1234");expect(user.pinHash).not.toContain("1234");expect(user.pinHash).toBe(await hashLocalPin("1234",user.pinSalt));expect(await verifyLocalPin(user,"1234")).toBe(true);expect(await verifyLocalPin(user,"9999")).toBe(false);expect(loadLocalUsers()).toHaveLength(1);});
 it("records local audit events",()=>{appendLocalAudit("open-shift","shift","Shift 1");expect(loadLocalAudit()[0]).toMatchObject({action:"open-shift",entity:"shift",details:"Shift 1"});});
 it("keeps sales demo data isolated from an existing store",()=>{const real=createPosStore("Real Store"),demo=seedSalesDemo();expect(demo.id).not.toBe(real.id);expect(loadPosOperations(demo.id).length).toBeGreaterThan(3);resetSalesDemo();expect(loadPosStores().map(x=>x.id)).toContain(real.id);expect(loadPosStores().map(x=>x.id)).not.toContain(demo.id);});
 it("exports, previews, and restores a complete local backup",async()=>{saveServicePointSettings({schemaVersion:1,onboardingComplete:true,profileMode:"empty",businessName:"Test Business",enabledProviders:["fawry"],salesDemoMode:false,tourComplete:true,demoStoreIds:[]});createPosStore("Branch 1");await createLocalUser("Owner","owner","5678");const exported=exportServicePointBackup(),parsed=parseServicePointBackup(JSON.stringify(exported));expect(parsed.businessName).toBe("Test Business");expect(parsed.stores).toHaveLength(1);localStorage.clear();restoreServicePointBackup(parsed);expect(loadPosStores()).toHaveLength(1);expect(loadLocalUsers()).toHaveLength(1);});
 it("rejects a backup from another product",()=>expect(()=>parseServicePointBackup('{"product":"other","schemaVersion":1,"stores":[],"storeData":{}}')).toThrow(/Invalid/));
});
