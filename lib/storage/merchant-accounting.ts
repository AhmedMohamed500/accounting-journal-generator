import type { MerchantAccountingData } from "@/types";
import { companyKey } from "./accounting";
import { emptyMerchantData, validateMerchantBackup } from "@/lib/pos/merchant-accounting";

export const MERCHANT_ACCOUNTING_KEY="finora-small-merchant-accounting";
const key=(storeId:string)=>`${companyKey(MERCHANT_ACCOUNTING_KEY)}:store:${storeId}`;
export function loadMerchantAccounting(storeId:string):MerchantAccountingData{if(typeof window==="undefined")return emptyMerchantData(storeId);try{const raw=JSON.parse(localStorage.getItem(key(storeId))||"null") as unknown;if(validateMerchantBackup(raw))return raw;}catch{}return emptyMerchantData(storeId);}
export function saveMerchantAccounting(storeId:string,data:MerchantAccountingData){const next={...data,schemaVersion:1 as const,storeId,updatedAt:new Date().toISOString()};localStorage.setItem(key(storeId),JSON.stringify(next));return next;}
export function exportMerchantAccounting(storeId:string){return loadMerchantAccounting(storeId);}
export function restoreMerchantAccounting(storeId:string,value:unknown){if(!validateMerchantBackup(value))throw new Error("ملف النسخة الاحتياطية غير صالح");if(value.storeId!==storeId)throw new Error("النسخة تخص محلًا آخر");return saveMerchantAccounting(storeId,value);}
export function clearMerchantDemoData(storeId:string){const data=loadMerchantAccounting(storeId),keep=<T extends {isDemo?:boolean}>(items:T[])=>items.filter(item=>!item.isDemo);return saveMerchantAccounting(storeId,{...data,merchants:keep(data.merchants),transactions:keep(data.transactions),customers:keep(data.customers),suppliers:keep(data.suppliers),inventory:keep(data.inventory),packages:keep(data.packages),subscriptions:keep(data.subscriptions),alerts:keep(data.alerts),tasks:keep(data.tasks)});}
