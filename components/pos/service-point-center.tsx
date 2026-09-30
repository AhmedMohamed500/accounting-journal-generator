"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, BarChart3, CheckCircle2, Clock3, ImageUp, Info, Landmark, LockKeyhole, PlusCircle, Printer, ReceiptText, RotateCcw, ShieldCheck, Store, WalletCards, X } from "lucide-react";
import { posOperationTypes, posProviders } from "@/data/pos";
import { ServicePointIntelligence } from "@/components/pos/service-point-intelligence";
import { ServicePointInnovation } from "@/components/pos/service-point-innovation";
import { ServicePointOperationSearch } from "@/components/pos/service-point-operation-search";
import { MerchantAccountingCenter } from "@/components/pos/merchant-accounting-center";
import { ServicePointControl } from "@/components/pos/service-point-control";
import { ServicePointDashboardOverview } from "@/components/pos/service-point-dashboard-overview";
import { calculatePosOperation, calculatePosShiftSnapshot, createPosJournalEntry, createPosReversal, createPosReversalJournalEntry, createPosVarianceEntry, isDuplicatePosOperation } from "@/lib/pos/engine";
import { createPosStore, loadActivePosStoreId, loadPosEntries, loadPosOperations, loadPosShifts, loadPosStores, migrateLegacyPosData, openPosShift, savePosEntry, savePosOperation, savePosOperations, setActivePosStoreId, updatePosShift, updatePosStore } from "@/lib/storage/pos";
import { appendLocalAudit, currentLocalUser } from "@/lib/storage/service-point-demo";
import { canLocalRole } from "@/lib/pos/demo";
import { countCash, DEFAULT_DENOMINATIONS, previewOperationRisk } from "@/lib/pos/local-intelligence";
import { emptyInnovationData, loadInnovationData, saveInnovationData, type InnovationStoreData, type ShiftHandover } from "@/lib/storage/service-point-innovation";

