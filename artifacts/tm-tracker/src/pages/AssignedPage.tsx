import { listTrademarks } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateShort } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Users2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 50;

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
};

interface Filters {
  agent:    string;
  city:     string;
  stage:    string;
  appClass: string;
}

const EMPTY: Filters = { agent: "", city: "", stage: "", appClass: "" };

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[130px]"
      >
        <option value="">ALL</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function AssignedPage() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  const { data: allRecords = [], isLoading } = useQuery<TrademarkRecord[]>({
    queryKey: ["trademarks"],
    queryFn:  () => listTrademarks(),
    staleTime: 60_000,
  });

  // Build distinct options from live data
  const distinct = useMemo(() => {
    const agents  = new Set<string>();
    const cities  = new Set<string>();
    const stages  = new Set<string>();
    const classes = new Set<string>();
    for (const r of allRecords) {
      if (r.agent)    agents.add(r.agent);
      if (r.city)     cities.add(r.city);
      if (r.stage)    stages.add(r.stage);
      if (r.appClass) classes.add(r.appClass);
    }
    return {
      agents:  [...agents].sort(),
      cities:  [...cities].sort(),
      stages:  [...stages].sort(),
      classes: [...classes].sort((a, b) => Number(a) - Number(b)),
    };
  }, [allRecords]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (!r.id || !r.id.trim()) return false;
      if (filters.agent    && r.agent    !== filters.agent)    return false;
      if (filters.city     && r.city     !== filters.city)     return false;
      if (filters.stage    && r.stage    !== filters.stage)    return false;
      if (filters.appClass && r.appClass !== filters.appClass) return false;
      return true;
    });
  }, [allRecords, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dA = new Date(a.updatedAt || a.date || 0).getTime();
      const dB = new Date(b.updatedAt || b.date || 0).getTime();
      return dB - dA;
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Object.values(filters).some(Boolean);

  const setFilter = (key: keyof Filters, val: string) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const goToRecord = (id: string) => navigate(`/record/${id}`);

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-white">
        {/* Toolbar */}
        <div className="shrink-0 px-6 py-4 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <div className="flex items-center gap-3 mb-4">
            <Users2 className="w-5 h-5 text-[#0A6B52]" />
            <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] leading-none">ASSIGNED</h1>
            <span className="ml-auto font-mono text-[10px] text-[#6d6658] font-bold uppercase tracking-widest">
              {isLoading ? "LOADING…" : `${sorted.length} RECORDS`}
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              label="AGENT"
              value={filters.agent}
              options={distinct.agents}
              onChange={(v) => setFilter("agent", v)}
            />
            <FilterSelect
              label="CITY"
              value={filters.city}
              options={distinct.cities}
              onChange={(v) => setFilter("city", v)}
            />
            <FilterSelect
              label="STATUS"
              value={filters.stage}
              options={distinct.stages}
              onChange={(v) => setFilter("stage", v)}
            />
            <FilterSelect
              label="CLASS"
              value={filters.appClass}
              options={distinct.classes}
              onChange={(v) => setFilter("appClass", v)}
            />
            {hasFilters && (
              <button
                onClick={() => { setFilters(EMPTY); setPage(1); }}
                className="self-end flex items-center gap-1.5 h-9 px-4 border-2 border-[#CC0000] text-[#CC0000] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
              <tr>
                {["CASE NUMBER", "CLIENT", "APPLICATION NAME", "TM/CPR NUMBER", "CLASS", "STATUS", "SUB-STATUS", "CITY", "AGENT", "DATE"].map((h) => (
                  <th key={h} className="px-3 py-3 border-r border-[#1A1A1A] font-bold tracking-wider uppercase text-[10px] last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center font-bold text-[#6d6658] animate-pulse">
                    LOADING RECORDS FROM GOOGLE SHEETS…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="font-mono font-bold text-[#6d6658] uppercase tracking-widest mb-1">
                      No records found.
                    </div>
                    {hasFilters && (
                      <div className="font-mono text-xs text-[#9d9488]">
                        Try changing your filters.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => goToRecord(r.id)}
                    className={`cursor-pointer border-b border-[#0C0C0C]/10 transition-colors ${
                      i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-white"
                    } hover:bg-[#D9D0B7]`}
                  >
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">
                      {r.caseNumber || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[140px]">
                      <div className="font-bold truncate">{r.clientName || "—"}</div>
                      <div className="text-[#6d6658] text-[10px]">{r.clientCode}</div>
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[200px] truncate">
                      {r.appName || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">
                      {r.tmCprNo || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                      {r.appClass || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                      {r.stage && (
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#0C0C0C]/20 ${STAGE_BADGE[r.stage] ?? "bg-[#E8DFC7]"}`}>
                          {r.stage}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658] max-w-[120px] truncate">
                      {r.subStage || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                      {r.city || "—"}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">
                      {r.agent || "—"}
                    </td>
                    <td className="px-3 py-2 text-[#6d6658]">
                      {formatDateShort(r.date)}
                    </td>
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
    </AppShell>
  );
}
