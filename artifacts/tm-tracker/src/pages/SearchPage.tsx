import { listTrademarks } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { SearchIcon, X, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const STAGES = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"];
const CITIES = ["Islamabad", "Karachi", "Lahore", "Peshawar", "Multan", "Quetta"];
const CASE_TYPES = ["Trademark", "Copyright", "Design", "Patent", "Renewal", "Opposition", "Other"];

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
};

function safeFmt(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return isValid(date) ? format(date, "dd MMM yy") : d;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const hasFilters = Boolean(stageFilter || cityFilter || caseTypeFilter);
  const hasSearch = debouncedQuery.trim().length > 0 || hasFilters;

  const { data: results = [], isLoading, isFetching } = useQuery<TrademarkRecord[]>({
    queryKey: ["trademarks-search", debouncedQuery, stageFilter, cityFilter, caseTypeFilter],
    queryFn: () => listTrademarks({
      search: debouncedQuery.trim() || undefined,
      stage: stageFilter || undefined,
      city: cityFilter || undefined,
      caseType: caseTypeFilter || undefined,
    }),
    enabled: hasSearch,
    staleTime: 30_000,
  });

  const openEdit = (id: string) => { setEditId(id); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditId(undefined); };
  const clearAll = () => { setQuery(""); setStageFilter(""); setCityFilter(""); setCaseTypeFilter(""); };

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-white">
        <div className="shrink-0 px-6 py-4 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] mb-4">SEARCH TM</h1>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-3xl">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6d6658]" />
              <input
                type="text"
                autoFocus
                placeholder="Search by Name, Client Code, Case No, TM Number, Class..."
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
                className={`flex items-center justify-center gap-2 px-4 h-11 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider transition-colors ${showFilters || hasFilters ? "bg-[#0C0C0C] text-[#F0E8D0]" : "bg-white"}`}
              >
                <Filter className="w-4 h-4" />
                FILTER{hasFilters ? " ●" : ""}
              </button>
              {(query || hasFilters) && (
                <button onClick={clearAll} className="px-4 h-11 border-2 border-[#CC0000] text-[#CC0000] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors">
                  CLEAR
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t-2 border-[#0C0C0C]/10">
              {[
                { label: "STATUS", value: stageFilter, set: setStageFilter, options: STAGES },
                { label: "CITY", value: cityFilter, set: setCityFilter, options: CITIES },
                { label: "CASE TYPE", value: caseTypeFilter, set: setCaseTypeFilter, options: CASE_TYPES },
              ].map(({ label, value, set, options }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label>
                  <select value={value} onChange={(e) => set(e.target.value)} className="h-9 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[150px]">
                    <option value="">ALL</option>
                    {options.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-white">
          {!hasSearch ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#F0E8D0]">
              <SearchIcon className="w-16 h-16 text-[#C5B89A] mb-4" />
              <div className="font-serif text-2xl text-[#0C0C0C] uppercase tracking-widest">SEARCH TRADEMARK RECORDS</div>
              <div className="font-mono text-sm text-[#6d6658] mt-2 max-w-md">
                Type a client name, code, case number, application name, TM number, or class number above.
              </div>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
              <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
                <tr>
                  {["CLIENT CODE", "CLIENT NAME", "CASE NUMBER", "APPLICATION NAME", "STATUS", "SUB-STATUS", "TM NUMBER", "CLASS", "CITY", "LAST MODIFIED"].map((h) => (
                    <th key={h} className="px-4 py-3 border-r border-[#1A1A1A] font-bold tracking-wider uppercase text-[10px] last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading || isFetching ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center font-bold font-mono text-[#6d6658] animate-pulse">SEARCHING...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center font-bold font-mono text-[#6d6658]">NO RESULTS FOUND.</td></tr>
                ) : (
                  results.map((tm, i) => (
                    <tr
                      key={tm.id}
                      onClick={() => openEdit(tm.id)}
                      className={`cursor-pointer border-b border-[#0C0C0C]/10 hover:bg-[#D9D0B7] transition-colors ${i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-white"}`}
                    >
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold">{tm.clientNo || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 max-w-[150px] truncate">{tm.clientName || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">{tm.folderNo || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 max-w-[200px] truncate">{tm.appName || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10">
                        {tm.stage && <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#0C0C0C]/20 ${STAGE_BADGE[tm.stage] ?? "bg-[#E8DFC7]"}`}>{tm.stage}</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 text-[#6d6658] max-w-[120px] truncate">{tm.subStage || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10 font-bold">{tm.tmNo || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10">{tm.appClass || "—"}</td>
                      <td className="px-4 py-3 border-r border-[#0C0C0C]/10">{tm.city || "—"}</td>
                      <td className="px-4 py-3 text-[#6d6658]">{safeFmt(tm.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {hasSearch && results.length > 0 && (
          <div className="shrink-0 px-6 py-2 bg-[#E8DFC7] border-t-2 border-[#0C0C0C] font-mono text-[10px] font-bold text-[#6d6658] uppercase tracking-widest flex justify-between">
            <span>{results.length} RESULT{results.length !== 1 ? "S" : ""}</span>
            <span>CLICK ROW TO VIEW / EDIT</span>
          </div>
        )}
      </div>

      {modalOpen && <RecordModal recordId={editId} onClose={closeModal} />}
    </AppShell>
  );
}