import type { GeneratedJournalEntry, Locale, PosOperation, PosOperationStatus, PosOperationType, PosProviderId, PosShift, PosStore } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => `${value.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
const emptyBalances = () => Object.fromEntries(posProviders.map((provider) => [provider.id, "0"])) as Record<PosProviderId, string>;

type ServicePointView = "overview" | "operations" | "services" | "shifts" | "reports" | "search" | "store" | "merchants" | "team" | "help";

const servicePointViewByHash: Record<string, ServicePointView> = {
  "": "overview",
  "#pos-app-root": "overview",
  "#new-operation": "operations",
  "#service-point-intelligence": "services",
  "#shift-actions": "shifts",
  "#service-point-reports": "reports",
  "#operation-search": "search",
  "#store-accounts": "store",
  "#merchant-accounting": "merchants",
  "#service-point-control": "team",
  "#service-point-help": "help",
};

const servicePointHashByView: Record<ServicePointView, string> = Object.fromEntries(
  Object.entries(servicePointViewByHash).filter(([hash]) => hash).map(([hash, view]) => [view, hash]),
) as Record<ServicePointView, string>;

export function ServicePointCenter({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const localUser=currentLocalUser();
  const allowed=(permission:Parameters<typeof canLocalRole>[1])=>!localUser||canLocalRole(localUser.role,permission);
  const [stores, setStores] = useState<PosStore[]>([]), [activeStoreId, setActiveStore] = useState(""), [newStoreName, setNewStoreName] = useState("");
  const [shifts, setShifts] = useState<PosShift[]>([]), [operations, setOperations] = useState<PosOperation[]>([]), [entries, setEntries] = useState<GeneratedJournalEntry[]>([]), [message, setMessage] = useState("");
  const [cashierName, setCashierName] = useState(""), [openingCash, setOpeningCash] = useState(""), [openingProviders, setOpeningProviders] = useState(emptyBalances);
  const [operationType, setOperationType] = useState<PosOperationType>("send-transfer"), [operationStatus, setOperationStatus] = useState<Exclude<PosOperationStatus,"reversed">>("successful"), [providerId, setProviderId] = useState<PosProviderId>("vodafone-cash"), [destinationProviderId, setDestinationProviderId] = useState<PosProviderId>("orange-cash"), [amount, setAmount] = useState(""), [customerFee, setCustomerFee] = useState(""), [providerCost, setProviderCost] = useState(""), [reference, setReference] = useState("");
  const [actualCash, setActualCash] = useState(""), [actualProviders, setActualProviders] = useState(emptyBalances), [period, setPeriod] = useState<"day" | "week" | "month">("day"), [reportProvider, setReportProvider] = useState<"all" | PosProviderId>("all");
  const [receiptOperation,setReceiptOperation]=useState<PosOperation>();
  const [innovation, setInnovation] = useState<InnovationStoreData>(emptyInnovationData);
  const [cashQuantities, setCashQuantities] = useState<Record<number, number>>({});
  const [handoverNotes, setHandoverNotes] = useState("");
  const [receivingCashier, setReceivingCashier] = useState("");
  const [acceptanceNote, setAcceptanceNote] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [workspaceView, setWorkspaceView] = useState<ServicePointView>("overview");

  const refresh = (storeId: string) => { setShifts(loadPosShifts(storeId)); setOperations(loadPosOperations(storeId)); setEntries(loadPosEntries(storeId)); setInnovation(loadInnovationData(storeId)); };
  const saveInnovation = (next: InnovationStoreData) => { saveInnovationData(activeStoreId, next); setInnovation(next); };
  useEffect(() => {
    const migrated = migrateLegacyPosData();
    let loaded = migrated.length ? migrated : loadPosStores();
    if (!loaded.length) loaded = [createPosStore(locale === "ar" ? "المحل الرئيسي" : "Main store")];
    const selected = loadActivePosStoreId() || loaded[0].id;
    setStores(loaded);
    setActiveStore(selected);
    refresh(selected);
  }, [locale]);
  useEffect(() => {
    const syncView = () => setWorkspaceView(servicePointViewByHash[window.location.hash] || "overview");
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);
  useEffect(() => {
    if (workspaceView === "overview") return;
    const frame = window.requestAnimationFrame(() => document.getElementById("pos-app-root")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [workspaceView]);
  const navigateWorkspace = (view: ServicePointView) => {
    setWorkspaceView(view);
    const hash = servicePointHashByView[view] || "#pos-app-root";
    if (window.location.hash !== hash) window.location.hash = hash;
  };
  const activeStore = stores.find((store) => store.id === activeStoreId);
  const activeShift = shifts.find((shift) => shift.status === "open");
  const snapshot = activeShift ? calculatePosShiftSnapshot(activeShift, operations) : undefined;
  const selectedType = posOperationTypes.find((item) => item.id === operationType)!;
  const operationPreview = (() => {
    if (!activeShift || !amount || Number(amount) <= 0) return undefined;
    try { return calculatePosOperation({ shiftId: activeShift.id, businessDate: activeShift.businessDate, type: operationType, providerId: selectedType.needsProvider ? providerId : undefined, destinationProviderId: operationType === "internal-provider-transfer" ? destinationProviderId : undefined, amount: Number(amount), customerFee: operationType === "internal-provider-transfer" ? 0 : Number(customerFee) || 0, providerCost: operationType === "internal-provider-transfer" ? 0 : Number(providerCost) || 0, reference: reference.trim() || undefined }); }
    catch { return undefined; }
  })();
  const riskPreview = operationPreview && snapshot ? previewOperationRisk({ operation: operationPreview, snapshot, operations, rules: innovation.rules }) : undefined;

  const openShift = () => {
    if(!allowed("manage-shifts")){setMessage(ar?"المستخدم الحالي لا يملك صلاحية فتح الوردية.":"Current user cannot open shifts.");return;}
    if (innovation.handovers[0] && !innovation.handovers[0].acceptedAt) { setMessage(ar ? "راجع تسليم الوردية السابقة وسجل الاستلام أولًا." : "Review and accept the previous handover first."); return; }
    if (!activeStore || !cashierName.trim()) { setMessage(ar ? "أنشئ محلًا واختره ثم اكتب اسم الكاشير." : "Create and select a store, then enter the cashier name."); return; }
    const shift: PosShift = { id: crypto.randomUUID(), storeName: activeStore.name, cashierName: cashierName.trim(), businessDate: today(), openedAt: new Date().toISOString(), status: "open", openingCash: Number(openingCash) || 0, providers: posProviders.map((provider) => ({ providerId: provider.id, openingBalance: Number(openingProviders[provider.id]) || 0 })) };
    try { openPosShift(activeStoreId, shift); appendLocalAudit("open-shift","shift",`${activeStore.name} — ${cashierName.trim()}`); setMessage(ar ? "تم فتح الوردية وحفظ أرصدة البداية." : "Shift opened with opening balances."); refresh(activeStoreId); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not open shift"); }
  };

  const recordOperation = () => {
    if(!allowed("create-operation")){setMessage(ar?"المستخدم الحالي لا يملك صلاحية تسجيل العمليات.":"Current user cannot create operations.");return;}
    if (!activeShift || !snapshot) return;
    try {
      const internalTransfer = operationType === "internal-provider-transfer";
      const calculated = calculatePosOperation({ shiftId: activeShift.id, businessDate: activeShift.businessDate, type: operationType, providerId: selectedType.needsProvider ? providerId : undefined, destinationProviderId: internalTransfer ? destinationProviderId : undefined, amount: Number(amount), customerFee: internalTransfer ? 0 : Number(customerFee) || 0, providerCost: internalTransfer ? 0 : Number(providerCost) || 0, reference: reference.trim() || undefined });
      const nextCash = snapshot.expectedCash + calculated.cashChange;
      const nextProvider = calculated.providerId ? snapshot.expectedProviders[calculated.providerId] + calculated.providerBalanceChange : 0;
      if (nextCash < 0) throw new Error("رصيد الخزنة لا يكفي لتنفيذ العملية");
      if (calculated.providerId && nextProvider < 0) throw new Error(`رصيد ${posProviders.find((item) => item.id === calculated.providerId)?.nameAr} لا يكفي لتنفيذ العملية`);
      const prepared:PosOperation={...calculated,status:operationStatus};
      if (isDuplicatePosOperation(operations,prepared)) throw new Error(ar?"تنبيه: توجد معاملة مطابقة بالقيمة والمسار والمرجع خلال وقت قصير. راجعها قبل إعادة التسجيل.":"A matching recent transaction already exists. Review it before recording again.");
      if (operationStatus === "successful") { const entry = savePosEntry(activeStoreId, createPosJournalEntry(prepared)); savePosOperation(activeStoreId, { ...prepared, entryId: entry.id }); }
      else savePosOperation(activeStoreId, prepared);
      appendLocalAudit("create-transaction","operation",`${operationType} — ${calculated.amount} — ${calculated.reference||calculated.id}`);refresh(activeStoreId);
      setAmount(""); setCustomerFee(""); setProviderCost(""); setReference("");
      setMessage(operationStatus === "successful" ? (internalTransfer ? (ar ? `تم نقل ${money(calculated.amount)} بين الرصيدين دون تغيير الخزنة أو صافي الربح.` : `Transferred ${money(calculated.amount)} between balances with no cash or profit impact.`) : (ar ? `تم تسجيل العملية وترحيل القيد. صافي الربح ${money(calculated.profit)}.` : `Operation posted. Net profit ${money(calculated.profit)}.`)) : (ar?`تم حفظ العملية بحالة ${operationStatus==="pending"?"معلقة":"فاشلة"} دون تحريك الأرصدة أو إنشاء قيد.`:`Operation saved as ${operationStatus} without balance movement or posting.`));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not record operation"); }
  };

  const changePendingStatus=(operation:PosOperation,status:"successful"|"failed")=>{
    if(!allowed("create-operation")){setMessage(ar?"لا توجد صلاحية لاعتماد العملية.":"Permission required.");return;}
    if(operation.status!=="pending")return;
    if(status==="successful"){
      const entry=savePosEntry(activeStoreId,createPosJournalEntry({...operation,status}));
      savePosOperations(activeStoreId,operations.map((item)=>item.id===operation.id?{...item,status,entryId:entry.id}:item));
    }else savePosOperations(activeStoreId,operations.map((item)=>item.id===operation.id?{...item,status}:item));
    appendLocalAudit("approve-pending","operation",`${operation.id} → ${status}`);refresh(activeStoreId);setMessage(ar?(status==="successful"?"تم اعتماد العملية المعلقة وترحيل قيدها.":"تم تعليم العملية كفاشلة دون التأثير على الأرصدة."):`Operation marked ${status}.`);
  };
  const reverseOperation=(operation:PosOperation)=>{
    if(!allowed("reverse-operation")){setMessage(ar?"المستخدم الحالي لا يملك صلاحية الاسترداد.":"Current user cannot reverse operations.");return;}
    if((operation.status||"successful")!=="successful"||operation.reversalOfOperationId)return;
    const originalEntry=entries.find((entry)=>entry.id===operation.entryId);if(!originalEntry)return setMessage(ar?"تعذر العثور على القيد الأصلي؛ لم يتم الاسترداد.":"Original entry not found; reversal was not created.");
    const reversal=createPosReversal(operation),reversalEntry=createPosReversalJournalEntry(originalEntry,reversal),savedEntry=savePosEntry(activeStoreId,reversalEntry),savedReversal={...reversal,entryId:savedEntry.id};
    savePosOperations(activeStoreId,[savedReversal,...operations.map((item)=>item.id===operation.id?{...item,status:"reversed" as const,reversedByOperationId:savedReversal.id}:item)]);appendLocalAudit("reverse-transaction","operation",`${operation.id} → ${savedReversal.id}`);refresh(activeStoreId);setMessage(ar?"تم إنشاء حركة وقيد عكسيين، ولم تُحذف العملية الأصلية.":"A reversing operation and entry were created; the original was retained.");
  };
  const printReceipt=(operation:PosOperation)=>setReceiptOperation(operation);
  const saveLogo=(file?:File)=>{if(!file||!activeStore)return;if(!file.type.startsWith("image/")||file.size>1_500_000)return setMessage(ar?"اختر صورة شعار بحجم أقل من 1.5 ميجابايت.":"Choose a logo image smaller than 1.5 MB.");const reader=new FileReader();reader.onload=()=>{updatePosStore(activeStore.id,{logoDataUrl:String(reader.result)});setStores(loadPosStores());setMessage(ar?"تم حفظ شعار المحل وسيظهر في التقارير والإيصالات.":"Store logo saved for reports and receipts.");};reader.readAsDataURL(file);};

  const prepareClosing = () => {
    if (!snapshot) return;
    setActualCash(String(snapshot.expectedCash));
    setActualProviders(Object.fromEntries(posProviders.map((provider) => [provider.id, String(snapshot.expectedProviders[provider.id])])) as Record<PosProviderId, string>);
    setMessage(ar ? "تم وضع الأرصدة المتوقعة. عدّلها حسب العد الفعلي ثم اقفل الوردية." : "Expected balances filled. Replace with actual counts, then close.");
  };
  const closingSnapshot = activeShift && actualCash !== "" ? calculatePosShiftSnapshot(activeShift, operations, Number(actualCash), Object.fromEntries(posProviders.map((provider) => [provider.id, Number(actualProviders[provider.id])])) as Record<PosProviderId, number>) : undefined;

  const closeShift = () => {
    if(!allowed("manage-shifts")){setMessage(ar?"المستخدم الحالي لا يملك صلاحية إقفال الوردية.":"Current user cannot close shifts.");return;}
    if (!activeShift || !closingSnapshot) { setMessage(ar ? "اضغط تجهيز الإقفال وأدخل الأرصدة الفعلية." : "Prepare closing and enter actual balances."); return; }
    try {
      const shiftOperations = operations.filter((item) => item.shiftId === activeShift.id);
      const handover: ShiftHandover = { shiftId: activeShift.id, createdAt: new Date().toISOString(), cashierName: activeShift.cashierName, receivingCashier: receivingCashier.trim() || undefined, expectedCash: closingSnapshot.expectedCash, actualCash: Number(actualCash), cashVariance: closingSnapshot.cashVariance || 0, providers: posProviders.map((provider) => ({ id: provider.id, expected: closingSnapshot.expectedProviders[provider.id], actual: Number(actualProviders[provider.id]), variance: closingSnapshot.providerVariances?.[provider.id] || 0 })), pending: shiftOperations.filter((item) => item.status === "pending").length, failed: shiftOperations.filter((item) => item.status === "failed").length, reversed: shiftOperations.filter((item) => item.status === "reversed").length, expenses: shiftOperations.filter((item) => item.type === "store-expense" && item.status !== "failed" && item.status !== "pending").reduce((sum, item) => sum + item.amount, 0), notes: handoverNotes.trim() };
      const varianceEntry = createPosVarianceEntry(activeShift, closingSnapshot); if (varianceEntry) savePosEntry(activeStoreId, varianceEntry);
      updatePosShift(activeStoreId, { ...activeShift, status: "closed", closedAt: new Date().toISOString(), actualClosingCash: Number(actualCash), providers: activeShift.providers.map((item) => ({ ...item, actualClosingBalance: Number(actualProviders[item.providerId]) })) });
      saveInnovationData(activeStoreId, { ...innovation, handovers: [handover, ...innovation.handovers.filter((item) => item.shiftId !== handover.shiftId)] });
      appendLocalAudit("close-shift","shift",`${activeShift.id} — variance ${closingSnapshot.totalVariance||0}`);setMessage(ar ? `تم إقفال الوردية. إجمالي فرق الجرد ${money(closingSnapshot.totalVariance || 0)}.` : `Shift closed. Total variance ${money(closingSnapshot.totalVariance || 0)}.`); setActualCash(""); refresh(activeStoreId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not close shift"); }
  };
  const previousHandover = innovation.handovers[0];
  const acceptHandover = () => {
    if (!previousHandover || previousHandover.acceptedAt || !cashierName.trim()) return;
    if (!allowed("manage-shifts")) return setMessage(ar ? "لا توجد صلاحية لاستلام الوردية." : "Shift permission required.");
    const updated = { ...previousHandover, acceptedAt: new Date().toISOString(), acceptedBy: cashierName.trim(), acceptanceNote: acceptanceNote.trim() || undefined };
    saveInnovation({ ...innovation, handovers: [updated, ...innovation.handovers.slice(1)] });
    appendLocalAudit("accept-handover", "shift", `${updated.shiftId} → ${updated.acceptedBy}`);
    setMessage(ar ? "تم تسجيل استلام الوردية محليًا." : "Handover acceptance saved locally.");
  };

  const reportOperations = useMemo(() => operations.filter((operation) => {
    const date = new Date(`${operation.businessDate}T00:00:00`), current = new Date(`${today()}T00:00:00`);
    const inPeriod = period === "day" ? operation.businessDate === today() : period === "month" ? date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth() : date >= new Date(current.getFullYear(), current.getMonth(), current.getDate() - 6) && date <= current;
    const inProvider = reportProvider === "all" || operation.providerId === reportProvider || operation.destinationProviderId === reportProvider;
    return inPeriod && inProvider;
  }), [operations, period, reportProvider]);
  const effectiveReportOperations=reportOperations.filter((item)=>(item.status||"successful")==="successful"&&!item.reversalOfOperationId);
  const report = { volume: effectiveReportOperations.reduce((sum, item) => sum + item.amount, 0), revenue: effectiveReportOperations.reduce((sum, item) => sum + item.revenue, 0), expense: effectiveReportOperations.reduce((sum, item) => sum + item.expense, 0), profit: reportOperations.reduce((sum, item) => sum + (item.status==="pending"||item.status==="failed"?0:item.profit), 0) };

  const chooseStore = (storeId: string) => { setActivePosStoreId(storeId); setActiveStore(storeId); refresh(storeId); setMessage(""); };
  const addStore = () => { if (!newStoreName.trim()) return setMessage(ar ? "اكتب اسم المحل الجديد." : "Enter the new store name."); const store = createPosStore(newStoreName); setStores(loadPosStores()); setActiveStore(store.id); refresh(store.id); setNewStoreName(""); setMessage(ar ? "تم إنشاء حسابات مستقلة للمحل الجديد." : "Independent store accounts created."); };
  const storeBar = <StoreAccountsBar locale={locale} stores={stores} activeStoreId={activeStoreId} activeStore={activeStore} newStoreName={newStoreName} setNewStoreName={setNewStoreName} onSelect={chooseStore} onCreate={addStore} onLogo={saveLogo}/>;

  if (!activeStore) return <div id="pos-app-root" className="grid gap-6">{storeBar}{message && <p className="warning">{message}</p>}</div>;

  if (!activeShift) return <div id="pos-app-root" className="grid gap-6">
    {storeBar}
    {previousHandover && <section className="card" data-no-bilingual><div className="flex flex-wrap items-center justify-between gap-3"><h2>{ar ? "تسليم الوردية السابقة" : "Previous shift handover"}</h2><button className="btn" onClick={() => window.print()}><Printer size={16}/>{ar ? "طباعة" : "Print"}</button></div><p className="muted mt-2">{previousHandover.cashierName} · {new Date(previousHandover.createdAt).toLocaleString(ar ? "ar-EG" : "en")}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><ReportTotal label={ar ? "الخزنة المتوقعة" : "Expected cash"} value={money(previousHandover.expectedCash)}/><ReportTotal label={ar ? "العد الفعلي" : "Actual cash"} value={money(previousHandover.actualCash)}/><ReportTotal label={ar ? "الفرق" : "Variance"} value={money(previousHandover.cashVariance)}/></div><div className="mt-4 grid gap-2 md:grid-cols-2">{previousHandover.providers.map((item) => <p key={item.id} className="rounded-xl border border-daftar-line p-2 text-sm">{providerName(item.id, ar)}: {money(item.actual)} ({ar ? "فرق" : "variance"} {money(item.variance)})</p>)}</div><p className="mt-3 text-sm">{ar ? "معلقة / فاشلة / مستردة" : "Pending / failed / reversed"}: {previousHandover.pending} / {previousHandover.failed} / {previousHandover.reversed} · {ar ? "مصروفات" : "Expenses"}: {money(previousHandover.expenses)}</p><p className="mt-2 text-sm">{previousHandover.notes || (ar ? "لا توجد ملاحظات" : "No notes")}</p>{previousHandover.acceptedAt ? <p className="mt-3 text-emerald-700">{ar ? "استلمها" : "Accepted by"} {previousHandover.acceptedBy} · {previousHandover.acceptanceNote}</p> : <div className="mt-4 flex flex-wrap items-end gap-3"><label>{ar ? "ملاحظة الاستلام (اختياري)" : "Acceptance note (optional)"}<input value={acceptanceNote} onChange={(event) => setAcceptanceNote(event.target.value)}/></label><button className="btn btn-primary" disabled={!cashierName.trim()} onClick={acceptHandover}>{ar ? acceptanceNote.trim() ? "استلام مع ملاحظة" : "استلام الوردية" : acceptanceNote.trim() ? "Accept with note" : "Accept handover"}</button></div>}</section>}
    <section className="card overflow-hidden"><div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div><span className="badge"><Store size={15}/>{ar ? "فتح وردية جديدة" : "Open a new shift"}</span><h2 className="mt-4">{ar ? "ابدأ بالأرصدة الموجودة فعلًا" : "Start with actual opening balances"}</h2><p className="muted">{ar ? "اكتب نقدية الخزنة ورصيد كل ماكينة أو محفظة. من هنا سيحسب النظام المتوقع والعجز والربح." : "Enter physical cash and every provider balance."}</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-blue-50 p-4 text-daftar-primary"><small>{ar ? "المحل المختار" : "Selected store"}</small><b className="mt-1 block">{activeStore.name}</b></div><label>{ar ? "اسم الكاشير" : "Cashier"}<input value={cashierName} onChange={(event) => setCashierName(event.target.value)}/></label><label>{ar ? "رصيد الخزنة أول الوردية" : "Opening cash"}<input type="number" min="0" value={openingCash} onChange={(event) => setOpeningCash(event.target.value)}/></label></div></div><div className="rounded-3xl bg-daftar-bg p-5"><b>{ar ? "أرصدة الخدمات أول الوردية" : "Opening provider balances"}</b><div className="mt-4 grid gap-3 md:grid-cols-2">{posProviders.map((provider) => <label key={provider.id}><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{background:provider.color}}/>{ar ? provider.nameAr : provider.nameEn}</span><input type="number" min="0" value={openingProviders[provider.id]} onChange={(event) => setOpeningProviders((current) => ({ ...current, [provider.id]: event.target.value }))}/></label>)}</div></div></div><button className="btn btn-primary mt-6" onClick={openShift}><Clock3 size={18}/>{ar ? "فتح الوردية وبدء العمل" : "Open shift"}</button>{message && <p className="warning mt-4">{message}</p>}</section>
  </div>;

  return <div id="pos-app-root" className="grid gap-6">
    {workspaceView === "overview" && <ServicePointDashboardOverview locale={locale} storeName={activeStore.name} cashierName={activeShift.cashierName} businessDate={activeShift.businessDate} expectedCash={snapshot!.expectedCash} expectedProviders={snapshot!.expectedProviders} revenue={snapshot!.revenue} expenses={snapshot!.expenses} profit={snapshot!.profit} operationCount={snapshot!.operationCount} operations={operations} shifts={shifts} onProviderSelect={(nextProvider)=>{setProviderId(nextProvider);navigateWorkspace("operations");}} onNavigate={navigateWorkspace}/>}
    {workspaceView !== "overview" && <WorkspaceHeader locale={locale} view={workspaceView} onBack={()=>navigateWorkspace("overview")} onNewOperation={()=>navigateWorkspace("operations")}/>}
    {workspaceView === "store" && <div id="store-accounts">{storeBar}</div>}
    {workspaceView === "merchants" && <div id="merchant-accounting"><MerchantAccountingCenter locale={locale} storeId={activeStore.id} storeName={activeStore.name}/></div>}
    {workspaceView === "services" && <><ServicePointIntelligence locale={locale} snapshot={snapshot!} operations={operations.filter((item)=>item.shiftId===activeShift.id)}/><ServicePointInnovation locale={locale} storeId={activeStore.id} operations={operations} shifts={shifts} snapshot={snapshot!} onDataChange={setInnovation}/></>}
    {workspaceView === "team" && <div id="service-point-control"><ServicePointControl locale={locale} shifts={shifts} operations={operations}/></div>}
    {workspaceView === "operations" && <section className="card sp-quick-operations" data-no-bilingual><h2>{ar ? "عمليات سريعة" : "Quick operations"}</h2><p className="muted mt-1 text-sm">{ar ? "اختر قالبًا أو عملية حديثة، ثم أدخل القيمة والمرجع وراجع المعاينة قبل الحفظ." : "Choose a template or recent operation, then enter amount and reference and review before posting."}</p><div className="mt-4 flex flex-wrap gap-2">{[...innovation.templates].sort((a,b)=>Number(b.favorite)-Number(a.favorite)).map((template)=><div key={template.id} className="flex items-center rounded-xl border border-daftar-line"><button className="px-3 py-2 text-sm" onClick={()=>{setOperationType(template.type);if(template.providerId)setProviderId(template.providerId);setCustomerFee(String(template.customerFee));setProviderCost(String(template.providerCost));document.getElementById("new-operation")?.scrollIntoView({behavior:"smooth"});}}>{template.favorite?"★ ":""}{template.name}</button><button className="px-2 text-sm" aria-label={ar?"تبديل المفضلة":"Toggle favorite"} onClick={()=>saveInnovation({...innovation,templates:innovation.templates.map((item)=>item.id===template.id?{...item,favorite:!item.favorite}:item)})}>☆</button></div>)}</div><div className="mt-3 flex flex-wrap items-end gap-2"><label>{ar ? "اسم القالب" : "Template name"}<input value={templateName} onChange={(event)=>setTemplateName(event.target.value)}/></label><button className="btn" disabled={!templateName.trim()} onClick={()=>{saveInnovation({...innovation,templates:[...innovation.templates,{id:crypto.randomUUID(),name:templateName.trim(),type:operationType,providerId:selectedType.needsProvider?providerId:undefined,customerFee:Number(customerFee)||0,providerCost:Number(providerCost)||0,favorite:false}]});setTemplateName("");}}>{ar ? "حفظ من الإعدادات الحالية" : "Save current settings"}</button></div><div className="mt-4 border-t border-daftar-line pt-3"><b>{ar ? "آخر عمليات ناجحة" : "Recent successful operations"}</b><div className="mt-2 flex flex-wrap gap-2">{operations.filter((item)=>(item.status||"successful")==="successful"&&!item.reversalOfOperationId&&item.type!=="store-expense").slice(0,5).map((item)=><button className="btn" key={item.id} onClick={()=>{setOperationType(item.type);if(item.providerId)setProviderId(item.providerId);setCustomerFee(String(item.customerFee));setProviderCost(String(item.providerCost));setAmount(String(item.amount));setReference("");document.getElementById("new-operation")?.scrollIntoView({behavior:"smooth"});}}>{providerName(item.providerId,ar)} · {money(item.amount)}</button>)}</div></div></section>}

    {workspaceView === "operations" && <section className="card sp-operation-composer" id="new-operation">
      <div className="sp-form-heading flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-daftar-primary dark:bg-blue-950/40"><PlusCircle size={22}/></span>
        <div>
          <h2>{ar ? "تسجيل عملية جديدة" : "Record a new operation"}</h2>
          <p className="muted mt-1">{ar ? selectedType.helpAr : selectedType.nameEn}</p>
        </div>
      </div>

      <div data-no-bilingual className="sp-operation-form-grid mt-6 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "نوع العملية" : "Transaction type"}</b></span>
          <select value={operationType} onChange={(event) => setOperationType(event.target.value as PosOperationType)}>{posOperationTypes.map((type)=><option value={type.id} key={type.id}>{ar?type.nameAr:type.nameEn}</option>)}</select>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "حالة المعاملة" : "Transaction status"}</b></span>
          <select value={operationStatus} onChange={(event)=>setOperationStatus(event.target.value as Exclude<PosOperationStatus,"reversed">)}><option value="successful">{ar?"ناجحة — ترحيل فوري":"Successful — post now"}</option><option value="pending">{ar?"معلقة — بدون ترحيل":"Pending — do not post"}</option><option value="failed">{ar?"فاشلة — بدون تأثير":"Failed — no impact"}</option></select>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? (operationType === "internal-provider-transfer" ? "من رصيد" : "الخدمة أو المحفظة") : (operationType === "internal-provider-transfer" ? "From balance" : "Provider or wallet")}</b></span>
          <select disabled={!selectedType.needsProvider} value={providerId} onChange={(event)=>{const next=event.target.value as PosProviderId;setProviderId(next);if(destinationProviderId===next)setDestinationProviderId(posProviders.find((item)=>item.id!==next)!.id);}}>{posProviders.map((provider)=><option value={provider.id} key={provider.id}>{ar?provider.nameAr:provider.nameEn} — {money(snapshot!.expectedProviders[provider.id])}</option>)}</select>
        </label>
        {operationType === "internal-provider-transfer" && <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "إلى رصيد" : "To balance"}</b></span>
          <select value={destinationProviderId} onChange={(event)=>setDestinationProviderId(event.target.value as PosProviderId)}>{posProviders.map((provider)=><option disabled={provider.id===providerId} value={provider.id} key={provider.id}>{ar?provider.nameAr:provider.nameEn} — {money(snapshot!.expectedProviders[provider.id])}</option>)}</select>
        </label>}
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "قيمة العملية" : "Amount"}</b></span>
          <input type="number" min="0" value={amount} onChange={(event)=>setAmount(event.target.value)}/>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "عمولة العميل" : "Customer fee"}</b></span>
          <input disabled={operationType === "internal-provider-transfer"} type="number" min="0" value={operationType === "internal-provider-transfer" ? "0" : customerFee} onChange={(event)=>setCustomerFee(event.target.value)}/>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "تكلفة مقدم الخدمة" : "Provider cost"}</b></span>
          <input disabled={operationType === "internal-provider-transfer"} type="number" min="0" value={operationType === "internal-provider-transfer" ? "0" : providerCost} onChange={(event)=>setProviderCost(event.target.value)}/>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "المرجع أو رقم الهاتف" : "Reference or phone"}</b></span>
          <input value={reference} onChange={(event)=>setReference(event.target.value)}/>
        </label>
        <div className="sp-operation-submit min-w-0">
          <span className="mb-2 block min-h-11"><b className="block text-sm leading-5">{ar ? "اعتماد العملية" : "Post transaction"}</b></span>
          <button disabled={!allowed("create-operation")} className="btn btn-primary h-[56px] w-full whitespace-nowrap px-5 text-base" onClick={recordOperation}><ReceiptText size={19}/><span>{ar ? "تسجيل وترحيل" : "Record and post"}</span></button>
        </div>
      </div>
      {operationPreview&&<div className="mt-5 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 md:grid-cols-4" data-no-bilingual><ReportTotal label={ar?"تأثير الخزنة":"Cash impact"} value={money(operationPreview.cashChange)}/><ReportTotal label={ar?"تأثير رصيد الخدمة":"Provider impact"} value={money(operationPreview.providerBalanceChange)}/><ReportTotal label={ar?"إيراد العمولة":"Fee revenue"} value={money(operationPreview.revenue)}/><ReportTotal label={ar?"صافي الربح المتوقع":"Expected profit"} value={money(operationPreview.profit)}/><p className="md:col-span-4 text-sm text-blue-900">{ar?"هذه معاينة قبل الحفظ. لن تتحرك الأرصدة ولن يُنشأ القيد إلا بعد الضغط على «تسجيل وترحيل».":"Preview only. Balances and entries change only after posting."}</p></div>}
      {message && <p className="warning mt-4">{message}</p>}
    </section>}
    {workspaceView === "services" && <section className="card"><h2>{ar ? "أرصدة المحافظ والماكينات الآن" : "Live provider balances"}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{posProviders.map((provider)=><article className="rounded-2xl border border-daftar-line p-4" key={provider.id}><div className="flex items-center justify-between"><ProviderBrand providerId={provider.id} locale={locale}/><strong>{money(snapshot!.expectedProviders[provider.id])}</strong></div></article>)}</div></section>}

    {workspaceView === "operations" && riskPreview && <section className="card" data-no-bilingual><h2>{ar ? "فحص العملية قبل الحفظ" : "Operation risk check"}</h2><p className="mt-2 text-sm">{ar ? "الخزنة بعد العملية" : "Cash after operation"}: {money(riskPreview.nextCash)}{riskPreview.nextProvider !== undefined && <> · {ar ? "رصيد الخدمة بعد العملية" : "Provider after operation"}: {money(riskPreview.nextProvider)}</>}</p>{riskPreview.blocking.map((item)=><p className="mt-2 text-sm text-red-800" key={item}>{item === "insufficient-cash" ? ar ? "مانع: الخزنة غير كافية." : "Blocked: insufficient cash." : ar ? "مانع: رصيد الخدمة غير كافٍ." : "Blocked: insufficient provider balance."}</p>)}{riskPreview.warnings.map((item)=><p className="mt-2 text-sm text-amber-900" key={item}>{ar ? ({"low-cash":"الخزنة ستقل عن الحد المحدد.","low-provider":"رصيد الخدمة سيقل عن الحد المحدد.","missing-reference":"لا يوجد مرجع لهذه العملية.","duplicate-reference":"المرجع استُخدم في عملية سابقة.","low-fee":"العمولة أقل من القاعدة المحددة.","negative-margin":"هامش العملية سالب."} as Record<string,string>)[item] : ({"low-cash":"Cash will fall below minimum.","low-provider":"Provider balance will fall below minimum.","missing-reference":"Reference is missing.","duplicate-reference":"Reference was used before.","low-fee":"Fee is below configured rule.","negative-margin":"Operation margin is negative."} as Record<string,string>)[item]}</p>)}</section>}
    {workspaceView === "operations" && <OperationsTable locale={locale} operations={operations.filter((item)=>item.shiftId===activeShift.id)} onPrint={printReceipt} onReverse={reverseOperation} onPendingStatus={changePendingStatus}/>}
    {workspaceView === "search" && <ServicePointOperationSearch locale={locale} storeId={activeStore.id} operations={operations} shifts={shifts}/>}
    {workspaceView === "reports" && <div id="service-point-reports"><Reports locale={locale} period={period} setPeriod={setPeriod} provider={reportProvider} setProvider={setReportProvider} report={report} operations={effectiveReportOperations}/></div>}

    {workspaceView === "shifts" && <div id="shift-actions" className="grid gap-6"><section className="card" data-no-bilingual><h2>{ar ? "عد الخزنة بالفئات" : "Cash denomination counter"}</h2><p className="muted mt-1 text-sm">{ar ? "ادخل عدد الأوراق أو العملات. يمكنك نقل الإجمالي للعد الفعلي عند الإقفال." : "Enter quantities, then transfer the total to the actual closing count."}</p><div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">{DEFAULT_DENOMINATIONS.map((value)=><label key={value}>{value} {ar ? "ج.م" : "EGP"}<input type="number" min="0" step="1" value={cashQuantities[value] ?? ""} onChange={(event)=>setCashQuantities((current)=>({...current,[value]:Math.max(0,Math.floor(Number(event.target.value)||0))}))}/></label>)}</div><div className="mt-4 flex flex-wrap items-center gap-4"><b>{ar ? "إجمالي العد" : "Counted cash"}: {money(countCash(cashQuantities))}</b><span className={countCash(cashQuantities)-snapshot!.expectedCash < 0 ? "text-red-700" : "text-emerald-700"}>{ar ? "الفرق عن المتوقع" : "Variance vs expected"}: {money(countCash(cashQuantities)-snapshot!.expectedCash)}</span><button className="btn" onClick={()=>{prepareClosing();setActualCash(String(countCash(cashQuantities)));}}>{ar ? "استخدام العد في الإقفال" : "Use count for closing"}</button></div></section>

    <section className="card" data-no-bilingual><h2>{ar ? "بيانات تسليم الوردية" : "Shift handover details"}</h2><p className="muted mt-1 text-sm">{ar ? "ستُحفظ مع العد والفروق والمعلقة والفاشلة والمصروفات عند الإقفال." : "Saved with counts, differences, pending and failed operations, and expenses at close."}</p><div className="mt-4 grid gap-3 md:grid-cols-2"><label>{ar ? "الكاشير المستلم" : "Receiving cashier"}<input value={receivingCashier} onChange={(event)=>setReceivingCashier(event.target.value)}/></label><label>{ar ? "ملاحظات التسليم" : "Handover notes"}<input value={handoverNotes} onChange={(event)=>setHandoverNotes(event.target.value)}/></label></div></section>
    <section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2>{ar ? "إقفال الوردية ومطابقة الأرصدة" : "Close and reconcile shift"}</h2><p className="muted">{ar ? "عدّ الخزنة وافتح كل محفظة واكتب الرصيد الفعلي. النظام سيظهر العجز أو الزيادة ويرحل التسوية." : "Count cash and enter actual provider balances."}</p></div><button className="btn" onClick={prepareClosing}><RotateCcw size={17}/>{ar ? "تجهيز الإقفال" : "Prepare closing"}</button></div>{actualCash!==""&&<><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><label>{ar ? "الخزنة الفعلية" : "Actual cash"}<input type="number" value={actualCash} onChange={(event)=>setActualCash(event.target.value)}/></label>{posProviders.map((provider)=><label key={provider.id}>{ar?provider.nameAr:provider.nameEn}<input type="number" value={actualProviders[provider.id]} onChange={(event)=>setActualProviders((current)=>({...current,[provider.id]:event.target.value}))}/></label>)}</div><div className={`mt-5 rounded-2xl p-4 ${Math.abs(closingSnapshot?.totalVariance||0)<.01?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-900"}`}><b>{ar ? "إجمالي فرق الجرد" : "Total variance"}: {money(closingSnapshot?.totalVariance||0)}</b><p className="mt-1 text-sm">{ar ? "الصفر يعني أن الخزنة وكل أرصدة الخدمات متطابقة مع العمليات المسجلة." : "Zero means all balances match recorded operations."}</p></div><button className="btn btn-primary mt-5" onClick={closeShift}><LockKeyhole size={17}/>{ar ? "اعتماد وإقفال الوردية" : "Approve and close"}</button></>}</section>
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><b>{ar ? "حسابات هذا المحل مستقلة" : "This store has independent accounts"}</b><p className="mt-1 text-sm">{ar ? "العمليات والقيود والتقارير هنا لا تدخل اليومية أو القوائم المالية للشركة الأساسية، ولا تختلط بأي محل آخر." : "Operations, entries, and reports here never mix with the main company or another store."}</p></div></div>}
    {workspaceView === "reports" && <PrintablePosReport locale={locale} period={period} storeName={activeStore.name} storeLogo={activeStore.logoDataUrl} provider={reportProvider} operations={reportOperations} balances={snapshot!.expectedProviders} printHidden={Boolean(receiptOperation)}/>}
    {receiptOperation&&<PrintableReceipt locale={locale} store={activeStore} shift={shifts.find((item)=>item.id===receiptOperation.shiftId)} operation={receiptOperation} onClose={()=>setReceiptOperation(undefined)}/>}
    {workspaceView === "help" && <div id="service-point-help"><ServicePointGuidance locale={locale}/></div>}
  </div>;
}

