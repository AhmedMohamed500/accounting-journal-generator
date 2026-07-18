"use client";
import { useEffect, useMemo, useState } from "react";
import { Building2, Download, Layers3, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { defaultAccounts } from "@/data/accounts";
import { accountTemplates, cloneTemplate } from "@/data/account-templates";
import { loadAccounts, loadEntries, saveAccounts } from "@/lib/storage/accounting";
import { removedUsedAccount } from "@/lib/accounting/integrity";
import type { AccountType, ChartAccount, Locale } from "@/types";

const blank = (): ChartAccount => ({ id: crypto.randomUUID(), code: "", nameAr: "", nameEn: "", type: "asset", active: true, allowPosting: true, normalBalance: "debit", level: 1 });
const types: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

export function ChartOfAccounts({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [accounts, setAccounts] = useState<ChartAccount[]>(defaultAccounts);
  const [draft, setDraft] = useState<ChartAccount>(blank);
  const [query, setQuery] = useState(""), [typeFilter, setTypeFilter] = useState("all"), [error, setError] = useState(""), [notice, setNotice] = useState("");
  useEffect(() => { setAccounts(loadAccounts()); }, []);
  const labels: Record<AccountType, string> = ar ? { asset: "أصول", liability: "التزامات", equity: "حقوق ملكية", revenue: "إيرادات", expense: "مصروفات" } : { asset: "Assets", liability: "Liabilities", equity: "Equity", revenue: "Revenue", expense: "Expenses" };
  const parents = useMemo(() => accounts.filter((account) => account.active).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [accounts]);
  const visible = useMemo(() => accounts.filter((account) => (typeFilter === "all" || account.type === typeFilter) && `${account.code} ${account.nameAr} ${account.nameEn}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [accounts, query, typeFilter]);
  const commit = (next: ChartAccount[]) => { const used = removedUsedAccount(accounts, next, loadEntries()); if (used) { setError(ar ? `لا يمكن حذف الحساب ${used.code} لأنه مستخدم في قيود.` : `Account ${used.code} is used by entries and cannot be deleted.`); return false; } saveAccounts(next); setAccounts(next); return true; };
  const selectParent = (parentId: string) => { const parent = accounts.find((account) => account.id === parentId); setDraft({ ...draft, parentId: parentId || undefined, type: parent?.type || draft.type, normalBalance: parent ? (parent.type === "asset" || parent.type === "expense" ? "debit" : "credit") : draft.normalBalance, level: parent ? (parent.level || 1) + 1 : 1 }); };
  const add = () => {
    setNotice("");
    if (!draft.code.trim() || !draft.nameAr.trim() || !draft.nameEn.trim()) return setError(ar ? "أدخل الكود والاسم بالعربية والإنجليزية." : "Enter code, Arabic name, and English name.");
    if (accounts.some((account) => account.code === draft.code.trim())) return setError(ar ? "كود الحساب مستخدم بالفعل." : "Account code already exists.");
    const parent = accounts.find((account) => account.id === draft.parentId);
    if (parent && parent.type !== draft.type) return setError(ar ? "نوع الحساب الفرعي يجب أن يطابق نوع الحساب الأب." : "A child account must have the same type as its parent.");
    const prepared = { ...draft, code: draft.code.trim(), nameAr: draft.nameAr.trim(), nameEn: draft.nameEn.trim(), level: parent ? (parent.level || 1) + 1 : 1 };
    if (commit([...accounts, prepared])) { setDraft(blank()); setError(""); setNotice(ar ? "تمت إضافة الحساب وحفظه في دليل المؤسسة." : "Account added to the company chart."); }
  };
  const update = (id: string, field: keyof ChartAccount, value: string | boolean) => {
    if (field === "code" && accounts.some((account) => account.id !== id && account.code === String(value).trim())) return setError(ar ? "هذا الكود مستخدم في حساب آخر." : "This code is already used by another account.");
    setError(""); commit(accounts.map((account) => account.id === id ? { ...account, [field]: value } : account));
  };
  const applyTemplate = (templateId: string) => { const template = accountTemplates.find((item) => item.id === templateId); if (!template) return; if (!window.confirm(ar ? `سيتم تطبيق قالب «${template.nameAr}». هل تريد المتابعة؟` : `Apply “${template.nameEn}” template?`)) return; if (commit(cloneTemplate(template))) { setError(""); setNotice(ar ? `تم تطبيق قالب ${template.nameAr}. يمكنك تخصيصه الآن.` : `${template.nameEn} template applied. You can customize it now.`); } };
  const downloadCsv = () => { const rows = [["code", "name_ar", "name_en", "type", "parent_code", "posting", "active"], ...[...accounts].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })).map((account) => [account.code, account.nameAr, account.nameEn, account.type, accounts.find((item) => item.id === account.parentId)?.code || "", account.allowPosting === false ? "no" : "yes", account.active ? "yes" : "no"])]; const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`; const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "chart-of-accounts.csv"; link.click(); URL.revokeObjectURL(link.href); };
  const postingCount = accounts.filter((account) => account.allowPosting !== false && account.active).length;

  return <div className="grid">
    <section className="grid four">
      <Metric title={ar ? "إجمالي الحسابات" : "Total accounts"} value={accounts.length} />
      <Metric title={ar ? "حسابات الترحيل" : "Posting accounts"} value={postingCount} />
      <Metric title={ar ? "حسابات التجميع" : "Control accounts"} value={accounts.filter((account) => account.allowPosting === false).length} />
      <Metric title={ar ? "مستويات الدليل" : "Chart levels"} value={Math.max(...accounts.map((account) => account.level || 1), 1)} />
    </section>

    <section className="card no-print"><h2><Building2 size={20} /> {ar ? "ابدأ بقالب مناسب لنشاط المؤسسة" : "Start with an industry template"}</h2><p className="muted">{ar ? "اختر دليلًا جاهزًا ثم عدّله، أو تجاهل القوالب وأنشئ حساباتك بنفسك." : "Choose a ready chart and customize it, or build your own."}</p><div className="grid four">{accountTemplates.map((template) => <article className="card" key={template.id}><h3>{ar ? template.nameAr : template.nameEn}</h3><p className="muted"><small>{ar ? template.descriptionAr : template.descriptionEn}</small></p><button className="btn" onClick={() => applyTemplate(template.id)}>{ar ? "استخدام القالب" : "Use template"}</button></article>)}</div></section>

    <section className="card no-print"><h2><Plus size={20} /> {ar ? "إنشاء حساب مخصص" : "Create custom account"}</h2><div className="grid three">
      <label>{ar ? "الحساب الأب" : "Parent account"}<select value={draft.parentId || ""} onChange={(event) => selectParent(event.target.value)}><option value="">{ar ? "— حساب رئيسي —" : "— Top-level account —"}</option>{parents.map((account) => <option key={account.id} value={account.id}>{account.code} — {ar ? account.nameAr : account.nameEn}</option>)}</select></label>
      <label>{ar ? "كود الحساب" : "Account code"}<input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder={ar ? "مثال: 5120" : "Example: 5120"} /></label>
      <label>{ar ? "نوع الحساب" : "Account type"}<select value={draft.type} onChange={(event) => { const type = event.target.value as AccountType; setDraft({ ...draft, type, normalBalance: type === "asset" || type === "expense" ? "debit" : "credit", parentId: undefined, level: 1 }); }}>{types.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
      <label>{ar ? "الاسم بالعربية" : "Arabic name"}<input value={draft.nameAr} onChange={(event) => setDraft({ ...draft, nameAr: event.target.value })} /></label>
      <label>{ar ? "الاسم بالإنجليزية" : "English name"}<input value={draft.nameEn} onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })} /></label>
      <label>{ar ? "طبيعة الحساب" : "Normal balance"}<select value={draft.normalBalance} onChange={(event) => setDraft({ ...draft, normalBalance: event.target.value as "debit" | "credit" })}><option value="debit">{ar ? "مدين" : "Debit"}</option><option value="credit">{ar ? "دائن" : "Credit"}</option></select></label>
      <label style={{ display: "flex", alignItems: "center" }}><input style={{ width: "auto" }} type="checkbox" checked={draft.allowPosting !== false} onChange={(event) => setDraft({ ...draft, allowPosting: event.target.checked })} />{ar ? "السماح بالترحيل المباشر على الحساب" : "Allow direct posting"}</label>
    </div>{error && <p className="warning error">{error}</p>}{notice && <p className="warning">{notice}</p>}<button className="btn btn-primary" onClick={add}><Plus size={17} />{ar ? "إضافة الحساب" : "Add account"}</button></section>

    <section className="card"><div className="actions no-print" style={{ justifyContent: "space-between" }}><div className="actions"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "بحث بالكود أو الاسم" : "Search code or name"} /></label><label>{ar ? "التصنيف" : "Type"}<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">{ar ? "كل الحسابات" : "All accounts"}</option>{types.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label></div><div className="actions"><button className="btn" onClick={downloadCsv}><Download size={16} />CSV</button><button className="btn" onClick={() => { if (window.confirm(ar ? "استعادة الدليل العام وحذف التخصيصات غير المستخدمة؟" : "Restore the general chart?")) { commit(defaultAccounts.map((account) => ({ ...account }))); setError(""); } }}><RotateCcw size={16} />{ar ? "استعادة الدليل العام" : "Restore general chart"}</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>{ar ? "الكود" : "Code"}</th><th>{ar ? "الحساب" : "Account"}</th><th>{ar ? "النوع" : "Type"}</th><th>{ar ? "الطبيعة" : "Normal"}</th><th>{ar ? "الترحيل" : "Posting"}</th><th>{ar ? "نشط" : "Active"}</th><th className="no-print">{ar ? "إجراء" : "Action"}</th></tr></thead><tbody>{visible.map((account) => <tr key={account.id} style={{ opacity: account.active ? 1 : .55 }}>
        <td><input aria-label="code" value={account.code} onChange={(event) => update(account.id, "code", event.target.value)} /></td>
        <td><div style={{ paddingInlineStart: `${Math.max((account.level || 1) - 1, 0) * 22}px` }}><span className="actions">{account.allowPosting === false && <Layers3 size={15} />}<input aria-label="Arabic name" value={ar ? account.nameAr : account.nameEn} onChange={(event) => update(account.id, ar ? "nameAr" : "nameEn", event.target.value)} /></span><small className="muted">{ar ? account.nameEn : account.nameAr}</small></div></td>
        <td><span className="badge">{labels[account.type]}</span></td><td>{account.normalBalance === "credit" ? (ar ? "دائن" : "Credit") : (ar ? "مدين" : "Debit")}</td>
        <td><input aria-label="posting" style={{ width: "auto" }} type="checkbox" checked={account.allowPosting !== false} onChange={(event) => update(account.id, "allowPosting", event.target.checked)} /></td><td><input aria-label="active" style={{ width: "auto" }} type="checkbox" checked={account.active} onChange={(event) => update(account.id, "active", event.target.checked)} /></td>
        <td className="no-print"><button className="btn btn-danger" disabled={account.system || accounts.some((item) => item.parentId === account.id)} title={account.system ? (ar ? "حساب أساسي" : "System account") : accounts.some((item) => item.parentId === account.id) ? (ar ? "احذف الحسابات الفرعية أولًا" : "Remove child accounts first") : undefined} onClick={() => commit(accounts.filter((item) => item.id !== account.id))}><Trash2 size={16} /></button></td>
      </tr>)}</tbody></table></div><p className="muted">{ar ? `${visible.length} حساب — التعديلات محفوظة للمؤسسة الحالية.` : `${visible.length} accounts — changes are saved for the current company.`}</p></section>
  </div>;
}

function Metric({ title, value }: { title: string; value: number }) { return <div className="card"><span className="muted">{title}</span><div className="impact">{value}</div></div>; }
