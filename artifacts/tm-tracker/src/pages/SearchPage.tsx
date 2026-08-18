import { listTrademarks, searchTm, STAGES, CITIES } from "@/lib/api";
import type { TrademarkRecord, TmSearchResult } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateShort } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  SearchIcon, X, Filter, CheckCircle2, MinusCircle,
  ArrowRight, AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── TM Result Card ────────────────────────────────────────────────────────────

function TmCard({ result, onViewRecord }: {
  result: TmSearchResult;
  onViewRecord: (id: string) => void;
}) {
  const { records, tmMatches, journal } = result;

  if (records.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#0C0C0C]/30 p-6 bg-[#F0E8D0] flex flex-col items-center gap-3 text-center animate-in fade-in duration-200">
        <AlertCircle className="w-8 h-8 text-[#9d9488]" />
        <div className="font-mono font-bold text-sm text-[#6d6658] uppercase tracking-widest">
          No trademark record found.
        </div>
        <div className="font-mono text-xs text-[#9d9488]">
          The TM number was not found in the DATABASE.
        </div>
        {/* Still show TM sheet matches */}
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          {(["TM5", "TM6", "TM11", "TM16", "TM56"] as const).map((s) => (
            <span
              key={s}
              className={`flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-bold border-2 ${
                tmMatches[s]
                  ? "border-[#0A6B52] text-[#0A6B52] bg-[#0D9970]/10"
                  : "border-[#0C0C0C]/20 text-[#9d9488] bg-white"
              }`}
            >
              {tmMatches[s] ? <CheckCircle2 className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
      {records.map((rec) => (
        <div
          key={rec.id}
          className="border-2 border-[#0C0C0C] bg-white shadow-[4px_4px_0_#0C0C0C]"
        >
          {/* Card Header: Orange / Prominent Application Name + Clearly visible TM Number */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-[#0C0C0C] text-[#F0E8D0] border-b-2 border-[#0C0C0C]">
            <div>
              <div className="font-mono text-xs font-bold text-[#E8DFC7] uppercase tracking-widest flex items-center gap-2">
                <span>TM NO:</span>
                <span className="text-white text-sm bg-[#1A1A1A] px-2 py-0.5 border border-[#333]">
                  {rec.tmCprNo || ""}
                </span>
                {rec.type && (
                  <span className="text-[#D4A800] text-[10px] uppercase ml-1">
                    ({rec.type})
                  </span>
                )}
              </div>
              <div className="font-serif text-2xl uppercase tracking-wide leading-tight text-[#C94A00] mt-1">
                {rec.appName || ""}
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span className="font-mono text-xs font-bold text-[#0D9970] bg-[#0D9970]/20 px-2.5 py-1 border border-[#0D9970]/40">
                ✓ FOUND
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-4 py-4 space-y-4">
            {/* Visual Hierarchy: Client Code & Case Number & Status */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              {/* Visually enhanced Case Number */}
              <div className="flex items-center gap-1 bg-[#0D9970]/10 border-2 border-[#0A6B52] px-2.5 py-1 text-[#0A6B52] font-bold">
                <span className="text-[9px] uppercase tracking-wider opacity-80">CASE:</span>
                <span className="text-xs">{rec.caseNumber || ""}</span>
              </div>

              {/* Visually enhanced Client Code */}
              <div className="flex items-center gap-1 bg-[#E8DFC7] border-2 border-[#0C0C0C] px-2.5 py-1 text-[#0C0C0C] font-bold">
                <span className="text-[9px] uppercase tracking-wider opacity-80">CLIENT:</span>
                <span className="text-xs">{rec.clientCode || ""}</span>
              </div>

              {/* Client Name */}
              {rec.clientName && (
                <span className="font-bold text-[#0C0C0C] max-w-[200px] truncate">
                  {rec.clientName}
                </span>
              )}

              {rec.appClass && (
                <span className="border border-[#0C0C0C]/30 px-2 py-0.5 text-[#0C0C0C] font-bold bg-[#F0E8D0]">
                  Class {rec.appClass}
                </span>
              )}

              {rec.city && (
                <span className="text-[#6d6658]">
                  {rec.city}
                </span>
              )}
            </div>

            {/* Highly Prominent Status & Sub Status */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#0C0C0C]/10">
              {rec.stage && (
                <span className={`inline-block px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#0C0C0C] shadow-[2px_2px_0_#0C0C0C] ${STAGE_BADGE[rec.stage] ?? "bg-[#E8DFC7]"}`}>
                  {rec.stage}
                </span>
              )}
              {rec.subStage && (
                <span className="inline-block px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#0C0C0C] text-[#0C0C0C] bg-[#F0E8D0]">
                  {rec.subStage}
                </span>
              )}
            </div>

            {/* TM Sheet Matches */}
            <div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-1.5">
                Document Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["TM5", "TM6", "TM11", "TM16", "TM56"] as const).map((s) => (
                  <span
                    key={s}
                    className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-bold border-2 ${
                      tmMatches[s]
                        ? "border-[#0A6B52] text-[#0A6B52] bg-[#0D9970]/10"
                        : "border-[#0C0C0C]/20 text-[#9d9488] bg-[#F0E8D0]"
                    }`}
                  >
                    {tmMatches[s] ? <CheckCircle2 className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Journal */}
            {journal ? (
              <div className="border-2 border-[#0A6B52] bg-[#0D9970]/5 px-3 py-2">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#0A6B52] mb-1">
                  <CheckCircle2 className="w-3 h-3" /> JOURNAL FOUND
                </div>
                <div className="font-mono text-xs text-[#0C0C0C] space-x-3">
                  <span>Journal No: <strong>{String(journal["Journal No"] || "")}</strong></span>
                  <span>Date: <strong>{journal["Journal Date"] ? formatDateShort(journal["Journal Date"] as string) : ""}</strong></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#9d9488]">
                <MinusCircle className="w-3 h-3" /> No published journal record found.
              </div>
            )}

            {/* View Record button */}
            <div className="pt-1">
              <button
                onClick={() => onViewRecord(rec.id)}
                className="flex items-center gap-2 px-4 py-2 bg-[#C94A00] text-white font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all border-2 border-[#C94A00]"
              >
                VIEW RECORD <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SearchPage ────────────────────────────────────────────────────────────────

export function SearchPage() {
  const [, navigate] = useLocation();

  // TM number search
  const [tmQuery, setTmQuery] = useState("");
  const debouncedTmQuery = useDebounce(tmQuery.trim(), 500);
  const isTmSearch = debouncedTmQuery.length > 0;

  // General text search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // General filters
  const [stageFilter,    setStageFilter]    = useState("");
  const [cityFilter,     setCityFilter]     = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState("");
  const [agentFilter,    setAgentFilter]    = useState("");
  const [showFilters,    setShowFilters]    = useState(false);

  const hasFilters  = Boolean(stageFilter || cityFilter || caseTypeFilter || agentFilter);
  const hasGenSearch = debouncedQuery.trim().length > 0 || hasFilters;

  // TM Number search query
  const { data: tmResult, isLoading: tmLoading, error: tmError } = useQuery<TmSearchResult>({
    queryKey: ["search-tm", debouncedTmQuery],
    queryFn: () => searchTm(debouncedTmQuery),
    enabled: isTmSearch,
    staleTime: 30_000,
  });

  // General search query
  const { data: generalResults = [], isLoading: genLoading, isFetching: genFetching } = useQuery<TrademarkRecord[]>({
    queryKey: ["trademarks-search", debouncedQuery, stageFilter, cityFilter, caseTypeFilter, agentFilter],
    queryFn: () =>
      listTrademarks({
        search:    debouncedQuery.trim() || undefined,
        stage:     stageFilter    || undefined,
        city:      cityFilter     || undefined,
        caseType:  caseTypeFilter || undefined,
        agent:     agentFilter    || undefined,
      }),
    enabled: hasGenSearch,
    staleTime: 30_000,
  });

  const goToRecord = (id: string) => navigate(`/record/${id}`);
  const clearAll   = () => {
    setQuery(""); setStageFilter(""); setCityFilter(""); setCaseTypeFilter(""); setAgentFilter("");
  };
  const clearTm = () => setTmQuery("");

  const STAGES     = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"];
  const CITIES     = ["Islamabad", "Karachi", "Lahore", "Peshawar", "Multan", "Quetta"];
  const CASE_TYPES = ["Trademark", "Copyright", "Design", "Patent", "Renewal", "Opposition", "Other"];

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] mb-4">SEARCH TM</h1>

          {/* TM Number Search */}
          <div className="mb-3">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-1.5">
              TM / CPR NUMBER LOOKUP
            </div>
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#6d6658]">TM</span>
              <input
                type="text"
                placeholder="e.g. 633710"
                value={tmQuery}
                onChange={(e) => setTmQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white border-2 border-[#0C0C0C] font-mono text-sm font-bold focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 placeholder:text-[#9d9488] placeholder:font-normal"
              />
              {tmQuery && (
                <button
                  onClick={clearTm}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d6658] hover:text-[#0C0C0C]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-[#0C0C0C]/15 pt-3 mt-3">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-1.5">
              GENERAL SEARCH
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-3xl">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6d6658]" />
                <input
                  type="text"
                  placeholder="Name, Client Code, Case No, Application Name, Class..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 placeholder:text-[#6d6658]"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d6658] hover:text-[#0C0C0C]">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center justify-center gap-2 px-4 h-11 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider transition-colors ${
                    showFilters || hasFilters ? "bg-[#0C0C0C] text-[#F0E8D0]" : "bg-white"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  FILTER{hasFilters ? " ●" : ""}
                </button>
                {(query || hasFilters) && (
                  <button
                    onClick={clearAll}
                    className="px-4 h-11 border-2 border-[#CC0000] text-[#CC0000] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#0C0C0C]/10">
                {[
                  { label: "STATUS",    value: stageFilter,    set: setStageFilter,    options: STAGES },
                  { label: "CITY",      value: cityFilter,     set: setCityFilter,     options: CITIES },
                  { label: "CASE TYPE", value: caseTypeFilter, set: setCaseTypeFilter, options: CASE_TYPES },
                ].map(({ label, value, set, options }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label>
                    <select
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="h-9 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[150px]"
                    >
                      <option value="">ALL</option>
                      {options.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {/* TM Number results */}
          {isTmSearch && (
            <div className="p-6 border-b-2 border-[#0C0C0C] bg-[#F0E8D0]">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-3">
                TM LOOKUP — {debouncedTmQuery}
              </div>
              {tmLoading ? (
                <div className="font-mono text-xs text-[#6d6658] animate-pulse">
                  Searching TM {debouncedTmQuery}…
                </div>
              ) : tmError ? (
                <div className="flex items-center gap-2 font-mono text-xs text-[#CC0000]">
                  <AlertCircle className="w-4 h-4" />
                  Unable to search. Check your connection.
                </div>
              ) : tmResult ? (
                <TmCard result={tmResult} onViewRecord={goToRecord} />
              ) : null}
            </div>
          )}

          {/* General search results */}
          {hasGenSearch ? (
            <div className="bg-white">
              {genLoading || genFetching ? (
                <div className="px-6 py-12 text-center font-bold font-mono text-[#6d6658] animate-pulse">
                  SEARCHING…
                </div>
              ) : generalResults.length === 0 ? (
                <div className="px-6 py-12 text-center space-y-2">
                  <div className="font-mono font-bold text-[#6d6658] uppercase tracking-widest">No results found.</div>
                  <div className="font-mono text-xs text-[#9d9488]">
                    Try adjusting your search terms or filters.
                  </div>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
                  <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
                    <tr>
                      {["CLIENT CODE", "CLIENT NAME", "CASE NUMBER", "APPLICATION NAME", "STATUS", "SUB-STATUS", "TM / CPR NO", "CLASS", "AGENT", "CITY", "LAST MODIFIED"].map((h) => (
                        <th key={h} className="px-4 py-3 border-r border-[#1A1A1A] font-bold tracking-wider uppercase text-[10px] last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generalResults.map((tm, i) => (
                      <tr
                        key={tm.id}
                        onClick={() => goToRecord(tm.id)}
                        className={`cursor-pointer border-b border-[#0C0C0C]/10 hover:bg-[#D9D0B7] transition-colors ${i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-white"}`}
                      >
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold">{tm.clientCode || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 max-w-[150px] truncate">{tm.clientName || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">{tm.caseNumber || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 max-w-[200px] truncate">{tm.appName || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10">
                          {tm.stage && (
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#0C0C0C]/20 ${STAGE_BADGE[tm.stage] ?? "bg-[#E8DFC7]"}`}>
                              {tm.stage}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 text-[#6d6658] max-w-[120px] truncate">{tm.subStage || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold">{tm.tmCprNo || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10">{tm.appClass || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10 max-w-[100px] truncate">{tm.agent || ""}</td>
                        <td className="px-4 py-3 border-r border-[#0C0C0C]/10">{tm.city || ""}</td>
                        <td className="px-4 py-3 text-[#6d6658]">{formatDateShort(tm.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : !isTmSearch ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#F0E8D0]">
              <SearchIcon className="w-16 h-16 text-[#C5B89A] mb-4" />
              <div className="font-serif text-2xl text-[#0C0C0C] uppercase tracking-widest">SEARCH TRADEMARK RECORDS</div>
              <div className="font-mono text-sm text-[#6d6658] mt-2 max-w-md">
                Enter a TM number above for a quick lookup card, or use the general search for full-text results.
              </div>
            </div>
          ) : null}
        </div>

        {hasGenSearch && generalResults.length > 0 && (
          <div className="shrink-0 px-6 py-2 bg-[#E8DFC7] border-t-2 border-[#0C0C0C] font-mono text-[10px] font-bold text-[#6d6658] uppercase tracking-widest flex justify-between">
            <span>{generalResults.length} RESULT{generalResults.length !== 1 ? "S" : ""}</span>
            <span>CLICK ROW TO VIEW RECORD</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