function WorkspaceHeader({ locale, view, onBack, onNewOperation }: { locale: Locale; view: ServicePointView; onBack: () => void; onNewOperation: () => void }) {
  const ar = locale === "ar";
  const copy: Record<Exclude<ServicePointView, "overview">, { title: string; description: string }> = ar ? {
    operations: { title: "العمليات", description: "سجّل عملية جديدة وتابع حالة عمليات الوردية الحالية." },
    services: { title: "الخدمات والأرصدة", description: "راقب سيولة كل شركة واقرأ مؤشرات التشغيل الذكية." },
    shifts: { title: "الورديات والتسوية", description: "عدّ الخزنة وطابق الأرصدة وسلّم الوردية بدقة." },
    reports: { title: "التقارير", description: "حلّل النتائج واطبع تقريرًا حسب الفترة أو الشركة." },
    search: { title: "البحث والمتابعة", description: "ابحث بالمرجع أو العميل وراجع تفاصيل أي معاملة." },
    store: { title: "إدارة المحلات", description: "بدّل بين الفروع وأدر بيانات كل محل بشكل مستقل." },
    merchants: { title: "حسابات التجار", description: "تابع حسابات التجار والتحصيلات والمديونيات." },
    team: { title: "الفريق والرقابة", description: "راجع أداء المستخدمين والورديات وسجل التحكم." },
    help: { title: "دليل التشغيل", description: "إرشادات مختصرة لتشغيل نقطة الخدمة بأمان." },
  } : {
    operations: { title: "Operations", description: "Record transactions and review the current shift." },
    services: { title: "Services & balances", description: "Monitor provider liquidity and operating insights." },
    shifts: { title: "Shifts & reconciliation", description: "Count cash, reconcile balances, and hand over accurately." },
    reports: { title: "Reports", description: "Analyze and print results by period or provider." },
    search: { title: "Search & tracking", description: "Find transactions by reference or customer." },
    store: { title: "Store management", description: "Switch branches and manage each store independently." },
    merchants: { title: "Merchant accounts", description: "Track merchant accounts, collections, and balances." },
    team: { title: "Team & control", description: "Review users, shifts, and control activity." },
    help: { title: "Operating guide", description: "Quick guidance for safer service point operation." },
  };
  const item = copy[view as Exclude<ServicePointView, "overview">];
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  return <header className={`hawally-workspace-header no-print ${view === "operations" ? "is-operations" : ""}`}><button className="hawally-back-button" onClick={onBack}><BackIcon size={18}/>{ar ? "الرئيسية" : "Dashboard"}</button><div><span>{ar ? "مساحة العمل" : "Workspace"}</span><h1>{item.title}</h1><p>{item.description}</p></div>{view !== "operations" && <button className="btn btn-primary" onClick={onNewOperation}><PlusCircle size={17}/>{ar ? "عملية جديدة" : "New transaction"}</button>}</header>;
}

