import { describe, expect, it } from "vitest";
import { ARENA_SCORE_CONFIG, buildStatements, buildTrialBalance, calculateAccuracy, calculateProfessionalScore, calculateSkillRating, classifyAccount, confidenceFor, createMistakeChain, createPerformanceReview, dailyCaseIndex, deriveAchievements, difficultyWeight, movementSide, normalSide, postToLedger, recoveryScore, sortLeaderboard, updateCfoTrust, updateCompanyHealth, validateJournal, verifySkill } from "@/lib/arena/engine";
import { applyAttempt, ARENA_STORAGE_KEY, createArenaProfile, loadArenaProfile, saveArenaProfile, skillIds } from "@/lib/arena/profile";
import { bossChallenges, careerStages, demoLeaderboard, seasonOne, serviceWorld, weeklyMystery, workShifts } from "@/data/arena";
import type { ArenaAttempt, ArenaDifficulty, ArenaSkillId, JournalLine, LeaderboardEntry } from "@/types";

const attempt=(caseId:string,accuracy=90,difficulty:ArenaDifficulty="intermediate",skills:ArenaSkillId[]=["journal-entries"],ranked=true):ArenaAttempt=>({caseId,mode:"mission",difficulty,accuracy,score:accuracy*10,hintsUsed:0,durationSeconds:120,completedAt:"2026-09-02T00:00:00.000Z",skills,ranked});

describe("FINORA Arena accounting engine",()=>{
 it("classifies chart of accounts cards",()=>{expect(classifyAccount("bank")).toBe("asset");expect(classifyAccount("suppliers")).toBe("liability");expect(classifyAccount("rent")).toBe("expense")});
 it("uses debit normal side for assets and expenses",()=>{expect(normalSide("asset")).toBe("debit");expect(normalSide("expense")).toBe("debit")});
 it("uses credit normal side for liabilities, equity, and revenue",()=>{expect(normalSide("liability")).toBe("credit");expect(normalSide("equity")).toBe("credit");expect(normalSide("revenue")).toBe("credit")});
 it("discovers increase and decrease sides",()=>{expect(movementSide("asset","increase")).toBe("debit");expect(movementSide("asset","decrease")).toBe("credit");expect(movementSide("liability","increase")).toBe("credit")});
 it("validates balanced journals",()=>{expect(validateJournal([{accountId:"bank",debit:200000,credit:0},{accountId:"capital",debit:0,credit:200000}])).toMatchObject({balanced:true,difference:0})});
 it("explains an unbalanced difference",()=>{expect(validateJournal([{accountId:"rent",debit:10000,credit:0},{accountId:"cash",debit:0,credit:9000}])).toMatchObject({balanced:false,difference:1000})});
 it("rejects a line carrying debit and credit",()=>{expect(validateJournal([{accountId:"bank",debit:1,credit:1},{accountId:"capital",debit:0,credit:1}]).balanced).toBe(false)});
 it("posts journal lines to account ledgers",()=>{const rows=postToLedger([{accountId:"bank",debit:100,credit:0},{accountId:"bank",debit:0,credit:20},{accountId:"revenue",debit:0,credit:80}]);expect(rows.find(r=>r.accountId==="bank")).toMatchObject({balance:80,side:"debit"})});
 it("builds a balanced trial balance",()=>{const tb=buildTrialBalance(postToLedger([{accountId:"bank",debit:100,credit:0},{accountId:"revenue",debit:0,credit:100}]));expect(tb.debit).toBe(tb.credit)});
 it("simulates an income statement",()=>{expect(buildStatements({revenue:100000,rent:20000,salaries:30000,utilities:10000}).profit).toBe(40000)});
 it("simulates a statement of financial position",()=>{expect(buildStatements({bank:200000,capital:200000})).toMatchObject({assets:200000,equity:200000})});
 it("models customer credit sale without cash",()=>{const j:JournalLine[]=[{accountId:"customers",debit:10000,credit:0},{accountId:"revenue",debit:0,credit:10000}];expect(validateJournal(j).balanced).toBe(true);expect(postToLedger(j).find(x=>x.accountId==="customers")?.balance).toBe(10000)});
 it("models customer collection without duplicate revenue",()=>{const ids=postToLedger([{accountId:"bank",debit:10000,credit:0},{accountId:"customers",debit:0,credit:10000}]).map(x=>x.accountId);expect(ids).not.toContain("revenue")});
 it("models supplier credit purchase",()=>{expect(validateJournal([{accountId:"equipment",debit:11400,credit:0},{accountId:"suppliers",debit:0,credit:11400}]).balanced).toBe(true)});
 it("models an internal transfer without expense",()=>{const ids=postToLedger([{accountId:"cash",debit:5000,credit:0},{accountId:"bank",debit:0,credit:5000}]).map(x=>x.accountId);expect(ids).not.toContain("expense")});
 it("models illustrative VAT as its own balanced line",()=>{expect(validateJournal([{accountId:"expense",debit:10000,credit:0},{accountId:"input-vat",debit:1400,credit:0},{accountId:"suppliers",debit:0,credit:11400}]).balanced).toBe(true)});
 it("models an accrued expense adjustment",()=>{expect(validateJournal([{accountId:"utilities",debit:2000,credit:0},{accountId:"accrued-expense",debit:0,credit:2000}]).balanced).toBe(true)});
});

