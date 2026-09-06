import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { addMonths, format } from "date-fns";
import { Download, FilePlus2, ImagePlus, Trash2, Upload, X } from "lucide-react";

const TABS = ["TM5", "TM6", "TM11", "TM16", "TM56", "JOURNAL", "GENERAL"] as const;
type FormCode = typeof TABS[number];
type Entry = Record<string, any> & { id: string; form_code: FormCode; tm_cpr_number: string; form_number: string | null; form_date: string | null; due_date: string | null; target_tm_number: string | null; application_name: string | null; nice_class: string | null; applicant_name: string | null; agent_name: string | null; filing_date: string | null; notes: string | null; image_path: string | null };

const INFO: Record<FormCode, string> = {
  TM5: "Opposition filed against another trademark. Match by TM / CPR number.",
  TM6: "Counter-statement / reply. Due date is calculated as one month from receipt.",
  TM11: "Demand Note / registration fee. Only submission date is required.",
  TM16: "Correction in application. Only submission date is required.",
  TM56: "Correspondence address change. Only submission date is required.",
  JOURNAL: "Monthly publication sheet. Publication deadline is calculated as +2 months.",
  GENERAL: "General IPO entry matched by TM / CPR number."
};

function Input(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className="h-9 w-full border-2 border-black bg-white px-2 font-mono text-xs" />; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label><div className="mt-1">{children}</div></div>; }
function calc(date: string, n: number) { return date ? format(addMonths(new Date(`${date}T00:00:00`), n), "yyyy-MM-dd") : ""; }

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"' && quoted && next === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && next === "\n") i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ""; continue; }
    cell += c;
  }
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  return rows;
}
function csvCell(v: any) { const s = String(v ?? ""); return `"${s.replaceAll('"', '""')}"`; }

