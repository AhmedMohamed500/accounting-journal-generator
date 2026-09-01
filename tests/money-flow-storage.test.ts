// @vitest-environment jsdom
import { beforeEach,describe,expect,it } from "vitest";
import { loadMoneyFlowProgress,MONEY_FLOW_STORAGE_KEY,recordMoneyFlowResult,setMoneyFlowLearningStage } from "@/lib/storage/money-flow";

const result=(score=88)=>({scenarioId:"flow-capital",completedAt:"2026-09-02T12:00:00.000Z",mode:"beginner" as const,attempts:2,mistakes:1,hintsUsed:0,score,masteredSkills:["account-nature" as const,"debit-credit" as const]});
describe("Money Flow training isolation and progress",()=>{
 beforeEach(()=>localStorage.clear());
 it("uses only its training storage key",()=>{recordMoneyFlowResult(result());expect(localStorage.length).toBe(1);expect(localStorage.key(0)).toBe(MONEY_FLOW_STORAGE_KEY);});
 it("never modifies accounting, customer, supplier, or bank keys",()=>{const keys=["journal-recent:company","customer-receivables:company","parties:company","bank-reconciliation:company"];keys.forEach((key)=>localStorage.setItem(key,"sentinel"));recordMoneyFlowResult(result());keys.forEach((key)=>expect(localStorage.getItem(key)).toBe("sentinel"));});
 it("keeps best score and accumulates learning evidence",()=>{recordMoneyFlowResult(result(95));const progress=recordMoneyFlowResult(result(70)),record=progress.records["flow-capital"];expect(record.bestScore).toBe(95);expect(record.attempts).toBe(4);expect(record.mistakes).toBe(2);expect(progress.skills["account-nature"]).toBeGreaterThan(0);});
 it("saves the selected progressive learning stage",()=>{setMoneyFlowLearningStage("advanced");expect(loadMoneyFlowProgress().currentLearningStage).toBe("advanced");});
});
