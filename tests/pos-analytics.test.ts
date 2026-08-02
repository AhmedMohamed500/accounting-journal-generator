import { describe, expect, it } from "vitest";
import { calculatePosCommandCenter, calculateProviderPerformance, countDuplicateRisks, isEffectivePosOperation, liquidityRecommendation, posReportCatalog } from "@/lib/pos/analytics";
import { calculatePosOperation, calculatePosShiftSnapshot } from "@/lib/pos/engine";
import { posProviders } from "@/data/pos";
import type { PosOperation, PosShift } from "@/types";

const shift: PosShift = { id:"s",storeName:"محل",cashierName:"أحمد",businessDate:"2026-08-02",openedAt:"2026-08-02T08:00:00Z",status:"open",openingCash:1000,providers:posProviders.map((p)=>({providerId:p.id,openingBalance:p.id==="vodafone-cash"?2000:0})) };
const operation=(overrides:Partial<PosOperation>={})=>({...calculatePosOperation({shiftId:"s",businessDate:"2026-08-02",type:"send-transfer",providerId:"vodafone-cash",amount:100,customerFee:5,providerCost:1,reference:"R-1"}),status:"successful" as const,...overrides});

describe("POS command center analytics",()=>{
 it("recognizes successful operations",()=>expect(isEffectivePosOperation(operation())).toBe(true));
 it("excludes pending operations",()=>expect(isEffectivePosOperation(operation({status:"pending"}))).toBe(false));
 it("excludes failed operations",()=>expect(isEffectivePosOperation(operation({status:"failed"}))).toBe(false));
 it("excludes reversing rows from ordinary activity",()=>expect(isEffectivePosOperation(operation({reversalOfOperationId:"old"}))).toBe(false));
 it("calculates provider volume",()=>expect(calculateProviderPerformance([operation()],calculatePosShiftSnapshot(shift,[operation()]).expectedProviders).find(x=>x.providerId==="vodafone-cash")?.volume).toBe(100));
 it("calculates provider profit",()=>expect(calculateProviderPerformance([operation()],calculatePosShiftSnapshot(shift,[operation()]).expectedProviders).find(x=>x.providerId==="vodafone-cash")?.profit).toBe(4));
 it("calculates provider margin",()=>expect(calculateProviderPerformance([operation()],calculatePosShiftSnapshot(shift,[operation()]).expectedProviders).find(x=>x.providerId==="vodafone-cash")?.margin).toBe(80));
 it("marks unused providers dormant",()=>expect(calculateProviderPerformance([],calculatePosShiftSnapshot(shift,[]).expectedProviders).find(x=>x.providerId==="fawry")?.health).toBe("dormant"));
 it("calculates total liquidity",()=>{const s=calculatePosShiftSnapshot(shift,[operation()]);expect(calculatePosCommandCenter(s,[operation()]).totalLiquidity).toBe(s.expectedCash+Object.values(s.expectedProviders).reduce((a,b)=>a+b,0));});
 it("calculates money in from cash change",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[operation()]),[operation()]).moneyIn).toBe(105));
 it("calculates true profit",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[operation()]),[operation()]).trueProfit).toBe(4));
 it("does not count pending profit",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[]),[operation({status:"pending"})]).trueProfit).toBe(0));
 it("counts pending operations",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[]),[operation({status:"pending"})]).pending).toBe(1));
 it("counts failed operations",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[]),[operation({status:"failed"})]).failed).toBe(1));
 it("counts reversed operations",()=>expect(calculatePosCommandCenter(calculatePosShiftSnapshot(shift,[]),[operation({status:"reversed"})]).reversed).toBe(1));
 it("detects a repeated reference",()=>expect(countDuplicateRisks([operation(),operation({id:"two"})])).toBe(1));
 it("does not flag distinct references",()=>expect(countDuplicateRisks([operation(),operation({id:"two",reference:"R-2"})])).toBe(0));
 it("does not flag empty references",()=>expect(countDuplicateRisks([operation({reference:undefined}),operation({id:"two",reference:undefined})])).toBe(0));
 it("provides healthy liquidity guidance",()=>expect(liquidityRecommendation("healthy",true)).toContain("مناسب"));
 it("provides low liquidity guidance",()=>expect(liquidityRecommendation("low",true)).toContain("منخفض"));
 it("provides dormant liquidity guidance",()=>expect(liquidityRecommendation("dormant",true)).toContain("راكد"));
 it("provides English guidance",()=>expect(liquidityRecommendation("low",false)).toContain("Low"));
 it("ships twenty two report definitions",()=>expect(posReportCatalog).toHaveLength(22));
});