function StoreAccountsBar({ locale, stores, activeStoreId, activeStore, newStoreName, setNewStoreName, onSelect, onCreate, onLogo }: { locale: Locale; stores: PosStore[]; activeStoreId: string; activeStore?:PosStore; newStoreName: string; setNewStoreName: (value: string) => void; onSelect: (storeId: string) => void; onCreate: () => void; onLogo:(file?:File)=>void }) {
  const ar = locale === "ar";
  return <section className="card no-print" data-no-bilingual>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-daftar-primary"><Store size={21}/></span><div><h2>{ar ? "حسابات المحلات المستقلة" : "Independent store accounts"}</h2><p className="muted mt-1">{ar ? "كل محل له خزنة ومحافظ وقيود وتقارير منفصلة تمامًا." : "Every store has isolated cash, wallets, entries, and reports."}</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><span className="badge">{ar ? "منفصل عن حسابات الشركة" : "Isolated from company books"}</span><a className="btn" href={`/${locale}/service-point/owner-dashboard`}>{ar ? "معاينة لوحة صاحب المحل" : "Owner dashboard preview"}</a></div>
    </div>
    <div className="mt-5 grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
      <label>{ar ? "المحل الذي تعمل عليه الآن" : "Current store"}<select value={activeStoreId} onChange={(event) => onSelect(event.target.value)}><option value="">{ar ? "اختر محلًا" : "Select store"}</option>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>
      <label>{ar ? "إضافة محل جديد بحسابات منفصلة" : "Add an isolated store"}<input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={ar ? "مثال: فرع مدينة نصر" : "Example: Downtown branch"}/></label>
      <button className="btn btn-primary h-[56px]" onClick={onCreate}><PlusCircle size={18}/>{ar ? "إنشاء المحل" : "Create store"}</button>
    </div>
    {activeStore&&<div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-daftar-line p-4"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-daftar-bg">{activeStore.logoDataUrl?<Image unoptimized width={64} height={64} alt={activeStore.name} className="h-full w-full object-contain" src={activeStore.logoDataUrl}/>:<Store/>}</div><div className="flex-1"><b>{ar?"شعار المحل في التقارير والإيصالات":"Store logo on reports and receipts"}</b><p className="muted mt-1 text-sm">{ar?"PNG أو JPG، بحد أقصى 1.5 ميجابايت.":"PNG or JPG, up to 1.5 MB."}</p></div><label className="btn"><ImageUp size={17}/>{ar?"رفع أو تغيير الشعار":"Upload or change logo"}<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>onLogo(event.target.files?.[0])}/></label></div>}
  </section>;
}

