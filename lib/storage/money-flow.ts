import type { MoneyFlowAttemptResult, MoneyFlowDifficulty, MoneyFlowProgress, MoneyFlowScenarioProgress, MoneyFlowSkill } from "@/types";

export const MONEY_FLOW_STORAGE_KEY="finora-training-money-flow-v1", MONEY_FLOW_PROGRESS_UPDATED="finora-money-flow-progress-updated";
const empty=(stage:MoneyFlowDifficulty="beginner"):MoneyFlowProgress=>({schemaVersion:1,records:{},skills:{},currentLearningStage:stage});

export function loadMoneyFlowProgress():MoneyFlowProgress {
  if(typeof window==="undefined") return empty();
  try { const parsed=JSON.parse(localStorage.getItem(MONEY_FLOW_STORAGE_KEY)||"null") as MoneyFlowProgress|null; return parsed?.schemaVersion===1&&parsed.records&&parsed.skills?parsed:empty(); } catch { return empty(); }
}
export function saveMoneyFlowProgress(progress:MoneyFlowProgress){ if(typeof window==="undefined") return progress; localStorage.setItem(MONEY_FLOW_STORAGE_KEY,JSON.stringify(progress)); window.dispatchEvent(new CustomEvent(MONEY_FLOW_PROGRESS_UPDATED,{detail:progress})); return progress; }
export function setMoneyFlowLearningStage(stage:MoneyFlowDifficulty){ return saveMoneyFlowProgress({...loadMoneyFlowProgress(),currentLearningStage:stage}); }
export function recordMoneyFlowResult(result:MoneyFlowAttemptResult){
  const current=loadMoneyFlowProgress(),previous=current.records[result.scenarioId],skills={...current.skills};
  result.masteredSkills.forEach((skill:MoneyFlowSkill)=>{skills[skill]=Math.min(100,(skills[skill]||0)+Math.max(10,Math.round(result.score/5)));});
  const record:MoneyFlowScenarioProgress={scenarioId:result.scenarioId,completed:true,bestScore:Math.max(previous?.bestScore||0,result.score),attempts:(previous?.attempts||0)+result.attempts,mistakes:(previous?.mistakes||0)+result.mistakes,hintsUsed:(previous?.hintsUsed||0)+result.hintsUsed,lastCompletedAt:result.completedAt,lastResult:result};
  return saveMoneyFlowProgress({...current,records:{...current.records,[result.scenarioId]:record},skills,currentLearningStage:result.mode});
}
export function subscribeToMoneyFlowProgress(handler:(progress:MoneyFlowProgress)=>void){ if(typeof window==="undefined")return()=>undefined; const listener=(event:Event)=>handler((event as CustomEvent<MoneyFlowProgress>).detail||loadMoneyFlowProgress()); window.addEventListener(MONEY_FLOW_PROGRESS_UPDATED,listener); return()=>window.removeEventListener(MONEY_FLOW_PROGRESS_UPDATED,listener); }
