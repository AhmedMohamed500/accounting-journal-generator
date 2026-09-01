import { validateJournalEntry } from "@/lib/accounting/validation";
import type { AccountType, GeneratedJournalEntry, MoneyFlowAccount, MoneyFlowConsequence, MoneyFlowDirection, MoneyFlowJournalLine, MoneyFlowScenario } from "@/types";

export type JournalSide = "debit" | "credit" | "none";
export const deriveJournalSide = (type:AccountType, change:number):JournalSide => {
  if (!change) return "none";
  const debitNature = type === "asset" || type === "expense";
  return (change > 0) === debitNature ? "debit" : "credit";
};

export const movementDirection = (change:number):MoneyFlowDirection => change > 0 ? "increase" : change < 0 ? "decrease" : "none";
export const isCorrectMoneyMovement = (scenario:MoneyFlowScenario, tokenId:string, destinationAccountId:string, sourceAccountId?:string) => {
  const expected = scenario.correctMovement;
  return tokenId === expected.tokenId && destinationAccountId === expected.destinationAccountId && (expected.sourceAccountId || undefined) === (sourceAccountId || undefined);
};

export function applyMoneyMovement(scenario:MoneyFlowScenario) {
  return scenario.accounts.map((item) => {
    const change = scenario.correctMovement.accountChanges[item.id] || 0;
    return { ...item, before:item.balance, change, after:item.balance + change, direction:movementDirection(change), journalSide:deriveJournalSide(item.type,change) };
  });
}

export const getWrongMovementConsequence = (scenario:MoneyFlowScenario,targetAccountId:string):MoneyFlowConsequence | undefined => scenario.wrongConsequences.find((item)=>item.targetAccountId===targetAccountId);
export const isQuestionAnswerCorrect = (scenario:MoneyFlowScenario,questionId:string,choiceId:string) => scenario.questions.find((item)=>item.id===questionId)?.correctChoiceId===choiceId;
export const isReverseAnswerCorrect = (scenario:MoneyFlowScenario,choiceId:string) => scenario.reverseQuestion.correctChoiceId===choiceId;
export const resolveVariation = (scenario:MoneyFlowScenario,index=0) => scenario.variations[index];

export function buildMoneyFlowTrainingEntry(scenario:MoneyFlowScenario):GeneratedJournalEntry {
  const lines = scenario.journalEntry.lines.map((item,index)=>({id:`flow-${scenario.id}-${index+1}`,accountCode:item.accountCode,accountNameAr:item.accountNameAr,accountNameEn:item.accountNameEn,debit:item.debit,credit:item.credit}));
  const totalDebit = lines.reduce((sum,item)=>sum+item.debit,0), totalCredit = lines.reduce((sum,item)=>sum+item.credit,0);
  return {id:`training-money-flow-${scenario.id}`,entryNumber:`FLOW-${scenario.number}`,date:"2026-01-01",transactionType:"training-money-flow",titleAr:scenario.titleAr,titleEn:scenario.titleEn,narrationAr:scenario.journalEntry.narrationAr,narrationEn:scenario.journalEntry.narrationEn,currency:"EGP",lines,totalDebit,totalCredit,isBalanced:Math.abs(totalDebit-totalCredit)<.01,explanationAr:[],explanationEn:[],assumptionsAr:[],assumptionsEn:[],warningsAr:[],warningsEn:[],accountingRuleAr:"تدريب معزول — لا يُحفظ في قيود الشركة",accountingRuleEn:"Isolated training — never saved to company journals",financialStatementImpact:{assets:0,liabilities:0,equity:0,revenue:0,expenses:0,profit:0},source:"manual",workflowStatus:"draft"};
}

export const validateMoneyFlowJournal = (scenario:MoneyFlowScenario) => validateJournalEntry(buildMoneyFlowTrainingEntry(scenario));

export function validateMoneyFlowScenario(scenario:MoneyFlowScenario) {
  const accountIds = new Set(scenario.accounts.map((item)=>item.id)), tokenIds = new Set(scenario.tokens.map((item)=>item.id));
  const uniqueAccounts = accountIds.size===scenario.accounts.length;
  const movementValid = tokenIds.has(scenario.correctMovement.tokenId) && accountIds.has(scenario.correctMovement.destinationAccountId) && (!scenario.correctMovement.sourceAccountId || accountIds.has(scenario.correctMovement.sourceAccountId)) && Object.keys(scenario.correctMovement.accountChanges).every((id)=>accountIds.has(id));
  const nonNegative = applyMoneyMovement(scenario).every((item)=>item.after>=0);
  const journal = validateMoneyFlowJournal(scenario), journalBalanced = journal.valid;
  const derivationValid = scenario.journalEntry.lines.every((journalLine:MoneyFlowJournalLine)=>{
    const account = scenario.accounts.find((item)=>item.id===journalLine.accountId), change=scenario.correctMovement.accountChanges[journalLine.accountId]||0;
    if (!account || !change) return false;
    const side=deriveJournalSide(account.type,change);
    return side==="debit" ? journalLine.debit>0&&journalLine.credit===0 : side==="credit" ? journalLine.credit>0&&journalLine.debit===0 : false;
  });
  const questionValid = scenario.questions.every((item)=>item.choices.some((choice)=>choice.id===item.correctChoiceId));
  const reverseValid = scenario.reverseQuestion.choices.some((choice)=>choice.id===scenario.reverseQuestion.correctChoiceId);
  return {valid:Boolean(scenario.id&&scenario.slug)&&uniqueAccounts&&movementValid&&nonNegative&&journalBalanced&&derivationValid&&questionValid&&reverseValid,uniqueAccounts,movementValid,nonNegative,journalBalanced,derivationValid,questionValid,reverseValid};
}

export const calculateMoneyFlowScore = (mistakes:number,hintsUsed:number) => Math.max(40,100-mistakes*12-hintsUsed*8);
export const accountById = (scenario:MoneyFlowScenario,id:string):MoneyFlowAccount | undefined => scenario.accounts.find((item)=>item.id===id);