function Metric({icon:Icon,title,value}:{icon:typeof Banknote;title:string;value:string}) { return <article className="card"><Icon/><span className="muted mt-3 block">{title}</span><strong className="mt-1 block text-2xl">{value}</strong></article>; }

function providerName(id: PosProviderId | undefined, ar: boolean) { const item=posProviders.find((provider)=>provider.id===id); return item ? (ar?item.nameAr:item.nameEn) : "—"; }
function operationProvider(operation: PosOperation, ar: boolean) { return operation.destinationProviderId ? `${providerName(operation.providerId,ar)} ← ${providerName(operation.destinationProviderId,ar)}` : providerName(operation.providerId,ar); }
function ProviderBrand({providerId,locale}:{providerId:PosProviderId;locale:Locale}) { const provider=posProviders.find((item)=>item.id===providerId)!; const mark=provider.id==="vodafone-cash"?"V":provider.id==="orange-cash"?"orange":provider.id==="etisalat-cash"?"e&":provider.id==="fawry"?"fawry":provider.id==="instapay"?"ipn":provider.nameEn; return <span className="inline-flex items-center gap-3"><i className="grid h-11 min-w-11 place-items-center rounded-xl px-2 text-xs font-black text-white" style={{background:provider.color}}>{mark}</i><b>{locale==="ar"?provider.nameAr:provider.nameEn}</b></span>; }

