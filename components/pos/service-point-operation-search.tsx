"use client";

import { useMemo, useState } from "react";
import { posOperationTypes, posProviders } from "@/data/pos";
import { feeRuleKey } from "@/lib/pos/local-intelligence";
import { loadInnovationData } from "@/lib/storage/service-point-innovation";
import type { Locale, PosOperation, PosShift } from "@/types";

type Filter = "all" | "today" | "pending" | "failed" | "reversed" | "large" | "missing" | "fee" | "review";
export function ServicePointOperationSearch({ locale, storeId, operations, shifts }: { locale: Locale; storeId: string; operations: PosOperation[]; shifts: PosShift[] }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(50);
  const rules = useMemo(() => loadInnovationData(storeId).rules, [storeId]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase(), day = new Date().toISOString().slice(0, 10);
    const largeThreshold = [...operations].sort((a,b)=>b.amount-a.amount)[Math.floor(operations.length * .1)]?.amount || 10000;
    const names = new Map(shifts.map((shift) => [shift.id, shift.cashierName]));
    const references = new Map<string, number>();
    for (const item of operations) if (item.reference?.trim()) { const key = item.reference.trim().toLowerCase(); references.set(key, (references.get(key) || 0) + 1); }
    return operations.filter((item) => {
      const feeOverride = item.providerId && rules.normalFees[feeRuleKey(item.providerId, item.type)] !== undefined && item.customerFee !== rules.normalFees[feeRuleKey(item.providerId, item.type)];
      const duplicate = !!item.reference && (references.get(item.reference.trim().toLowerCase()) || 0) > 1;
      const needsReview = !item.reference || feeOverride || duplicate || item.status === "pending" || item.status === "failed";
      const passes = filter === "all" || filter === "today" && item.businessDate === day || filter === "pending" && item.status === "pending" || filter === "failed" && item.status === "failed" || filter === "reversed" && item.status === "reversed" || filter === "large" && item.amount >= largeThreshold || filter === "missing" && !item.reference || filter === "fee" && !!feeOverride || filter === "review" && !!needsReview;
      if (!passes) return false;
      if (!q) return true;
      return [item.id, item.reference, item.amount, item.providerId, item.type, item.status || "successful", item.businessDate, item.shiftId, names.get(item.shiftId)].some((value) => String(value || "").toLowerCase().includes(q));
    }).sort((a, b) => b.at.localeCompare(a.at));
  }, [operations, shifts, query, filter, rules.normalFees]);
  const names = useMemo(() => new Map(shifts.map((shift) => [shift.id, shift.cashierName])), [shifts]);
  const filters: { id: Filter; ar: string; en: string }[] = [{id:"all",ar:"الكل",en:"All"},{id:"today",ar:"اليوم",en:"Today"},{id:"pending",ar:"معلقة",en:"Pending"},{id:"failed",ar:"فاشلة",en:"Failed"},{id:"reversed",ar:"مستردة",en:"Reversed"},{id:"large",ar:"كبيرة",en:"Large"},{id:"missing",ar:"بلا مرجع",en:"Missing reference"},{id:"fee",ar:"عمولة مختلفة",en:"Fee override"},{id:"review",ar:"تحتاج مراجعة",en:"Needs review"}];
  return <section className="card no-print" data-no-bilingual><h2>{ar ? "بحث العمليات والمراجع" : "Operation and reference search"}</h2><p className="muted mt-1 text-sm">{ar ? "بحث محلي داخل عمليات هذا المحل، حتى 5000 سجل. النتائج للعرض والمراجعة." : "Local search within this store, up to 5,000 records."}</p><input className="mt-4" type="search" value={query} onChange={(event)=>{setQuery(event.target.value);setLimit(50);}} placeholder={ar ? "رقم العملية، مرجع، مبلغ، خدمة، كاشير، تاريخ، وردية..." : "ID, reference, amount, provider, cashier, date, shift..."}/><div className="mt-3 flex flex-wrap gap-2">{filters.map((item)=><button className={`btn ${filter===item.id?"btn-primary":""}`} key={item.id} onClick={()=>{setFilter(item.id);setLimit(50);}}>{ar?item.ar:item.en}</button>)}</div><p className="muted mt-3 text-sm">{results.length} {ar ? "نتيجة" : "results"}</p><div className="table-wrap mt-3"><table><thead><tr>{(ar?["التاريخ","العملية","الخدمة","المبلغ","المرجع","الكاشير","الحالة"]:["Date","Operation","Provider","Amount","Reference","Cashier","Status"]).map((label)=><th key={label}>{label}</th>)}</tr></thead><tbody>{results.slice(0,limit).map((item)=><tr key={item.id}><td>{new Date(item.at).toLocaleString(ar?"ar-EG":"en")}</td><td>{ar?posOperationTypes.find((type)=>type.id===item.type)?.nameAr:posOperationTypes.find((type)=>type.id===item.type)?.nameEn}<small className="block">{item.id.slice(0,8)}</small></td><td>{ar?posProviders.find((provider)=>provider.id===item.providerId)?.nameAr:posProviders.find((provider)=>provider.id===item.providerId)?.nameEn}</td><td>{item.amount.toLocaleString()}</td><td>{item.reference||"—"}{item.reference&&<button className="ms-2 text-blue-700 underline" onClick={()=>navigator.clipboard?.writeText(item.reference||"")}>{ar?"نسخ":"Copy"}</button>}</td><td>{names.get(item.shiftId)||"—"}</td><td>{item.status||"successful"}</td></tr>)}</tbody></table></div>{results.length>limit&&<button className="btn mt-4" onClick={()=>setLimit((value)=>value+50)}>{ar?"عرض المزيد":"Show more"}</button>}</section>;
}
