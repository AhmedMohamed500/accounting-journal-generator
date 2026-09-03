import { posProviders } from "@/data/pos";
import { servicePointCommercialConfig } from "@/data/service-point-plans";
import { calculatePosOperation, calculatePosShiftSnapshot, createPosJournalEntry } from "@/lib/pos/engine";
import { createLocalTrial, hashLocalPin } from "@/lib/pos/demo";
import type { LocalAuditEntry, LocalRole, LocalSubscription, LocalUser, ServicePointBackup, ServicePointDemoSettings } from "@/types/service-point-demo";
import type { PosShift } from "@/types";
import { companyKey } from "./accounting";
import { createPosStore, loadPosEntries, loadPosOperations, loadPosShifts, loadPosStores, savePosEntries, savePosOperations, savePosShifts, savePosStores, setActivePosStoreId } from "./pos";

export const SERVICE_POINT_SETTINGS_KEY="finora-service-point-demo-settings";
export const SERVICE_POINT_USERS_KEY="finora-service-point-local-users";
export const SERVICE_POINT_AUDIT_KEY="finora-service-point-local-audit";
export const SERVICE_POINT_SUBSCRIPTION_KEY="finora-service-point-subscription";
export const SERVICE_POINT_SESSION_KEY="finora-service-point-local-session";

const key=(value:string)=>companyKey(value);
const read=<T>(name:string,fallback:T):T=>{if(typeof window==="undefined")return fallback;try{return JSON.parse(localStorage.getItem(key(name))||"null")||fallback;}catch{return fallback;}};
const write=<T>(name:string,value:T)=>localStorage.setItem(key(name),JSON.stringify(value));
export const defaultServicePointSettings=():ServicePointDemoSettings=>({schemaVersion:1,onboardingComplete:false,profileMode:"empty",businessName:"",enabledProviders:posProviders.map(x=>x.id),salesDemoMode:false,tourComplete:false,demoStoreIds:[]});
export const loadServicePointSettings=()=>read(SERVICE_POINT_SETTINGS_KEY,defaultServicePointSettings());
export const saveServicePointSettings=(value:ServicePointDemoSettings)=>write(SERVICE_POINT_SETTINGS_KEY,value);
export const loadLocalUsers=()=>read<LocalUser[]>(SERVICE_POINT_USERS_KEY,[]);
export const saveLocalUsers=(value:LocalUser[])=>write(SERVICE_POINT_USERS_KEY,value);
export const loadLocalAudit=()=>read<LocalAuditEntry[]>(SERVICE_POINT_AUDIT_KEY,[]);
export const loadLocalSubscription=()=>read<LocalSubscription>(SERVICE_POINT_SUBSCRIPTION_KEY,createLocalTrial());
export const saveLocalSubscription=(value:LocalSubscription)=>write(SERVICE_POINT_SUBSCRIPTION_KEY,value);
export const currentLocalUser=()=>typeof window==="undefined"?undefined:loadLocalUsers().find(user=>user.id===localStorage.getItem(key(SERVICE_POINT_SESSION_KEY)));
export function setCurrentLocalUser(userId:string){localStorage.setItem(key(SERVICE_POINT_SESSION_KEY),userId);const user=loadLocalUsers().find(x=>x.id===userId);appendLocalAudit("login","session",user?`Local sign-in: ${user.name}`:"Local sign-in",user);}

export async function createLocalUser(name:string,role:LocalRole,pin:string){const salt=crypto.randomUUID(),user:LocalUser={id:crypto.randomUUID(),name:name.trim(),role,pinSalt:salt,pinHash:await hashLocalPin(pin,salt),active:true,createdAt:new Date().toISOString()};saveLocalUsers([...loadLocalUsers(),user]);appendLocalAudit("create-user","user",`${user.name} (${role})`,user);return user;}
export async function verifyLocalPin(user:LocalUser,pin:string){return user.pinHash===await hashLocalPin(pin,user.pinSalt);}
export function appendLocalAudit(action:string,entity:string,details:string,user=currentLocalUser()){const entry:LocalAuditEntry={id:crypto.randomUUID(),at:new Date().toISOString(),userId:user?.id,userName:user?.name||"System",action,entity,details};write(SERVICE_POINT_AUDIT_KEY,[entry,...loadLocalAudit()].slice(0,3000));return entry;}