function OperationsTable({locale,operations,onPrint,onReverse,onPendingStatus}:{locale:Locale;operations:PosOperation[];onPrint:(operation:PosOperation)=>void;onReverse:(operation:PosOperation)=>void;onPendingStatus:(operation:PosOperation,status:"successful"|"failed")=>void}) { const ar=locale==="ar"; const label=(status:PosOperationStatus)=>ar?({successful:"ناجحة",pending:"معلقة",failed:"فاشلة",reversed:"مستردة"}[status]):status; return <section className="card sp-operations-table"><div className="sp-table-heading"><div><h2>{ar?"عمليات الوردية":"Shift operations"}</h2><p>{ar?"راجع كل العمليات المسجلة وحالتها وإجراءاتها من جدول واحد واضح.":"Review every recorded transaction, status, and action in one clear table."}</p></div><span>{operations.length.toLocaleString(ar?"ar-EG":"en")} {ar?"عملية":"operations"}</span></div><div className="table-wrap mt-4"><table><thead><tr><th>{ar?"الوقت":"Time"}</th><th>{ar?"العملية":"Operation"}</th><th>{ar?"الخدمة":"Provider"}</th><th>{ar?"القيمة":"Amount"}</th><th>{ar?"الحالة":"Status"}</th><th>{ar?"الربح":"Profit"}</th><th>{ar?"الإجراءات":"Actions"}</th></tr></thead><tbody>{operations.length?operations.map((operation)=>{const status=operation.status||"successful";return <tr key={operation.id}><td>{new Date(operation.at).toLocaleTimeString(ar?"ar-EG":"en",{hour:"2-digit",minute:"2-digit"})}</td><td>{operation.reversalOfOperationId?(ar?"قيد عكسي / استرداد":"Reversal"):ar?posOperationTypes.find((item)=>item.id===operation.type)?.nameAr:posOperationTypes.find((item)=>item.id===operation.type)?.nameEn}<small className="block text-daftar-muted">{operation.reference||"—"}</small></td><td>{operationProvider(operation,ar)}</td><td>{money(operation.amount)}</td><td><span className={`badge ${status==="failed"||status==="reversed"?"error":""}`}>{label(status)}</span></td><td><b>{money(operation.profit)}</b></td><td><div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>onPrint(operation)}><Printer size={15}/>{ar?"إيصال":"Receipt"}</button>{status==="pending"&&<><button className="btn btn-primary" onClick={()=>onPendingStatus(operation,"successful")}>{ar?"اعتماد":"Approve"}</button><button className="btn btn-danger" onClick={()=>onPendingStatus(operation,"failed")}>{ar?"فشل":"Fail"}</button></>}{status==="successful"&&!operation.reversalOfOperationId&&<button className="btn btn-danger" onClick={()=>onReverse(operation)}><RotateCcw size={15}/>{ar?"استرداد":"Reverse"}</button>}</div></td></tr>}):<tr><td colSpan={7} className="muted">{ar?"لا توجد عمليات في الوردية حتى الآن.":"No operations yet."}</td></tr>}</tbody></table></div></section>; }

