import { useListTrademarks } from "@workspace/api-client-react";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format, isValid } from "date-fns";
import { Plus, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

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

const PAGE_SIZE = 50;

interface Filters {
  stage: string;
  subStage: string;
  city: string;
  caseType: string;
}

export function DatabasePage() {
  const [location] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ stage: "", subStage: "", city: "", caseType: "" });

  // Open "new record" modal if ?new=1 is in URL
  // Open "edit" modal if ?edit=ID is in URL (legacy redirect support)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setEditId(undefined);
      setModalOpen(true);
    } else if (params.get("edit")) {
      const id = parseInt(params.get("edit") ?? "", 10);
      if (!isNaN(id)) {
        setEditId(id);
        setModalOpen(true);
      }
    }
  }, [location]);

  const { data: trademarks = [], isLoading } = useListTrademarks({
    stage: filters.stage || undefined,
    city: filters.city || undefined,
    caseType: filters.caseType || undefined,
    subStage: filters.subStage || undefined,
  } as any);

  const hasFilters = Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(trademarks.length / PAGE_SIZE));
  const paged = trademarks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNew = () => { setEditId(undefined); setModalOpen(true); };
  const openEdit = (id: number) => { setEditId(id); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditId(undefined); };

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => { setFilters({ stage: "", subStage: "", city: "", caseType: "" }); setPage(1); };

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] leading-none mr-auto">
            DATABASE
          </h1>
          <span className="font-mono text-xs text-[#6d6658] font-bold">
            {isLoading ? "..." : `${trademarks.length} RECORDS`}
          </span>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider transition-colors ${showFilters || hasFilters ? "bg-[#0C0C0C] text-[#F0E8D0]" : "bg-white"}`}
          >
            <Filter className="w-3.5 h-3.5" />
            FILTERS{hasFilters ? " ●" : ""}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#C94A00] text-white border-2 border-[#C94A00] font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> ADD RECORD
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="shrink-0 flex flex-wrap items-end gap-3 px-5 py-3 bg-[#F0E8D0] border-b-2 border-[#0C0C0C]">
            {[
              { key: "stage" as const, label: "STATUS", options: STAGES },
              { key: "city" as const, label: "CITY", options: CITIES },
              { key: "caseType" as const, label: "CASE TYPE", options: CASE_TYPES },
            ].map(({ key, label, options }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">{label}</label>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                  className="h-8 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00] min-w-[130px]"
                >
                  <option value="">ALL</option>
                  {options.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                </select>
              </div>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 h-8 px-3 border-2 border-[#CC0000] text-[#CC0000] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors self-end"
              >
                <X className="w-3 h-3" /> CLEAR
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
              <tr>
                {["DATE", "TYPE", "CLIENT CODE", "CLIENT NAME", "CASE NO", "APPLICATION NAME", "STATUS", "SUB-STATUS", "TM NO", "CLASS", "CASE TYPE", "LAST MODIFIED", "CITY", "NOTES"].map((h) => (
                  <th key={h} className="px-3 py-3 border-r border-white/10 font-bold tracking-wider uppercase text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center font-bold text-[#6d6658]">
                    LOADING RECORDS...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center font-bold text-[#6d6658]">
                    NO RECORDS FOUND.{hasFilters && " TRY CLEARING FILTERS."}
                  </td>
                </tr>
              ) : (
                paged.map((tm, i) => (
                  <tr
                    key={tm.id}
                    onClick={() => openEdit(tm.id)}
                    className={`cursor-pointer border-b border-[#0C0C0C]/20 transition-colors ${
                      i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-[#E8DFC7]"
                    } hover:bg-[#D9D0B7]`}
                  >
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{safeFmt(tm.date)}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#C94A00]">{tm.prefix || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">{tm.clientNo || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[140px] truncate" title={(tm as any).clientName ?? ""}>{(tm as any).clientName || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">{tm.folderNo || `${tm.prefix}-${tm.clientNo}-${tm.caseNo}` || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[180px] truncate" title={tm.appName ?? ""}>{tm.appName || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                      {tm.stage && (
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#0C0C0C]/30 ${STAGE_BADGE[tm.stage] ?? "bg-[#E8DFC7]"}`}>
                          {tm.stage}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658] max-w-[120px] truncate" title={tm.subStage ?? ""}>{tm.subStage || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">{tm.tmNo || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{tm.appClass || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{(tm as any).caseType || "—"}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658]">{safeFmt(tm.updatedAt)}</td>
                    <td className="px-3 py-2 border-r border-[#0C0C0C]/10">{tm.city || "—"}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate text-[#6d6658]" title={tm.notes ?? ""}>{tm.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-[#E8DFC7] border-t-2 border-[#0C0C0C]">
            <span className="font-mono text-xs text-[#6d6658] font-bold">
              PAGE {page} OF {totalPages} · {trademarks.length} RECORDS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-2 py-1 border-2 border-[#0C0C0C] font-mono text-xs font-bold disabled:opacity-30 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> PREV
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-2 py-1 border-2 border-[#0C0C0C] font-mono text-xs font-bold disabled:opacity-30 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
              >
                NEXT <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {modalOpen && (
        <RecordModal
          recordId={editId}
          onClose={closeModal}
        />
      )}
    </AppShell>
  );
}