export function ensureLocalSubscription(plan:"starter"|"pro"|"business"="pro"){const raw=localStorage.getItem(key(SERVICE_POINT_SUBSCRIPTION_KEY));if(raw)return loadLocalSubscription();const value=createLocalTrial(new Date(),plan);saveLocalSubscription(value);return value;}

export function seedSalesDemo(){
  const settings=loadServicePointSettings();
  const existing=settings.demoStoreIds?.map(id=>loadPosStores().find(x=>x.id===id)).find(Boolean);
  if(existing){setActivePosStoreId(existing.id);return existing;}
  const store=createPosStore("FINORA Demo Store"),now=new Date(),date=now.toISOString().slice(0,10),yesterday=new Date(now.getTime()-86_400_000).toISOString().slice(0,10);
  const shift:PosShift={id:crypto.randomUUID(),storeName:store.name,cashierName:"أحمد — Demo",businessDate:date,openedAt:new Date(now.getTime()-4*3_600_000).toISOString(),status:"open",openingCash:5000,providers:posProviders.map((provider,index)=>({providerId:provider.id,openingBalance:[1600,20000,4200,3100,2800,2200,3500][index]}))};
  const specs=[
    ["fawry",850,8,2,"FWR-1031"],["vodafone-cash",1200,15,3,"VFC-8842"],["orange-cash",500,7,1,"ORG-2201"],["fawry",330,5,1,"FWR-1045"],["aman",700,10,2,"AMN-7751"],
  ] as const;
  const operations=specs.map(([providerId,amount,fee,cost,reference],index)=>({...calculatePosOperation({shiftId:shift.id,businessDate:date,type:index===3?"bill-payment":"send-transfer",providerId,amount,customerFee:fee,providerCost:cost,reference}),at:new Date(now.getTime()-(index+1)*28*60_000).toISOString(),status:"successful" as const}));
  const pending=[
    {...calculatePosOperation({shiftId:shift.id,businessDate:date,type:"recharge",providerId:"etisalat-cash",amount:250,customerFee:5,providerCost:1,reference:"ET-PENDING"}),at:new Date(now.getTime()-95*60_000).toISOString(),status:"pending" as const},
    {...calculatePosOperation({shiftId:shift.id,businessDate:date,type:"bill-payment",providerId:"aman",amount:180,customerFee:4,providerCost:1,reference:"AM-PENDING"}),at:new Date(now.getTime()-18*60_000).toISOString(),status:"pending" as const},
  ];
  const previousShift:PosShift={id:crypto.randomUUID(),storeName:store.name,cashierName:"سارة — Demo",businessDate:yesterday,openedAt:new Date(now.getTime()-30*3_600_000).toISOString(),closedAt:new Date(now.getTime()-22*3_600_000).toISOString(),status:"closed",openingCash:4200,providers:posProviders.map((provider,index)=>({providerId:provider.id,openingBalance:[5200,9000,4000,3400,3200,2600,3000][index]}))};
  const previousOperations=[
    {...calculatePosOperation({shiftId:previousShift.id,businessDate:yesterday,type:"send-transfer",providerId:"fawry",amount:1100,customerFee:15,providerCost:3,reference:"FWR-Y-01"}),at:new Date(now.getTime()-27*3_600_000).toISOString(),status:"successful" as const},
    {...calculatePosOperation({shiftId:previousShift.id,businessDate:yesterday,type:"cash-withdrawal",providerId:"vodafone-cash",amount:700,customerFee:12,providerCost:2,reference:"VFC-Y-02"}),at:new Date(now.getTime()-25*3_600_000).toISOString(),status:"successful" as const},
  ];
  const previousSnapshot=calculatePosShiftSnapshot(previousShift,previousOperations);
  previousShift.actualClosingCash=previousSnapshot.expectedCash-18;
  previousShift.providers=previousShift.providers.map(provider=>({...provider,actualClosingBalance:previousSnapshot.expectedProviders[provider.providerId]}));
  const allOperations=[...pending,...operations,...previousOperations];
  const entries=[...operations,...previousOperations].map(operation=>({...createPosJournalEntry(operation),workflowStatus:"posted" as const}));
  savePosShifts(store.id,[shift,previousShift]);savePosOperations(store.id,allOperations);savePosEntries(store.id,entries);
  saveServicePointSettings({...settings,salesDemoMode:true,demoStoreIds:[...(settings.demoStoreIds||[]),store.id]});
  appendLocalAudit("seed-demo","store",`Created isolated sales demo: ${store.name}`);return store;
}

