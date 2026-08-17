import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { format, isValid } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

interface ChangeLogEntry {
  id: number;
  trademarkId: number;
  field: string;
  oldValue: string | null;
  newValue: string;
  changedAt: string | null;
  changedBy: string;
  appName?: string | null;
  tmNo?: string | null;
  folderNo?: string | null;
}

const PAGE_SIZE = 100;

function getAction(field: string): { label: string; color: string } {
  if (field === "CREATE") return { label: "CREATE", color: "bg-[#0A6B52] text-white" };
  if (field === "DELETE" || field === "ARCHIVE") return { label: field, color: "bg-[#CC0000] text-white" };
  return { label: "UPDATE", color: "bg-[#C94A00] text-white" };
}

function safeFmt(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return isValid(date) ? format(date, "dd MMM yyyy HH:mm") : d;
}

export function LogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<"" | "CREATE" | "UPDATE" | "DELETE">("") ;

  const offset = (page - 1) * PAGE_SIZE;
  const { data: logs = [], isLoading } = useQuery<ChangeLogEntry[]>({
    queryKey: ["change-log", page],
    queryFn: async () => {
      const res = await fetch(`/api/change-log?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    staleTime: 30_000,
  });

  const filtered = actionFilter
    ? logs.filter((l) => {
        if (actionFilter === "CREATE") return l.field === "CREATE";
        if (actionFilter === "DELETE") return l.field === "DELETE" || l.field === "ARCHIVE";
        return l.field !== "CREATE" && l.field !== "DELETE" && l.field !== "ARCHIVE";
      })
    : logs;

  const hasPrev = page > 1;
  const hasNext = logs.length === PAGE_SIZE;

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3 bg-[#E8DFC7] border-b-2 border-[#0C0C0C]">
          <ScrollText className="w-5 h-5 text-[#C94A00]" />
          <h1 className="font-serif text-2xl uppercase tracking-widest text-[#0C0C0C] mr-auto">AUDIT LOG</h1>
          <div className="flex items-center gap-2">
            <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">ACTION</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value as any); setPage(1); }}
              className="h-8 px-2 bg-white border-2 border-[#0C0C0C] font-mono text-xs focus:outline-2 focus:outline-[#C94A00]"
            >
              <option value="">ALL</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap border-collapse">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] sticky top-0 z-10">
              <tr>
                {["TIMESTAMP", "USER", "ACTION", "RECORD", "FIELD", "OLD VALUE", "NEW VALUE"].map((h) => (
                  <th key={h} className="px-3 py-3 border-r border-white/10 font-bold tracking-wider uppercase text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-bold text-[#6d6658] animate-pulse">
                    LOADING AUDIT LOG...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-bold text-[#6d6658]">
                    NO LOG ENTRIES FOUND.
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => {
                  const action = getAction(log.field);
                  const record = log.folderNo || log.appName || `#${log.trademarkId}`;
                  const isCreate = log.field === "CREATE";

                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-[#0C0C0C]/15 ${i % 2 === 0 ? "bg-[#F0E8D0]" : "bg-[#E8DFC7]"}`}
                    >
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10 text-[#6d6658] text-[10px]">
                        {safeFmt(log.changedAt)}
                      </td>
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#0A6B52]">
                        {log.changedBy || "—"}
                      </td>
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-[#0C0C0C]/20 ${action.color}`}>
                          {action.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold text-[#C94A00] max-w-[150px] truncate" title={record}>
                        {record}
                      </td>
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10 font-bold">
                        {isCreate ? "—" : log.field.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 border-r border-[#0C0C0C]/10 max-w-[200px]">
                        {isCreate ? (
                          <span className="text-[#6d6658]">NEW RECORD</span>
                        ) : (
                          <span
                            className="text-[#CC0000] font-medium truncate block max-w-[200px]"
                            title={log.oldValue ?? ""}
                          >
                            {log.oldValue || <span className="text-[#6d6658]">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-[200px]">
                        {isCreate ? (
                          <span className="text-[#0A6B52] font-bold">CREATED</span>
                        ) : (
                          <span
                            className="text-[#0A6B52] font-bold truncate block max-w-[200px]"
                            title={log.newValue}
                          >
                            {log.newValue || <span className="text-[#6d6658]">—</span>}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-[#E8DFC7] border-t-2 border-[#0C0C0C]">
          <span className="font-mono text-xs text-[#6d6658] font-bold">
            PAGE {page} · {filtered.length} ENTRIES SHOWN
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className="flex items-center gap-1 px-2 py-1 border-2 border-[#0C0C0C] font-mono text-xs font-bold disabled:opacity-30 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> PREV
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1 px-2 py-1 border-2 border-[#0C0C0C] font-mono text-xs font-bold disabled:opacity-30 hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
            >
              NEXT <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
