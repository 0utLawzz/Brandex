import { listTrademarks } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateShort } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Filter, Flag, RotateCcw, Search, UserCheck, UserX, Users2, X } from "lucide-react";

const PAGE_SIZE = 40;
const RESPONSES = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"] as const;
const CONDITIONS = ["NORMAL", "COMPROMISED", "PROLONGED", "COURT / HEARING"] as const;

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  STOPPED: "bg-[#CC0000] text-white",
};

interface Assignment {
  id: string;
  trademark_id: string | null;
  agent_name: string | null;
  assigned_at: string | null;
  response_status: string | null;
  responded_at: string | null;
  notes: string | null;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 min-w-[130px] border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs focus:outline-2 focus:outline-[#C94A00]">
        <option value="">ALL</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users2 }) {
  return <div className="border-2 border-[#0C0C0C] bg-white p-3 shadow-[3px_3px_0_#0C0C0C]"><div className="flex items-center gap-2 text-[#6d6658]"><Icon className="h-4 w-4"/><span className="font-mono text-[9px] font-bold uppercase tracking-widest">{label}</span></div><div className="mt-1 font-serif text-3xl font-bold">{value}</div></div>;
}

export function AssignedPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [agent, setAgent] = useState("");
  const [stage, setStage] = useState("");
  const [subStage, setSubStage] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [response, setResponse] = useState("");
  const [condition, setCondition] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const { data: records = [], isLoading } = useQuery<TrademarkRecord[]>({ queryKey: ["trademarks"], queryFn: () => listTrademarks(), staleTime: 30_000 });
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["agent-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_assignments").select("id,trademark_id,agent_name,assigned_at,response_status,responded_at,notes").order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
    staleTime: 15_000,
  });

  const assignmentByTm = useMemo(() => {
    const m = new Map<string, Assignment>();
    for (const a of assignments) if (a.trademark_id && !m.has(a.trademark_id)) m.set(a.trademark_id, a);
    return m;
  }, [assignments]);

  const distinct = useMemo(() => ({
    agents: [...new Set(records.map(r => r.agent).filter(Boolean) as string[])].sort(),
    stages: [...new Set(records.map(r => r.stage).filter(Boolean) as string[])].sort(),
    subStages: [...new Set(records.map(r => r.subStage).filter(Boolean) as string[])].sort(),
  }), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(r => {
      const a = assignmentByTm.get(r.id);
      const status = a?.response_status || "PENDING";
      if (agent && r.agent !== agent) return false;
      if (stage && r.stage !== stage) return false;
      if (subStage && r.subStage !== subStage) return false;
      if (response && status !== response) return false;
      if (condition && (r.condition || "NORMAL") !== condition) return false;
      if (from && String(r.date || "") < from) return false;
      if (to && String(r.date || "") > to) return false;
      if (q && ![r.prefix, r.clientCode, r.caseNumber, r.appName, r.tmCprNo, r.agent].some(v => String(v ?? "").toLowerCase().includes(q))) return false;
      return true;
    }).sort((a,b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime());
  }, [records, assignmentByTm, agent, stage, subStage, response, condition, from, to, query]);

  const metrics = useMemo(() => {
    let accepted=0,rejected=0,completed=0,pending=0;
    for (const r of records) { const s=assignmentByTm.get(r.id)?.response_status || "PENDING"; if(s==="ACCEPTED")accepted++; else if(s==="REJECTED")rejected++; else if(s==="COMPLETED")completed++; else pending++; }
    return { assigned: records.filter(r => r.agent).length, accepted, rejected, completed, pending };
  }, [records, assignmentByTm]);

  const updateAssignment = useMutation({
    mutationFn: async ({ id, trademarkId, status, agentName }: { id?: string; trademarkId: string; status: string; agentName: string }) => {
      const payload = { trademark_id: trademarkId, agent_name: agentName || null, response_status: status, responded_at: status === "PENDING" ? null : new Date().toISOString() };
      if (id) { const { error } = await supabase.from("agent_assignments").update(payload).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("agent_assignments").insert(payload); if (error) throw error; }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-assignments"] }),
  });

  const updateCondition = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => { const { error } = await supabase.from("trademarks").update({ condition: value }).eq("id", id); if(error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trademarks"] }),
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const clear = () => { setAgent(""); setStage(""); setSubStage(""); setFrom(""); setTo(""); setResponse(""); setCondition(""); setQuery(""); setPage(1); };
  const hasFilters = Boolean(agent || stage || subStage || from || to || response || condition || query);

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Users2 className="h-5 w-5 text-[#0A6B52]" />
            <h1 className="font-serif text-2xl uppercase tracking-widest">AGENT CONTROL</h1>
            <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-[#6d6658]">{isLoading ? "LOADING…" : `${filtered.length} CASES`}</span>
            <button onClick={() => setShowFilters(v => !v)} className="flex h-9 items-center gap-2 border-2 border-[#0C0C0C] bg-white px-3 font-mono text-[10px] font-bold uppercase"><Filter className="h-4 w-4"/> FILTERS</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"><Metric label="Assigned" value={metrics.assigned} icon={Users2}/><Metric label="Accepted" value={metrics.accepted} icon={UserCheck}/><Metric label="Rejected" value={metrics.rejected} icon={UserX}/><Metric label="Completed" value={metrics.completed} icon={CheckCircle2}/><Metric label="Pending" value={metrics.pending} icon={Clock3}/></div>
          {showFilters && <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#0C0C0C]/20 pt-3">
            <div className="flex flex-col gap-1"><label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">SEARCH</label><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-[#6d6658]"/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Case / mark / TM…" className="h-9 w-[220px] border-2 border-[#0C0C0C] bg-white pl-8 pr-2 font-mono text-xs"/></div></div>
            <FilterSelect label="AGENT" value={agent} options={distinct.agents} onChange={v=>{setAgent(v);setPage(1)}}/>
            <FilterSelect label="STAGE" value={stage} options={distinct.stages} onChange={v=>{setStage(v);setPage(1)}}/>
            <FilterSelect label="SUB-STAGE" value={subStage} options={distinct.subStages} onChange={v=>{setSubStage(v);setPage(1)}}/>
            <FilterSelect label="ASSIGNMENT" value={response} options={[...RESPONSES]} onChange={v=>{setResponse(v);setPage(1)}}/>
            <FilterSelect label="CONDITION" value={condition} options={[...CONDITIONS]} onChange={v=>{setCondition(v);setPage(1)}}/>
            <div className="flex flex-col gap-1"><label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">DATE FROM</label><input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1)}} className="h-9 border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs"/></div>
            <div className="flex flex-col gap-1"><label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">DATE TO</label><input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(1)}} className="h-9 border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs"/></div>
            {hasFilters && <button onClick={clear} className="flex h-9 items-center gap-1 border-2 border-[#CC0000] px-3 font-mono text-[10px] font-bold text-[#CC0000]"><X className="h-3 w-3"/> CLEAR</button>}
          </div>}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse whitespace-nowrap font-mono text-xs">
            <thead className="sticky top-0 z-10 bg-[#0C0C0C] text-[#F0E8D0]"><tr>{["CASE","MARK / APPLICATION","TM / CPR","STAGE","SUB-STAGE","AGENT","ASSIGNMENT","DATE","FLAG"].map(h=><th key={h} className="px-3 py-3 text-left text-[9px] font-bold tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{isLoading ? <tr><td colSpan={9} className="p-12 text-center font-mono font-bold text-[#6d6658]">LOADING…</td></tr> : paged.length===0 ? <tr><td colSpan={9} className="p-12 text-center font-mono text-[#6d6658]">NO CASES MATCH THE CURRENT FILTERS.</td></tr> : paged.map((r,i)=>{
              const a=assignmentByTm.get(r.id); const s=a?.response_status || "PENDING"; const c=r.condition || "NORMAL"; const flagged=c!=="NORMAL" || r.isProlonged;
              return <tr key={r.id} onClick={()=>navigate(`/record/${r.id}`)} className={`cursor-pointer border-b border-black/10 ${flagged?"bg-red-50":i%2?"bg-white":"bg-[#F0E8D0]"} hover:bg-[#D9D0B7]`}>
                <td className="px-3 py-2 font-bold text-[#0A6B52]">{r.prefix ? `${r.prefix} · ` : ""}{r.clientCode || ""}{r.caseNumber ? ` · ${r.caseNumber}` : ""}</td>
                <td className="max-w-[250px] truncate px-3 py-2 font-semibold">{r.appName || "—"}</td>
                <td className="px-3 py-2 font-bold">{r.tmCprNo || "—"}</td>
                <td className="px-3 py-2"><span className={`inline-block px-2 py-1 text-[9px] font-bold ${STAGE_BADGE[r.stage]||"bg-black text-white"}`}>{r.stage||"—"}</span></td>
                <td className="max-w-[190px] truncate px-3 py-2">{r.subStage||"—"}</td>
                <td className="px-3 py-2 font-bold">{r.agent||"UNASSIGNED"}</td>
                <td className="px-3 py-2" onClick={e=>e.stopPropagation()}><select value={s} onChange={e=>updateAssignment.mutate({id:a?.id,trademarkId:r.id,status:e.target.value,agentName:r.agent||""})} className="h-8 border border-[#0C0C0C] bg-white px-1 text-[9px] font-bold"><option>PENDING</option><option>ACCEPTED</option><option>REJECTED</option><option>COMPLETED</option></select></td>
                <td className="px-3 py-2 text-[#6d6658]">{formatDateShort(r.date)}</td>
                <td className="px-3 py-2" onClick={e=>e.stopPropagation()}><button title="Set case flag" onClick={()=>{const next=c==="NORMAL"?"COMPROMISED":"NORMAL";updateCondition.mutate({id:r.id,value:next})}} className={`inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-bold ${flagged?"border-red-800 text-red-800 bg-red-50":"border-black/30"}`}><Flag className="h-3 w-3"/>{c}</button></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {totalPages>1 && <div className="shrink-0 flex items-center justify-between border-t-2 border-[#0C0C0C] bg-[#E8DFC7] px-5 py-3 font-mono text-[10px] font-bold uppercase"><span>PAGE {page} OF {totalPages} · {filtered.length} CASES</span><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="border-2 border-[#0C0C0C] bg-white px-3 py-1.5 disabled:opacity-40">PREV</button><button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="border-2 border-[#0C0C0C] bg-white px-3 py-1.5 disabled:opacity-40">NEXT</button></div></div>}
      </div>
    </AppShell>
  );
}
