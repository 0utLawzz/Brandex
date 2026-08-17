import { listTrademarks } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { formatDateShort } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Plus, Filter, X, ChevronLeft, ChevronRight, Database as DatabaseIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 50;

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
};

const TABLE_HEADERS = [
  "DATE", "TYPE", "CLIENT CODE", "CLIENT NAME", "CASE NUMBER",
  "APPLICATION NAME", "STATUS", "SUB-STATUS", "TM/CPR NUMBER",
  "CLASS", "CASE TYPE", "AGENT", "CITY", "LAST MODIFIED",
];

interface Filters {
  date: string;
  type: string;
  clientCode: string;
  stage: string;
  subStage: string;
  appClass: string;
  caseType: string;
  city: string;
  agent: string;
}

const EMPTY_FILTERS: Filters = {
  date: "", type: "", clientCode: "", stage: "", subStage: "",
  appClass: "", caseType: "", city: "", agent: "",
};

export function DatabasePage() {
  const [location, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Open modal if ?new=1 query param present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setModalOpen(true);
    }
  }, [location]);

  const { data: allTrademarks = [], isLoading, isFetching } = useQuery<TrademarkRecord[]>({
    queryKey: ["trademarks"],
    queryFn: () => listTrademarks(),
    staleTime: 60_000,
  });

  // Build distinct dropdown options from live data
  const distinct = useMemo(() => {
    const stages    = new Set<string>();
    const cities    = new Set<string>();
    const caseTypes = new Set<string>();
    const agents    = new Set<string>();
    const classes   = new Set<string>();
    const types     = new Set<string>();
    for (const tm of allTrademarks) {
      if (tm.stage)    stages.add(tm.stage);
      if (tm.city)     cities.add(tm.city);
      if (tm.caseType) caseTypes.add(tm.caseType);
      if (tm.agent)    agents.add(tm.agent);
      if (tm.appClass) classes.add(tm.appClass);
      if (tm.type)     types.add(tm.type);
    }
    return {
      stages:    [...stages].sort(),
      cities:    [...cities].sort(),
      caseTypes: [...caseTypes].sort(),
      agents:    [...agents].sort(),
      classes:   [...classes].sort((a, b) => Number(a) - Number(b)),
      types:     [...types].sort(),
    };
  }, [allTrademarks]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return allTrademarks.filter((tm) => {
      if (!tm.id || !tm.id.trim()) return false; // defensive: skip blank rows
      if (filters.date      && !tm.date?.startsWith(filters.date))                                  return false;
      if (filters.type      && tm.type !== filters.type)                                             return false;
      if (filters.clientCode && !tm.clientCode?.toLowerCase().includes(filters.clientCode.toLowerCase())) return false;
      if (filters.stage     && tm.stage !== filters.stage)                                           return false;
      if (filters.subStage  && !tm.subStage?.toLowerCase().includes(filters.subStage.toLowerCase())) return false;
      if (filters.appClass  && tm.appClass !== filters.appClass)                                     return false;
      if (filters.caseType  && tm.caseType !== filters.caseType)                                     return false;
      if (filters.city      && tm.city !== filters.city)                                             return false;
      if (filters.agent     && tm.agent !== filters.agent)                                           return false;
      return true;
    });
  }, [allTrademarks, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dA = new Date(a.updatedAt || a.date || 0).getTime();
      const dB = new Date(b.updatedAt || b.date || 0).getTime();
      return dB - dA;
    });
  }, [filtered]);

  const hasFilters  = Object.values(filters).some(Boolean);
  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged       = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNew    = () => setModalOpen(true);
  const closeModal = () => { setModalOpen(false); navigate("/database"); };
  const setFilter  = (key: keyof Filters, val: string) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); };

  const goToRecord = (id: string) => navigate(`/record/${id}`);

  const colSpan = TABLE_HEADERS.length;

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-white">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <DatabaseIcon className="w-5 h-5 text-[#0A6B52] hidden sm:block" />
          <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] leading-none mr-auto">DATABASE</h1>
          <span className="font-mono text-[10px] text-[#6d6658] font-bold uppercase tracking-widest hidden md:inline">
            {isLoading || isFetching ? "LOADING..." : `${sorted.length} RECORDS`}
          </span>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 h-10 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider transition-colors ${
              showFilters || hasFilters ? "bg-[#0C0C0C] text-[#F0E8D0]" : "bg-white"
            }`}
          >
            <Filter className="w-4 h-4" /> FILTERS{hasFilters ? " ●" : ""}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 h-10 bg-[#C94A00] text-white border-2 border-[#C94A00] font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> ADD RECORD
          </button>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="shrink-0 flex flex-wrap items-end gap-3 px-6 py-4 bg-[#F0E8D0] border-b-2 border-[#0C0C0C] transition-all">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">DATE</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilter("date", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00]"
              />
            </div>
            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">TYPE</label>
              <select
                value={filters.type}
                onChange={(e) => setFilter("type", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[80px]"
              >
                <option value="">ALL</option>
                {distinct.types.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {/* Client Code */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">CLIENT CODE</label>
              <input
                type="text"
                placeholder="Code..."
                value={filters.clientCode}
                onChange={(e) => setFilter("clientCode", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] w-[100px]"
              />
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">STATUS</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilter("stage", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[120px]"
              >
                <option value="">ALL</option>
                {distinct.stages.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {/* Class */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">CLASS</label>
              <select
                value={filters.appClass}
                onChange={(e) => setFilter("appClass", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[80px]"
              >
                <option value="">ALL</option>
                {distinct.classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Case Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">CASE TYPE</label>
              <select
                value={filters.caseType}
                onChange={(e) => setFilter("caseType", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[120px]"
              >
                <option value="">ALL</option>
                {distinct.caseTypes.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {/* Agent */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">AGENT</label>
              <select
                value={filters.agent}
                onChange={(e) => setFilter("agent", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[120px]"
              >
                <option value="">ALL</option>
                {distinct.agents.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">CITY</label>
              <select
                value={filters.city}
                onChange={(e) => setFilter("city", e.target.value)}
                className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[120px]"
              >
                <option value="">ALL</option>
                {distinct.cities.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-4 border-2 border-[#CC0000] text-[#CC0000] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" /> CLEAR FILTERS
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
              <tr>
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className="px-3 py-3 border-r border-[#1A1A1A] font-bold tracking-wider uppercase text-[10px] last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center font-bold text-[#6d6658] animate-pulse">
                    LOADING RECORDS FROM GOOGLE SHEETS…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center font-bold text-[#6d6658]">
                    {hasFilters
                      ? "NO RECORDS MATCH THE CURRENT FILTERS. TRY CLEARING FILTERS."
                      : "NO RECORDS FOUND."}
                  </td>
                </tr>
              ) : (
                paged.map((tm, i) => (
                  <tr
                    key={tm.id}
                    onClick={() => goToRecord(tm.id)}
                    className={`cursor-pointer border-b border-[#0C0C0C]/10 transition-colors ${
                      i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-white"
                    } hover:bg-[#D9D0B7]`}
                  >
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658]">{formatDateShort(tm.date)}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#C94A00]">{tm.type || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">{tm.clientCode || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[140px] truncate">{tm.clientName || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">{tm.caseNumber || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[180px] truncate">{tm.appName || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                      {tm.stage && (
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#0C0C0C]/20 ${STAGE_BADGE[tm.stage] ?? "bg-[#E8DFC7]"}`}>
                          {tm.stage}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658] max-w-[120px] truncate">{tm.subStage || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">{tm.tmCprNo || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{tm.appClass || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{tm.caseType || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[100px] truncate">{tm.agent || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{tm.city || "—"}</td>
                    <td className="px-3 py-2 text-[#6d6658]">{formatDateShort(tm.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-[#E8DFC7] border-t-2 border-[#0C0C0C]">
            <span className="font-mono text-[10px] text-[#6d6658] font-bold uppercase tracking-widest">
              PAGE {page} OF {totalPages} · {sorted.length} RECORDS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border-2 border-[#0C0C0C] bg-white font-mono text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> PREV
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border-2 border-[#0C0C0C] bg-white font-mono text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
              >
                NEXT <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Record Modal */}
      {modalOpen && (
        <RecordModal
          isNew
          onClose={closeModal}
          onSaved={() => closeModal()}
        />
      )}
    </AppShell>
  );
}
