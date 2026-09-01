"use client";

import { Coins, GripVertical } from "lucide-react";
import type { Locale, MoneyFlowToken as Token } from "@/types";

export function MoneyToken({token,locale,active=true,dragging=false,onPointerStart}:{token:Token;locale:Locale;active?:boolean;dragging?:boolean;onPointerStart?:(tokenId:string)=>void}){
  const ar=locale==="ar";
  return <button type="button" className={`money-token ${active?"active":"placed"} ${dragging?"dragging":""}`} draggable={false} onPointerDown={()=>{if(active)onPointerStart?.(token.id);}} aria-label={ar?`قيمة ${token.amount.toLocaleString("en-US")} جنيه، اسحبها أو اختر حسابًا`:`Value ${token.amount.toLocaleString("en-US")} EGP, drag it or choose an account`}>
    <GripVertical/><Coins/><span><small>{ar?"القيمة":"Value"}</small><b dir="ltr">{token.amount.toLocaleString("en-US")} {token.currency}</b></span>
  </button>;
}