export function FormsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<FormCode>("TM5");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Entry | null>(null);
  const [p, setP] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading, error } = useQuery<Entry[]>({
    queryKey: ["related-forms", tab],
    queryFn: async () => {
      const { data, error } = await supabase.from("related_form_entries").select("*").eq("form_code", tab).order("form_date", { ascending: false }).limit(5000);
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
    staleTime: 15000
  });

  const save = useMutation({
    mutationFn: async () => {
      const clean = (v: any) => v === "" ? null : v;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expired. Please sign in again.");
      const payload: any = { form_code: tab, tm_cpr_number: String(p.tm_cpr_number || "").trim(), form_number: clean(p.form_number), form_date: clean(p.form_date), due_date: clean(p.due_date), target_tm_number: clean(p.target_tm_number), application_name: clean(p.application_name), nice_class: clean(p.nice_class), applicant_name: clean(p.applicant_name), agent_name: clean(p.agent_name), filing_date: clean(p.filing_date), notes: clean(p.notes), image_path: clean(p.image_path), updated_by: auth.user.id };
      if (!payload.tm_cpr_number) throw new Error("TM / CPR number is required.");
      const result = edit ? await supabase.from("related_form_entries").update(payload).eq("id", edit.id).select("id").maybeSingle() : await supabase.from("related_form_entries").insert({ ...payload, created_by: auth.user.id }).select("id").single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("Nothing was saved. Check your access and try again.");
      return result.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["related-forms", tab] }); setOpen(false); setEdit(null); setP({}); }
  });

  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("related_form_entries").delete().eq("id", id); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["related-forms", tab] }) });

  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));
  const start = (e?: Entry) => { setEdit(e || null); setP(e ? { ...e } : { form_date: format(new Date(), "yyyy-MM-dd") }); setOpen(true); };

  const exportCsv = () => {
    const columns = ["tm_cpr_number", "form_number", "form_date", "due_date", "target_tm_number", "application_name", "nice_class", "applicant_name", "agent_name", "filing_date", "status", "notes", "image_path"];
    const csv = [columns.join(","), ...entries.map(e => columns.map(c => csvCell(e[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `brandex-${tab.toLowerCase()}-related-sheet.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const readImport = async (file: File) => {
    const rows = parseCsv(await file.text());
    if (rows.length < 2) throw new Error("CSV has no data rows.");
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
    const aliases: Record<string, string> = { "tm_cpr": "tm_cpr_number", "tm_cpr_no": "tm_cpr_number", "tm_cpr_number": "tm_cpr_number", "number": "form_number", "date": "form_date", "due": "due_date", "target_tm": "target_tm_number", "application": "application_name", "mark": "application_name", "class": "nice_class", "applicant": "applicant_name", "agent": "agent_name", "filing": "filing_date" };
    const mapped = rows.slice(1).map(r => Object.fromEntries(r.map((v, i) => [aliases[headers[i]] || headers[i], v.trim()]))).filter(r => r.tm_cpr_number);
    if (!mapped.length) throw new Error("No rows contain TM / CPR number.");
    setImportPreview(mapped);
  };

  const importAll = useMutation({
    mutationFn: async () => {
      if (!importPreview?.length) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expired. Please sign in again.");
      const clean = (v: any) => v === "" ? null : v;
      const rows = importPreview.map(r => ({ form_code: tab, tm_cpr_number: String(r.tm_cpr_number).trim(), form_number: clean(r.form_number), form_date: clean(r.form_date), due_date: clean(r.due_date), target_tm_number: clean(r.target_tm_number), application_name: clean(r.application_name), nice_class: clean(r.nice_class), applicant_name: clean(r.applicant_name), agent_name: clean(r.agent_name), filing_date: clean(r.filing_date), status: clean(r.status), notes: clean(r.notes), image_path: clean(r.image_path), created_by: auth.user!.id, updated_by: auth.user!.id }));
      const { error } = await supabase.from("related_form_entries").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => { setImportPreview(null); qc.invalidateQueries({ queryKey: ["related-forms", tab] }); }
  });

  return <AppShell><div className="flex h-full min-h-0 flex-col bg-[#F0E8D0] p-4 sm:p-5"><div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col gap-4">
    <header className="flex flex-wrap items-center gap-3 border-b-2 border-black pb-4"><FilePlus2 className="h-6 w-6"/><div><h1 className="font-serif text-3xl uppercase tracking-widest">RELATED SHEETS</h1><p className="font-mono text-[9px] font-bold tracking-wider text-[#6d6658]">One workspace · exact TM / CPR matching · import/export for large datasets.</p></div><div className="ml-auto flex flex-wrap gap-2"><button onClick={exportCsv} disabled={!entries.length} className="flex h-10 items-center gap-2 border-2 border-black bg-white px-3 font-mono text-[10px] font-bold disabled:opacity-40"><Download className="h-4 w-4"/> EXPORT</button><button onClick={()=>importRef.current?.click()} className="flex h-10 items-center gap-2 border-2 border-black bg-white px-3 font-mono text-[10px] font-bold"><Upload className="h-4 w-4"/> IMPORT</button><input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async e=>{const f=e.target.files?.[0]; if(!f)return; try{await readImport(f)}catch(err){alert((err as Error).message)} e.target.value=""}}/><button onClick={()=>start()} className="flex h-10 items-center gap-2 bg-[#C94A00] px-4 font-mono text-xs font-bold text-white"><FilePlus2 className="h-4 w-4"/> ADD {tab}</button></div></header>
    <div className="flex gap-1 overflow-x-auto border-b-2 border-black">{TABS.map(t=><button key={t} onClick={()=>{setTab(t);setOpen(false)}} className={`shrink-0 border-2 border-b-0 px-4 py-2 font-mono text-[10px] font-black ${tab===t?"bg-black text-[#F0E8D0]":"bg-white"}`}>{t}</button>)}</div>
    <div className="border-2 border-black bg-white p-4"><div className="font-mono text-sm font-black">{tab}</div><div className="mt-1 font-mono text-[10px] text-[#6d6658]">{INFO[tab]}</div></div>
    <div className="min-h-0 flex-1 overflow-auto border-2 border-black bg-white"><table className="w-full whitespace-nowrap font-mono text-xs"><thead className="sticky top-0 bg-black text-[#F0E8D0]"><tr>{["TM / CPR","NUMBER","DATE","DUE","TARGET TM","APPLICATION","CLASS","APPLICANT","AGENT","ACTION"].map(h=><th key={h} className="px-3 py-3 text-left text-[9px]">{h}</th>)}</tr></thead><tbody>{isLoading?<tr><td colSpan={10} className="p-10 text-center">LOADING…</td></tr>:error?<tr><td colSpan={10} className="p-10 text-center text-red-800">FAILED TO LOAD {tab} — {String((error as Error).message)}</td></tr>:entries.length===0?<tr><td colSpan={10} className="p-10 text-center text-[#6d6658]">NO {tab} ENTRIES</td></tr>:entries.map(e=><tr key={e.id} className="border-b border-black/10 odd:bg-[#F0E8D0]"><td className="px-3 py-2 font-bold">{e.tm_cpr_number}</td><td className="px-3 py-2">{e.form_number||"—"}</td><td className="px-3 py-2">{e.form_date||"—"}</td><td className="px-3 py-2 font-bold">{e.due_date||"—"}</td><td className="px-3 py-2">{e.target_tm_number||"—"}</td><td className="max-w-[220px] truncate px-3 py-2">{e.application_name||"—"}</td><td className="px-3 py-2">{e.nice_class||"—"}</td><td className="max-w-[220px] truncate px-3 py-2">{e.applicant_name||"—"}</td><td className="px-3 py-2">{e.agent_name||"—"}</td><td className="px-3 py-2"><div className="flex gap-2"><button onClick={()=>start(e)} className="border-2 border-black px-2 py-1 text-[9px] font-bold">EDIT</button><button onClick={()=>remove.mutate(e.id)} className="border-2 border-[#CC0000] px-2 py-1 text-[#CC0000]"><Trash2 className="h-3 w-3"/></button></div></td></tr>)}</tbody></table></div>
    {importPreview&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-5xl border-2 border-black bg-[#F0E8D0] shadow-[8px_8px_0_#0C0C0C]"><div className="flex items-center justify-between bg-black px-5 py-4 text-[#F0E8D0]"><div><div className="font-serif text-2xl uppercase">IMPORT {tab}</div><div className="font-mono text-[9px]">{importPreview.length} rows found · previewing first 8 · SAVE imports ALL rows</div></div><button onClick={()=>setImportPreview(null)}><X/></button></div><div className="max-h-[55vh] overflow-auto bg-white p-3"><table className="w-full font-mono text-[10px]"><thead><tr className="border-b-2 border-black">{["TM / CPR","NUMBER","DATE","DUE","APPLICATION","CLASS"].map(h=><th key={h} className="px-2 py-2 text-left">{h}</th>)}</tr></thead><tbody>{importPreview.slice(0,8).map((r,i)=><tr key={i} className="border-b border-black/10"><td className="px-2 py-2 font-bold">{r.tm_cpr_number}</td><td className="px-2 py-2">{r.form_number||"—"}</td><td className="px-2 py-2">{r.form_date||"—"}</td><td className="px-2 py-2">{r.due_date||"—"}</td><td className="px-2 py-2">{r.application_name||"—"}</td><td className="px-2 py-2">{r.nice_class||"—"}</td></tr>)}</tbody></table></div><div className="flex justify-end gap-3 border-t-2 border-black p-4"><button onClick={()=>setImportPreview(null)} className="h-10 border-2 border-black bg-white px-5 font-mono text-xs font-bold">CANCEL</button><button disabled={importAll.isPending} onClick={()=>importAll.mutate()} className="h-10 bg-[#C94A00] px-6 font-mono text-xs font-bold text-white">{importAll.isPending?"IMPORTING…":`IMPORT ALL ${importPreview.length}`}</button></div>{importAll.error&&<div className="border-t-2 border-red-700 bg-red-50 p-3 font-mono text-xs font-bold text-red-800">IMPORT FAILED — {String((importAll.error as Error).message)}</div>}</div></div>}
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border-2 border-black bg-[#F0E8D0] shadow-[8px_8px_0_#0C0C0C]"><div className="flex items-center justify-between bg-black px-5 py-4 text-[#F0E8D0]"><div className="font-serif text-2xl uppercase">{edit?"EDIT":"ADD"} {tab}</div><button onClick={()=>setOpen(false)}><X/></button></div><div className="flex-1 overflow-y-auto p-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="TM / CPR NUMBER"><Input value={p.tm_cpr_number||""} onChange={e=>set("tm_cpr_number",e.target.value)} placeholder="Exact matching key"/></Field>
      {tab==="TM5"&&<><Field label="AGAINST TRADEMARK NUMBER"><Input value={p.target_tm_number||""} onChange={e=>set("target_tm_number",e.target.value)}/></Field><Field label="OPPOSITION FILED DATE"><Input type="date" value={p.form_date||""} onChange={e=>set("form_date",e.target.value)}/></Field><Field label="OPPOSITION NUMBER"><Input value={p.form_number||""} onChange={e=>set("form_number",e.target.value)}/></Field></>}
      {tab==="TM6"&&<><Field label="OPPOSITION NUMBER"><Input value={p.form_number||""} onChange={e=>set("form_number",e.target.value)}/></Field><Field label="OPPOSITION RECEIVED / FILING DATE"><Input type="date" value={p.form_date||""} onChange={e=>{set("form_date",e.target.value);set("due_date",calc(e.target.value,1))}}/></Field><Field label="REPLY DUE (+1 MONTH)"><Input type="date" value={p.due_date||calc(p.form_date||"",1)} onChange={e=>set("due_date",e.target.value)}/></Field></>}
      {(tab==="TM11"||tab==="TM16"||tab==="TM56")&&<Field label="SUBMISSION DATE"><Input type="date" value={p.form_date||""} onChange={e=>set("form_date",e.target.value)}/></Field>}
      {tab==="JOURNAL"&&<><Field label="JOURNAL NUMBER"><Input value={p.form_number||""} onChange={e=>set("form_number",e.target.value)}/></Field><Field label="PUBLICATION DATE"><Input type="date" value={p.form_date||""} onChange={e=>{set("form_date",e.target.value);set("due_date",calc(e.target.value,2))}}/></Field><Field label="OPPOSITION DEADLINE (+2 MONTHS)"><Input type="date" value={p.due_date||calc(p.form_date||"",2)} onChange={e=>set("due_date",e.target.value)}/></Field><Field label="APPLICATION / MARK"><Input value={p.application_name||""} onChange={e=>set("application_name",e.target.value)}/></Field><Field label="CLASS"><Input value={p.nice_class||""} onChange={e=>set("nice_class",e.target.value)}/></Field><Field label="DATE OF FILING"><Input type="date" value={p.filing_date||""} onChange={e=>set("filing_date",e.target.value)}/></Field></>}
      {tab==="GENERAL"&&<><Field label="GENERAL NUMBER"><Input value={p.form_number||""} onChange={e=>set("form_number",e.target.value)}/></Field><Field label="DATE"><Input type="date" value={p.form_date||""} onChange={e=>set("form_date",e.target.value)}/></Field><Field label="APPLICATION NAME"><Input value={p.application_name||""} onChange={e=>set("application_name",e.target.value)}/></Field><Field label="CLASS"><Input value={p.nice_class||""} onChange={e=>set("nice_class",e.target.value)}/></Field><Field label="APPLICANT NAME"><Input value={p.applicant_name||""} onChange={e=>set("applicant_name",e.target.value)}/></Field><Field label="AGENT NAME"><Input value={p.agent_name||""} onChange={e=>set("agent_name",e.target.value)}/></Field><Field label="DATE OF FILING"><Input type="date" value={p.filing_date||""} onChange={e=>set("filing_date",e.target.value)}/></Field><div><label className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">IMAGE (OPTIONAL)</label><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{setUploading(true);const r=await uploadImage(f);set("image_path",r.fileId)}catch(err){alert((err as Error).message)}finally{setUploading(false)}}}/><button type="button" disabled={uploading} onClick={()=>fileRef.current?.click()} className="mt-1 flex h-9 items-center gap-2 border-2 border-black bg-white px-3 font-mono text-xs"><ImagePlus className="h-4 w-4"/>{uploading?"UPLOADING…":p.image_path?"IMAGE ATTACHED":"ADD IMAGE"}</button></div></>}
    </div><div className="mt-4"><Field label="NOTES"><textarea value={p.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="w-full border-2 border-black bg-white p-2 font-mono text-xs"/></Field></div></div><div className="flex justify-end gap-3 border-t-2 border-black bg-[#E8DFC7] px-5 py-4"><button onClick={()=>setOpen(false)} className="h-10 border-2 border-black bg-white px-5 font-mono text-xs font-bold">CANCEL</button><button disabled={save.isPending} onClick={()=>save.mutate()} className="h-10 bg-[#C94A00] px-6 font-mono text-xs font-bold text-white">{save.isPending?"SAVING…":"SAVE ENTRY"}</button></div>{save.error&&<div className="border-t-2 border-red-700 bg-red-50 p-3 font-mono text-xs font-bold text-red-800">SAVE FAILED — {String((save.error as Error).message)}</div>}</div></div>}
  </div></div></AppShell>;
}
