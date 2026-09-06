import { listTrademarks, STAGES, CITIES, deleteTrademark } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { formatDateShort } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, CheckSquare, Database, Filter, Plus, Search, Trash2, X } from "lucide-react";

const PAGE_SIZE = 50;

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-emerald-700 text-white",
  "STAGE 2": "bg-amber-500 text-black",
  "STAGE 3": "bg-orange-700 text-white",
  "STAGE 4": "bg-teal-800 text-white",
  STOPPED: "bg-red-800 text-white",
};

const TM_FIELDS = ["tm5", "tm6", "tm11", "tm16", "tm56"] as const;

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { out.push(value); value = ""; }
    else value += ch;
  }
  out.push(value);
  return out;
}

export function DatabasePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [agent, setAgent] = useState("");
  const [city, setCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);

  const { data: records = [], isLoading, isFetching } = useQuery<TrademarkRecord[]>({
    queryKey: ["trademarks"],
    queryFn: () => listTrademarks(),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => !stage || r.stage === stage)
      .filter((r) => !agent || r.agent === agent)
      .filter((r) => !city || r.city === city)
      .filter((r) => !q || [r.prefix, r.clientCode, r.caseNumber, r.appName, r.tmCprNo, r.appClass, r.agent]
        .some((v) => String(v ?? "").toLowerCase().includes(q)))
      .sort((a, b) => {
        const prefix = a.prefix.localeCompare(b.prefix, undefined, { numeric: true });
        if (prefix) return prefix;
        const client = a.clientCode.localeCompare(b.clientCode, undefined, { numeric: true });
        if (client) return client;
        return a.caseNumber.localeCompare(b.caseNumber, undefined, { numeric: true });
      });
  }, [records, query, stage, agent, city]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageRows.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const agents = useMemo(() => [...new Set(records.map((r) => r.agent).filter(Boolean))].sort(), [records]);
  const clearFilters = () => { setQuery(""); setStage(""); setAgent(""); setCity(""); setPage(1); };

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const togglePage = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allPageSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    return next;
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      for (const id of selected) await deleteTrademark(id);
    },
    onSuccess: async () => {
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ["trademarks"] });
    },
  });

  const exportCsv = () => {
    const rows = selected.size ? filtered.filter((r) => selected.has(r.id)) : filtered;
    const headers = ["ID", "DATE", "PREFIX", "CLIENT CODE", "CASE NUMBER", "APPLICATION NAME", "TM/CPR NUMBER", "CLASS", "STATUS", "SUB STATUS", "CASE TYPE", "AGENT", "CITY", "TM5", "TM6", "TM11", "TM16", "TM56", "JOURNAL NUMBER", "JOURNAL DATE"];
    const body = rows.map((r) => [r.id, r.date, r.prefix, r.clientCode, r.caseNumber, r.appName, r.tmCprNo, r.appClass, r.stage, r.subStage, r.caseType, r.agent, r.city, r.tm5, r.tm6, r.tm11, r.tm16, r.tm56, r.journalNumber, r.journalDate].map(csvCell).join(","));
    const blob = new Blob([[headers.map(csvCell).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `brandex-datasheet-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const readImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;
    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
    const rows = lines.slice(1).map((line) => {
      const cells = parseCsvLine(line); return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    });
    setImportPreview(rows.slice(0, 8));
  };

  const confirmImport = async () => {
    if (!importPreview.length) return;
    const payload = importPreview.map((r) => ({
      id: r.ID || crypto.randomUUID(), filing_date: r.DATE || null, prefix: r.PREFIX || r.TYPE || "X",
      client_code: r["CLIENT CODE"] || null, case_number: r["CASE NUMBER"] || null,
      application_name: r["APPLICATION NAME"] || null, tm_cpr_number: r["TM/CPR NUMBER"] || null,
      nice_class: r.CLASS || null, status: r.STATUS || "STAGE 1", sub_status: r["SUB STATUS"] || null,
      case_type: r["CASE TYPE"] || null, agent: r.AGENT || null, city: r.CITY || null,
      tm5: r.TM5 === "YES", tm6: r.TM6 === "YES", tm11: r.TM11 === "YES", tm16: r.TM16 === "YES", tm56: r.TM56 === "YES",
      journal_number: r["JOURNAL NUMBER"] || null, journal_date: r["JOURNAL DATE"] || null,
    }));
    const { error } = await supabase.from("trademarks").upsert(payload, { onConflict: "id" });
    if (error) { alert(error.message); return; }
    setImportPreview([]);
    await queryClient.invalidateQueries({ queryKey: ["trademarks"] });
  };

  const hasFilters = Boolean(query || stage || agent || city);

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Database className="h-5 w-5 text-[#0A6B52]" />
            <h1 className="mr-auto font-serif text-2xl uppercase tracking-widest">DATABASE</h1>
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#6d6658]">{isLoading || isFetching ? "SYNCING…" : `${filtered.length} RECORDS`}</span>
            <button onClick={() => setShowFilters((v) => !v)} className="flex h-9 items-center gap-2 border-2 border-[#0C0C0C] bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider"><Filter className="h-4 w-4" /> FILTER</button>
            <button onClick={exportCsv} className="flex h-9 items-center gap-2 border-2 border-[#0C0C0C] bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider"><ArrowDownToLine className="h-4 w-4" /> EXPORT{selected.size ? ` (${selected.size})` : ""}</button>
            <button onClick={() => fileRef.current?.click()} className="flex h-9 items-center gap-2 border-2 border-[#0C0C0C] bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider"><ArrowUpFromLine className="h-4 w-4" /> IMPORT</button>
            <input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && readImport(e.target.files[0])} />
            <button onClick={() => setModalOpen(true)} className="flex h-9 items-center gap-2 bg-[#C94A00] px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white"><Plus className="h-4 w-4" /> ADD</button>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6d6658]" /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search prefix, client code, mark, TM number…" className="h-9 w-full border-2 border-[#0C0C0C] bg-white pl-9 pr-3 font-mono text-xs outline-none" /></div>
            {hasFilters && <button onClick={clearFilters} className="flex h-9 items-center gap-1 border-2 border-red-800 px-3 font-mono text-[10px] font-bold text-red-800"><X className="h-3 w-3" /> CLEAR</button>}
          </div>
          {showFilters && <div className="mt-3 flex flex-wrap gap-2 border-t border-[#0C0C0C]/20 pt-3">
            <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="h-9 border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs"><option value="">ALL STATUS</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
            <select value={agent} onChange={(e) => { setAgent(e.target.value); setPage(1); }} className="h-9 border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs"><option value="">ALL AGENTS</option>{agents.map((a) => <option key={a}>{a}</option>)}</select>
            <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} className="h-9 border-2 border-[#0C0C0C] bg-white px-2 font-mono text-xs"><option value="">ALL CITIES</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>}
        </div>

        {selected.size > 0 && <div className="flex shrink-0 items-center gap-3 border-b border-red-900/20 bg-red-50 px-5 py-2 font-mono text-[10px] font-bold uppercase"><CheckSquare className="h-4 w-4" /> {selected.size} SELECTED <button disabled={bulkDelete.isPending} onClick={() => bulkDelete.mutate()} className="ml-auto flex items-center gap-1 border border-red-800 px-3 py-1.5 text-red-800"><Trash2 className="h-3 w-3" /> BULK DELETE</button></div>}

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse whitespace-nowrap font-mono text-xs">
            <thead className="sticky top-0 z-10 bg-[#0C0C0C] text-[#F0E8D0]"><tr>
              <th className="w-10 px-3 py-3"><input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Select page" /></th>
              {['DATE','PREFIX','CLIENT CODE','CASE/FOLDER','MARK / APPLICATION','TM / CPR NUMBER','CLASS','STATUS','SUB STATUS','AGENT','CITY','STAGES'].map((h) => <th key={h} className="px-3 py-3 text-left text-[9px] font-bold tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {pageRows.map((tm, i) => {
                const compromised = tm.condition && tm.condition !== "NORMAL";
                return <tr key={tm.id} onClick={() => navigate(`/record/${tm.id}`)} className={`cursor-pointer border-b border-black/10 ${compromised ? 'bg-red-50' : i % 2 ? 'bg-white' : 'bg-[#F0E8D0]'} hover:bg-[#D9D0B7]`}>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(tm.id)} onChange={() => toggle(tm.id)} /></td>
                  <td className="px-3 py-2 text-[#6d6658]">{formatDateShort(tm.date)}</td>
                  <td className="px-3 py-2 font-bold">{tm.prefix}</td>
                  <td className="px-3 py-2 font-bold">{tm.clientCode}</td>
                  <td className="px-3 py-2">{tm.caseNumber || "—"}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 font-semibold">{tm.appName || "—"}</td>
                  <td className="px-3 py-2 font-bold">{tm.tmCprNo || "—"}</td>
                  <td className="px-3 py-2">{tm.appClass || "—"}</td>
                  <td className="px-3 py-2"><span className={`inline-flex px-2 py-1 text-[9px] font-bold ${STAGE_BADGE[tm.stage] ?? 'bg-black text-white'}`}>{tm.stage || "—"}</span></td>
                  <td className="max-w-[170px] truncate px-3 py-2">{tm.subStage || "—"}</td>
                  <td className="px-3 py-2">{tm.agent || "—"}</td>
                  <td className="px-3 py-2">{tm.city || "—"}</td>
                  <td className="px-3 py-2"><div className="flex gap-1">{TM_FIELDS.map((f) => <span key={f} title={f.toUpperCase()} className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${tm[f] === 'YES' ? 'bg-[#0A6B52] text-white' : 'bg-black/10 text-black/40'}`}>{f.replace('tm','TM')}</span>)}</div></td>
                </tr>;
              })}
            </tbody>
          </table>
          {!isLoading && pageRows.length === 0 && <div className="p-16 text-center font-mono text-xs font-bold text-[#6d6658]">NO RECORDS FOUND</div>}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t-2 border-[#0C0C0C] bg-[#E8DFC7] px-5 py-2 font-mono text-[10px] font-bold uppercase"><span>PAGE {page} / {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-black px-3 py-1 disabled:opacity-30">PREV</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="border border-black px-3 py-1 disabled:opacity-30">NEXT</button></div></div>
      </div>

      {modalOpen && <RecordModal isNew onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ["trademarks"] }); }} />}
      {importPreview.length > 0 && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"><div className="w-full max-w-4xl border-2 border-black bg-white p-5"><div className="mb-3 flex items-center"><h2 className="font-serif text-xl uppercase tracking-wider">IMPORT PREVIEW</h2><button onClick={() => setImportPreview([])} className="ml-auto"><X /></button></div><p className="mb-3 font-mono text-xs">Previewing first {importPreview.length} rows. Confirm to import this preview into the canonical database.</p><div className="max-h-80 overflow-auto border"><table className="w-full font-mono text-[10px]"><tbody>{importPreview.map((r, i) => <tr key={i} className="border-b">{Object.entries(r).slice(0, 8).map(([k,v]) => <td key={k} className="p-2"><b>{k}:</b> {v}</td>)}</tr>)}</tbody></table></div><div className="mt-4 flex justify-end gap-2"><button onClick={() => setImportPreview([])} className="border-2 border-black px-4 py-2 font-mono text-xs font-bold">CANCEL</button><button onClick={confirmImport} className="bg-[#0A6B52] px-4 py-2 font-mono text-xs font-bold text-white">IMPORT PREVIEW</button></div></div></div>}
    </AppShell>
  );
}
