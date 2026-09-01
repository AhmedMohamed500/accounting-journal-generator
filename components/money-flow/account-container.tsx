"use client";

import { Banknote, Building2, CircleDollarSign, HandCoins, Landmark, Package, ReceiptText, TrendingUp, Users } from "lucide-react";
import type { Locale, MoneyFlowAccount, MoneyFlowDirection } from "@/types";

const icons={bank:Landmark,cash:Banknote,customer:Users,supplier:HandCoins,capital:CircleDollarSign,revenue:TrendingUp,expense:ReceiptText,equipment:Building2,inventory:Package};
const typeLabel=(type:MoneyFlowAccount["type"],ar:boolean)=>({asset:ar?"أصل":"Asset",liability:ar?"التزام":"Liability",equity:ar?"حقوق ملكية":"Equity",revenue:ar?"إيراد":"Revenue",expense:ar?"مصروف":"Expense"})[type];

export function AccountContainer({account,locale,change=0,revealType=false,selected=false,disabled=false,onSelect,onDropToken,onPointerDrop}:{account:MoneyFlowAccount;locale:Locale;change?:number;revealType?:boolean;selected?:boolean;disabled?:boolean;onSelect?:()=>void;onDropToken?:(tokenId:string)=>void;onPointerDrop?:()=>void}){
  const ar=locale==="ar",Icon=icons[account.icon],after=account.balance+change,direction:MoneyFlowDirection=change>0?"increase":change<0?"decrease":"none";
  return <button type="button" className={`flow-account ${selected?"selected":""} ${change?"changed":""}`} disabled={disabled} aria-pressed={selected} onClick={onSelect} onPointerUp={onPointerDrop} onDragOver={(event)=>{if(onDropToken)event.preventDefault();}} onDrop={(event)=>{event.preventDefault();onDropToken?.(event.dataTransfer.getData("text/plain"));}}>
    <span className="flow-account-icon"><Icon/></span><span className="flow-account-copy"><b>{ar?account.nameAr:account.nameEn}</b><small>{ar?account.plainAr:account.plainEn}</small>{revealType&&<em>{typeLabel(account.type,ar)}</em>}</span>
    <span className="flow-account-balance"><small>{ar?"الرصيد":"Balance"}</small><b dir="ltr">{after.toLocaleString("en-US")} EGP</b>{change!==0&&<i className={direction}><span>{direction==="increase"?"↑":"↓"}</span>{account.balance.toLocaleString("en-US")} → {after.toLocaleString("en-US")}</i>}</span>
  </button>;
}
