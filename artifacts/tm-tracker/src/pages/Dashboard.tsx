import { getStats } from "@/lib/api";
import type { TrademarkStats } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "wouter";
import { Plus, Search, Database, ScrollText, Clock, AlertCircle, Users2 } from "lucide-react";
import { format, isValid } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/api";

import { formatDate } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function StatBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className={`border-2 border-[#0C0C0C] bg-[#E8DFC7] p-3 flex flex-col gap-1 ${color ?? ""}`}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</div>
      <div className="font-serif text-3xl leading-none">{value}</div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0C0C0C] active:translate-y-0 active:shadow-none ${color}`}
    >
      <Icon className="w-6 h-6" />
      {label}
    </Link>
  );
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery<TrademarkStats>({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 60_000,
  });

  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery<AuditLogEntry[]>({
    queryKey: ["recent-activity"],
    queryFn: () => listAuditLogs(5, 0),
    staleTime: 30_000,
  });

  const numericStages = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"].map((stage) => {
    const found = stats?.byNumericStage?.find((s) => s.stage === stage);
    return { stage, count: found?.count ?? 0 };
  });

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-[#F0E8D0] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#0C0C0C] pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/brandex-logo.png"
                alt="Brandex Law Associates"
                className="w-11 h-11 object-contain bg-white rounded p-1 border-2 border-[#0C0C0C] shadow-[2px_2px_0_#0C0C0C]"
              />
              <div>
                <h1 className="font-serif text-3xl text-[#0C0C0C] uppercase tracking-wide leading-none">
                  BRANDEX LAW ASSOCIATES
                </h1>
                <p className="font-mono text-[10px] text-[#6d6658] mt-1 uppercase tracking-widest font-bold">
                  TRADEMARK REGISTRY · {format(new Date(), "EEEE, d MMMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="font-mono font-bold animate-pulse text-[#6d6658]">LOADING DATA...</div>
          ) : !stats ? (
            <div className="font-mono font-bold flex items-center gap-2 text-[#CC0000]">
              <AlertCircle className="w-5 h-5" /> FAILED TO LOAD. CHECK VITE_APPS_SCRIPT_URL.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatBox label="TOTAL RECORDS" value={stats.total} />
                  {numericStages.map((s) => (
                    <div key={s.stage} className={`border-2 border-[#0C0C0C] p-3 flex flex-col gap-1 ${STAGE_COLORS[s.stage] ?? "bg-[#E8DFC7]"}`}>
                      <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-90">{s.stage}</div>
                      <div className="font-serif text-3xl leading-none">{s.count}</div>
                    </div>
                  ))}
                  <StatBox label="MODIFIED (7D)" value={stats.recentlyModified ?? 0} color="bg-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-2 border-[#0C0C0C] bg-white">
                    <div className="px-4 py-2 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] font-mono font-bold text-[10px] uppercase tracking-widest">RECORDS BY STATUS</div>
                    <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
                      {stats.byStage.length === 0 ? (
                        <div className="font-mono text-xs text-[#6d6658]">NO DATA</div>
                      ) : stats.byStage.sort((a, b) => b.count - a.count).map((s) => (
                        <div key={s.stage} className="flex items-center justify-between gap-3 border-b border-[#0C0C0C]/10 pb-1 last:border-0 last:pb-0">
                          <span className="font-mono text-[10px] font-bold text-[#6d6658] uppercase truncate">{s.stage}</span>
                          <span className="font-mono font-bold text-xs shrink-0">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-2 border-[#0C0C0C] bg-white">
                    <div className="px-4 py-2 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] font-mono font-bold text-[10px] uppercase tracking-widest">RECORDS BY CITY</div>
                    <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
                      {stats.byCity.length === 0 ? (
                        <div className="font-mono text-xs text-[#6d6658]">NO DATA</div>
                      ) : stats.byCity.sort((a, b) => b.count - a.count).map((c) => (
                        <div key={c.city} className="flex items-center justify-between gap-3 border-b border-[#0C0C0C]/10 pb-1 last:border-0 last:pb-0">
                          <span className="font-mono text-[10px] font-bold text-[#6d6658] uppercase truncate">{c.city || "UNSPECIFIED"}</span>
                          <span className="font-mono font-bold text-xs shrink-0">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction href="/database?new=1" icon={Plus}      label="ADD RECORD" color="bg-[#C94A00] text-white" />
                  <QuickAction href="/search"         icon={Search}    label="SEARCH TM"  color="bg-[#E8DFC7] text-[#0C0C0C]" />
                  <QuickAction href="/database"       icon={Database}  label="DATABASE"   color="bg-[#0A6B52] text-white" />
                  <QuickAction href="/assigned"       icon={Users2}    label="ASSIGNED"   color="bg-[#D4A800] text-[#0C0C0C]" />
                  <QuickAction href="/logs"           icon={ScrollText} label="AUDIT LOGS" color="bg-[#0C0C0C] text-[#F0E8D0]" />
                </div>

                <div className="border-2 border-[#0C0C0C] bg-white">
                  <div className="px-4 py-2 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] font-mono font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> RECENT ACTIVITY
                  </div>
                  <div>
                    {isLoadingActivity ? (
                      <div className="p-4 font-mono text-xs text-[#6d6658] animate-pulse">LOADING...</div>
                    ) : recentActivity.length === 0 ? (
                      <div className="p-4 font-mono text-xs text-[#6d6658]">NO RECENT ACTIVITY</div>
                    ) : (
                      <div className="divide-y divide-[#0C0C0C]/10">
                        {recentActivity.map((log) => {
                          const color = log.action === "CREATE" ? "text-[#0A6B52]" : log.action === "DELETE" ? "text-[#CC0000]" : "text-[#C94A00]";
                          return (
                            <div key={log.id} className="p-3 hover:bg-[#F0E8D0] transition-colors">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`font-mono text-[9px] font-bold uppercase ${color}`}>{log.action}</span>
                                <span className="font-mono text-[9px] text-[#6d6658]">
                                  {formatDate(log.changedAt)}
                                </span>
                              </div>
                              <div className="font-mono text-xs font-bold text-[#0C0C0C] truncate">{log.record}</div>
                              {log.action === "UPDATE" && (
                                <div className="font-mono text-[10px] text-[#6d6658] truncate mt-0.5">
                                  {log.field}: <span className="text-[#0C0C0C]">{log.newValue}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Link href="/logs" className="block text-center border-t-2 border-[#0C0C0C] bg-[#F0E8D0] py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors">
                    VIEW ALL LOGS
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