export function resetSalesDemo(){const settings=loadServicePointSettings(),ids=new Set(settings.demoStoreIds||[]);if(!ids.size)return;savePosStores(loadPosStores().filter(store=>!ids.has(store.id)));ids.forEach(id=>{savePosShifts(id,[]);savePosOperations(id,[]);savePosEntries(id,[]);});const remaining=loadPosStores();if(remaining[0])setActivePosStoreId(remaining[0].id);saveServicePointSettings({...settings,salesDemoMode:false,demoStoreIds:[]});appendLocalAudit("reset-demo","store","Removed isolated sales demo data");}

export function exportServicePointBackup():ServicePointBackup{const settings=loadServicePointSettings(),stores=loadPosStores(),backup:ServicePointBackup={product:"FINORA Service Point",schemaVersion:1,exportedAt:new Date().toISOString(),businessName:settings.businessName,settings:{...settings,lastBackupAt:new Date().toISOString()},users:loadLocalUsers(),audit:loadLocalAudit(),subscription:loadLocalSubscription(),stores,storeData:Object.fromEntries(stores.map(store=>[store.id,{shifts:loadPosShifts(store.id),operations:loadPosOperations(store.id),entries:loadPosEntries(store.id)}]))};saveServicePointSettings(backup.settings);appendLocalAudit("backup","system",`Exported ${stores.length} stores`);return backup;}
export function parseServicePointBackup(text:string){const value=JSON.parse(text) as ServicePointBackup;if(value.product!=="FINORA Service Point"||value.schemaVersion!==1||!Array.isArray(value.stores)||!value.storeData)throw new Error("Invalid FINORA Service Point backup");return value;}
export function restoreServicePointBackup(backup:ServicePointBackup){savePosStores(backup.stores as ReturnType<typeof loadPosStores>);for(const store of backup.stores as ReturnType<typeof loadPosStores>){const data=backup.storeData[store.id];if(data){savePosShifts(store.id,data.shifts as ReturnType<typeof loadPosShifts>);savePosOperations(store.id,data.operations as ReturnType<typeof loadPosOperations>);savePosEntries(store.id,data.entries as ReturnType<typeof loadPosEntries>);}}saveServicePointSettings(backup.settings);saveLocalUsers(backup.users);write(SERVICE_POINT_AUDIT_KEY,backup.audit);saveLocalSubscription(backup.subscription);if((backup.stores as ReturnType<typeof loadPosStores>)[0])setActivePosStoreId((backup.stores as ReturnType<typeof loadPosStores>)[0].id);appendLocalAudit("restore","system",`Restored backup from ${backup.exportedAt}`);}

export function backupOverdue(settings=loadServicePointSettings(),now=new Date()){if(!settings.lastBackupAt)return true;return now.getTime()-new Date(settings.lastBackupAt).getTime()>=servicePointCommercialConfig.backupReminderDays*86_400_000;}