function Reports({locale,period,setPeriod,provider,setProvider,report,operations}:{locale:Locale;period:"day"|"week"|"month";setPeriod:(value:"day"|"week"|"month")=>void;provider:"all"|PosProviderId;setProvider:(value:"all"|PosProviderId)=>void;report:{volume:number;revenue:number;expense:number;profit:number};operations:PosOperation[]}) { const ar=locale==="ar"; return <section className="card"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2>{ar?"تقارير نقاط الخدمات":"Service point reports"}</h2><p className="muted">{ar?"اختر شركة واحدة أو الإجمالي ثم اطبع العمليات والأرصدة وصافي الربح.":"Choose one provider or all, then print operations, balances, and net profit."}</p></div><div className="flex flex-wrap items-end gap-3"><label className="min-w-52">{ar?"الشركة في التقرير":"Report provider"}<select value={provider} onChange={(event)=>setProvider(event.target.value as "all"|PosProviderId)}><option value="all">{ar?"كل الشركات — الإجمالي":"All providers — total"}</option>{posProviders.map((item)=><option key={item.id} value={item.id}>{ar?item.nameAr:item.nameEn}</option>)}</select></label><div className="flex gap-2">{(["day","week","month"] as const).map((item)=><button key={item} className={`btn ${period===item?"btn-primary":""}`} onClick={()=>setPeriod(item)}>{ar?(item==="day"?"يومي":item==="week"?"أسبوعي":"شهري"):item}</button>)}</div></div></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Metric icon={ReceiptText} title={ar?"عدد العمليات":"Operations"} value={String(operations.length)}/><Metric icon={WalletCards} title={ar?"حجم العمليات":"Volume"} value={money(report.volume)}/><Metric icon={PlusCircle} title={ar?"إيراد العمولات":"Revenue"} value={money(report.revenue)}/><Metric icon={Landmark} title={ar?"التكاليف":"Costs"} value={money(report.expense)}/><Metric icon={BarChart3} title={ar?"صافي الربح":"Net profit"} value={money(report.profit)}/></div></section>; }