describe("FINORA Arena professional evaluation",()=>{
 it("uses the requested configurable score weights",()=>{expect(Object.values(ARENA_SCORE_CONFIG).reduce((a,b)=>a+b,0)).toBeCloseTo(1)});
 it("weights hard cases above easy cases",()=>{expect(difficultyWeight.advanced).toBeGreaterThan(difficultyWeight.beginner)});
 it("prevents grinding by counting the best unique attempt",()=>{const repeated=Array.from({length:500},()=>attempt("same-easy",75,"beginner"));expect(calculateProfessionalScore(repeated)).toBe(calculateProfessionalScore([repeated[0]]))});
 it("gives 30 hard accurate cases a better score than 500 repeated easy cases",()=>{const hard=Array.from({length:30},(_,i)=>attempt(`hard-${i}`,95,"advanced"));const easy=Array.from({length:500},()=>attempt("same-easy",75,"beginner"));expect(calculateProfessionalScore(hard)).toBeGreaterThan(calculateProfessionalScore(easy))});
 it("excludes practice replay from ranked score",()=>{expect(calculateProfessionalScore([attempt("practice",100,"advanced",["journal-entries"],false)])).toBe(0)});
 it("uses best attempt for accuracy",()=>{expect(calculateAccuracy([attempt("a",40),attempt("a",90),attempt("b",80)])).toBe(85)});
 it("does not verify a skill from one case",()=>{const r=calculateSkillRating("banking",[attempt("bank-1",100,"advanced",["banking"])]);expect(verifySkill(r)).toBe(false)});
 it("verifies a skill only with diverse accurate non-easy evidence",()=>{const r=calculateSkillRating("banking",Array.from({length:5},(_,i)=>attempt(`bank-${i}`,90,"intermediate",["banking"])));expect(r.confidence).toBe("verified")});
 it("keeps confidence low with insufficient unique cases",()=>{expect(confidenceFor({attempts:10,uniqueCases:1,bestAccuracy:100,maxDifficulty:"advanced"})).toBe("low")});
 it("sorts leaderboard by professional score before activity count",()=>{const rows:LeaderboardEntry[]=[{...demoLeaderboard[0],id:"hard",professionalScore:900,uniqueCases:30},{...demoLeaderboard[1],id:"grind",professionalScore:600,uniqueCases:500}];expect(sortLeaderboard(rows)[0].id).toBe("hard")});
 it("updates CFO trust by configured professional events",()=>{expect(updateCfoTrust(50,"correct")).toBe(52);expect(updateCfoTrust(50,"critical-mistake")).toBe(45);expect(updateCfoTrust(99,"critical-correct")).toBe(100)});
 it("clamps company health indicators",()=>{expect(updateCompanyHealth(createArenaProfile().companyHealth,{cash:100}).cash).toBe(100)});
 it("evaluates error recovery",()=>{expect(recoveryScore(true,true,0,true)).toBe(100);expect(recoveryScore(false,false,3,false)).toBe(0)});
 it("selects daily challenge deterministically",()=>{expect(dailyCaseIndex("2026-09-02",5)).toBe(dailyCaseIndex("2026-09-02",5))});
 it("updates career profile from a ranked attempt",()=>{const p=applyAttempt(createArenaProfile(),attempt("first",95,"advanced",["journal-entries"]));expect(p.uniqueCases).toBe(1);expect(p.professionalScore).toBeGreaterThan(0)});
 it("awards professional achievements from evidence",()=>{expect(deriveAchievements([attempt("journal",100,"intermediate",["journal-entries"])])).toEqual(expect.arrayContaining([expect.objectContaining({id:"first-balanced-entry"})]))});
 it("creates an evidence-led performance review",()=>{expect(createPerformanceReview(applyAttempt(createArenaProfile(),attempt("first",90)))).toMatchObject({recommendedMissionId:"collection-or-revenue"})});
 it("delays mistake consequences for three tasks",()=>{expect(createMistakeChain("collection-as-revenue")).toMatchObject({delayedByTasks:3,resolved:false,affectedHealth:["receivables","profitIntegrity","accountingAccuracy"]})});
});

describe("Arena architecture and isolation",()=>{
 it("starts a new learner with no fabricated progress",()=>{const profile=createArenaProfile();expect(profile).toMatchObject({professionalScore:0,accuracy:0,uniqueCases:0,currentStreak:0,cfoTrust:{value:0}});expect(Object.values(profile.companyHealth).every(value=>value===0)).toBe(true);expect(Object.values(profile.skills).every(skill=>skill.score===0)).toBe(true)});
 it("defines all twenty requested skill dimensions including recovery",()=>{expect(skillIds).toHaveLength(20);expect(skillIds).toContain("recovery")});
 it("starts the career from zero and ends with a full cycle",()=>{expect(careerStages[0].id).toBe("why-accounts");expect(careerStages.at(-1)?.id).toBe("full-cycle")});
 it("ships only the active service company world",()=>{expect(serviceWorld).toMatchObject({id:"service-company",active:true})});
 it("provides a season, work shift, and professional boss foundation",()=>{expect(seasonOne.stageIds.length).toBeGreaterThan(0);expect(workShifts[0].taskIds.length).toBeGreaterThanOrEqual(3);expect(bossChallenges.some(x=>x.id==="month-close")).toBe(true)});
 it("provides one weekly mystery demo with mixed evidence",()=>{expect(weeklyMystery.evidence).toEqual(expect.arrayContaining(["supplier-invoice","spreadsheet-row"]))});
 it("uses a training-only storage key",()=>{expect(ARENA_STORAGE_KEY).toMatch(/^finora-training-/);expect(ARENA_STORAGE_KEY).not.toContain("accounting-data")});
 it("does not write company accounting storage",()=>{localStorage.clear();saveArenaProfile(createArenaProfile());expect(localStorage.length).toBe(1);expect(localStorage.getItem(ARENA_STORAGE_KEY)).toBeTruthy()});
 it("loads malformed local profile safely",()=>{localStorage.setItem(ARENA_STORAGE_KEY,"not-json");expect(loadArenaProfile().careerRank).toBe("intern")});
});