function PrintablePosReport({ locale, period, storeName, storeLogo, provider, operations, balances, printHidden }: { locale: Locale; period: "day" | "week" | "month"; storeName: string; storeLogo?:string; provider: "all" | PosProviderId; operations: PosOperation[]; balances: Record<PosProviderId, number>; printHidden:boolean }) {
  const ar = locale === "ar";
  const periodLabel = ar ? (period === "day" ? "التقرير اليومي" : period === "week" ? "التقرير الأسبوعي" : "التقرير الشهري") : `${period} report`;
  const shownProviders = provider === "all" ? posProviders : posProviders.filter((item) => item.id === provider);
  const totals = operations.reduce((value, operation) => {const active=(operation.status||"successful")==="successful"&&!operation.reversalOfOperationId;return({ volume: value.volume + (active?operation.amount:0), fees: value.fees + (active?operation.revenue:0), costs: value.costs + (active?operation.expense:0), profit: value.profit + (["pending","failed"].includes(operation.status||"successful")?0:operation.profit) });}, { volume: 0, fees: 0, costs: 0, profit: 0 });
  return <section className={`pos-print-report card ${printHidden?"print-hidden":""}`} data-no-bilingual>
    <div className="rounded-3xl bg-[#0d315c] p-6 text-white"><div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-center gap-4">{storeLogo&&<Image unoptimized width={64} height={64} alt={storeName} className="h-16 w-16 rounded-2xl bg-white object-contain p-1" src={storeLogo}/>}<div><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{periodLabel}</span><h1 className="mt-3 text-2xl font-black text-white">{ar ? "تقرير نقطة الخدمات" : "Service Point Report"}</h1><p className="mt-1 text-white/75">{storeName} · {ar ? `تم إنشاؤه في ${new Date().toLocaleString("ar-EG")}` : `Generated ${new Date().toLocaleString("en")}`}</p></div></div><div className="rounded-2xl bg-white p-3 text-[#0d315c]">{provider === "all" ? <b>{ar?"كل الشركات":"All providers"}</b> : <ProviderBrand providerId={provider} locale={locale}/>}</div></div></div>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><h2>{ar ? "ملخص النتائج" : "Results summary"}</h2><p className="muted">{ar?"يعرض هذا التقرير العمليات والأرصدة وصافي الربح فقط.":"This report contains operations, balances, and net profit only."}</p></div><div className="no-print text-end"><button className="btn btn-primary" onClick={() => window.print()}><Printer size={18}/>{ar ? "طباعة التقرير / حفظ PDF" : "Print / Save PDF"}</button><small className="mt-2 block max-w-sm text-daftar-muted">{ar?"من «المزيد من الإعدادات» ألغِ الرؤوس والتذييلات لمنع ظهور رابط الصفحة والتاريخ.":"Disable Headers and footers in More settings."}</small></div></div>
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><ReportTotal label={ar ? "عدد العمليات" : "Operations"} value={String(operations.length)}/><ReportTotal label={ar ? "حجم العمليات" : "Volume"} value={money(totals.volume)}/><ReportTotal label={ar ? "إجمالي الأرصدة" : "Total balances"} value={money(shownProviders.reduce((sum,item)=>sum+balances[item.id],0))}/><ReportTotal label={ar ? "صافي الربح" : "Net profit"} value={money(totals.profit)}/></div>

    <div className="pos-balances-section mt-8"><h3 className="text-xl font-black">{ar ? "الأرصدة الحالية" : "Current balances"}</h3><div className="pos-balance-grid mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shownProviders.map((item)=><article className="flex items-center justify-between rounded-2xl border border-daftar-line p-4" key={item.id}><ProviderBrand providerId={item.id} locale={locale}/><strong>{money(balances[item.id])}</strong></article>)}</div></div>

    <div className="mt-8"><h3 className="text-xl font-black">{ar ? "المعاملات التي تمت" : "Completed transactions"}</h3><div className="table-wrap mt-3"><table><thead><tr><th>{ar ? "التاريخ والوقت" : "Date & time"}</th><th>{ar ? "العملية" : "Operation"}</th><th>{ar ? "الشركة / التحويل" : "Provider / transfer"}</th><th>{ar ? "القيمة" : "Amount"}</th><th>{ar ? "الحالة" : "Status"}</th><th>{ar ? "العمولة" : "Fee"}</th><th>{ar ? "التكلفة" : "Cost"}</th><th>{ar ? "صافي الربح" : "Net profit"}</th><th>{ar ? "المرجع" : "Reference"}</th></tr></thead><tbody>{operations.map((operation) => <tr key={operation.id}><td>{operation.businessDate}<small className="block text-daftar-muted">{new Date(operation.at).toLocaleTimeString(ar ? "ar-EG" : "en", { hour: "2-digit", minute: "2-digit" })}</small></td><td>{operation.reversalOfOperationId?(ar?"استرداد / حركة عكسية":"Reversal"):ar ? posOperationTypes.find((item) => item.id === operation.type)?.nameAr : posOperationTypes.find((item) => item.id === operation.type)?.nameEn}</td><td>{operationProvider(operation,ar)}</td><td>{money(operation.amount)}</td><td>{ar?({successful:"ناجحة",pending:"معلقة",failed:"فاشلة",reversed:"مستردة"} as const)[operation.status||"successful"]:operation.status||"successful"}</td><td>{money(operation.customerFee)}</td><td>{money(operation.providerCost)}</td><td><b>{money(operation.profit)}</b></td><td>{operation.reference || "—"}</td></tr>)}{!operations.length && <tr><td colSpan={9}>{ar ? "لا توجد معاملات في الفترة والشركة المختارتين." : "No transactions for the selected period and provider."}</td></tr>}</tbody></table></div></div>
  </section>;
}

function PrintableReceipt({locale,store,shift,operation,onClose}:{locale:Locale;store:PosStore;shift?:PosShift;operation:PosOperation;onClose:()=>void}){const ar=locale==="ar",status=operation.status||"successful";return <section className="pos-print-report pos-receipt-overlay fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4 sm:p-8" data-no-bilingual><div className="pos-receipt-paper card mx-auto max-w-xl"><div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3"><button className="btn" onClick={onClose}><X size={17}/>{ar?"إغلاق المعاينة":"Close preview"}</button><button className="btn btn-primary" onClick={()=>window.print()}><Printer size={17}/>{ar?"طباعة الإيصال / PDF":"Print receipt / PDF"}</button></div><div className="text-center">{store.logoDataUrl&&<Image unoptimized width={80} height={80} alt={store.name} className="mx-auto h-20 w-20 object-contain" src={store.logoDataUrl}/>}<h1 className="mt-3 text-2xl font-black">{store.name}</h1><p className="muted">{ar?"إيصال معاملة نقطة خدمات":"Service point transaction receipt"}</p>{operation.providerId&&<div className="mt-4 inline-flex rounded-2xl bg-daftar-bg p-3"><ProviderBrand providerId={operation.providerId} locale={locale}/></div>}</div><div className="my-6 border-y border-dashed border-daftar-line py-5"><div className="grid grid-cols-2 gap-4"><ReceiptRow label={ar?"التاريخ":"Date"} value={new Date(operation.at).toLocaleString(ar?"ar-EG":"en")}/><ReceiptRow label={ar?"المرجع":"Reference"} value={operation.reference||operation.id.slice(0,10)}/><ReceiptRow label={ar?"الكاشير":"Cashier"} value={shift?.cashierName||"—"}/><ReceiptRow label={ar?"رقم الإيصال":"Receipt number"} value={operation.id.slice(0,12).toUpperCase()}/><ReceiptRow label={ar?"العملية":"Operation"} value={operation.reversalOfOperationId?(ar?"استرداد":"Reversal"):(ar?posOperationTypes.find((item)=>item.id===operation.type)?.nameAr:posOperationTypes.find((item)=>item.id===operation.type)?.nameEn)||"—"}/><ReceiptRow label={ar?"الشركة":"Provider"} value={operationProvider(operation,ar)}/><ReceiptRow label={ar?"القيمة":"Amount"} value={money(operation.amount)}/><ReceiptRow label={ar?"العمولة":"Fee"} value={money(operation.customerFee)}/><ReceiptRow label={ar?"صافي الربح":"Net profit"} value={money(operation.profit)}/><ReceiptRow label={ar?"الحالة":"Status"} value={ar?({successful:"ناجحة",pending:"معلقة",failed:"فاشلة",reversed:"مستردة"} as const)[status]:status}/></div></div><p className="text-center text-sm text-daftar-muted">{ar?"احتفظ بالمرجع لمراجعة أو تتبع المعاملة. هذا إيصال صادر من نظام إدارة المحل وليس إشعارًا بنكيًا.":"Keep the reference to track the transaction. This store-system receipt is not a bank confirmation."}</p><p className="no-print mt-5 rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-900">{ar?"لو ظهر التاريخ أو رابط الصفحة أعلى وأسفل الورقة، افتح «المزيد من الإعدادات» وألغِ «الرؤوس والتذييلات».":"Disable Headers and footers in More settings if the browser date or URL appears."}</p></div></section>}
function ReceiptRow({label,value}:{label:string;value:string}){if(label==="صافي الربح"||label==="Net profit")return null;return <div><small className="text-daftar-muted">{label}</small><b className="mt-1 block">{value}</b></div>}

function ServicePointGuidance({locale}:{locale:Locale}){const ar=locale==="ar";const items=ar?[
  ["حالات المعاملة","اختر ناجحة للترحيل الفوري، معلقة إذا كنت تنتظر التأكيد، أو فاشلة إذا لم تتم. العمليات المعلقة والفاشلة لا تحرك الأرصدة."],
  ["الاسترداد والإلغاء","لا تحذف العملية الناجحة. استخدم زر استرداد ليُنشئ النظام حركة وقيدًا عكسيين مع بقاء الأصل في سجل الرقابة."],
  ["منع التكرار","النظام ينبه عند تكرار نفس المسار والقيمة والمرجع خلال وقت قصير. راجع التنبيه قبل إعادة التسجيل."],
  ["حدود المحافظ","راجع الحدود اليومية والشهرية والحد الأقصى للرصيد من الشركة صاحبة الخدمة؛ الحدود تختلف حسب نوع الحساب وقد تتغير."],
  ["التحويل بين أرصدة المحل","يُستخدم فقط لنقل مال المحل من شركة إلى أخرى. لا توجد حركة خزنة ولا عمولة ولا ربح، ويجب أن تكون الوجهة مختلفة عن المصدر."],
  ["التقارير والإيصالات","ارفع شعار المحل، واختر شركة واحدة أو الإجمالي، ثم اطبع التقرير أو إيصال العملية. الإيصال الداخلي ليس بديلًا عن إشعار مقدم الخدمة."],
  ["موافقة العمليات الكبيرة","في التشغيل متعدد المستخدمين يُفضل تحديد مبلغ يتطلب اعتماد المدير وربط كل كاشير بحسابه ودرج نقدي مستقل."],
  ["توزيع السيولة الذكي","راقب الحد الأدنى لكل محفظة وانقل الرصيد قبل نفاده. يمكن لاحقًا تفعيل اقتراحات تلقائية حسب متوسط الاستخدام."],
  ["Soft POS والربط الخارجي","قبول الدفع أو تنفيذ التحويل آليًا يحتاج تعاقدًا وواجهة رسمية من البنك أو مقدم الخدمة؛ النظام الحالي يسجل ويراقب ما تم تنفيذه."],
]:[
  ["Transaction status","Successful posts immediately; pending and failed transactions do not move balances."],["Reversals","Never delete a successful operation. Reverse it to preserve the audit trail."],["Duplicate protection","Review warnings for matching amount, route, and reference."],["Provider limits","Confirm current daily, monthly, and balance limits with each provider."],["Internal transfers","Move store-owned funds only; cash and profit stay unchanged."],["Reports & receipts","Upload the store logo and print one provider or the total."],["Large approvals","Use manager approval and separate cashier drawers in multi-user operation."],["Liquidity planning","Maintain a minimum balance for every provider."],["External integration","Soft POS and automatic transfers require official provider integration."],
];return <section className="card no-print"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-daftar-primary"><Info/></span><div><h2>{ar?"إرشادات تشغيل نقاط الخدمات":"Service point operating guidance"}</h2><p className="muted mt-1">{ar?"قواعد مهمة لحماية الأرصدة والأرباح وتقليل أخطاء الكاشير.":"Important rules for safer balances, profit, and cashier operations."}</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(([title,text],index)=><article className="rounded-2xl border border-daftar-line p-5" key={title}><span className={`grid h-9 w-9 place-items-center rounded-xl ${index<3?"bg-amber-50 text-amber-700":"bg-blue-50 text-daftar-primary"}`}>{index<3?<AlertTriangle size={18}/>:index===6?<ShieldCheck size={18}/>:<CheckCircle2 size={18}/>}</span><h3 className="mt-4">{title}</h3><p className="muted mt-2 text-sm leading-7">{text}</p></article>)}</div></section>}

function ReportTotal({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-daftar-bg p-3"><small className="text-daftar-muted">{label}</small><b className="mt-1 block text-lg">{value}</b></div>; }
