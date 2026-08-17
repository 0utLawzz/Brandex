import { useGetTrademarkStats } from "@workspace/api-client-react";
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "wouter";
import { Plus, Search, Database, ScrollText, Clock } from "lucide-react";
import { format, isValid } from "date-fns";

const STAGE_COLORS: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
};

const STAGE_BORDER: Record<string, string> = {
  "STAGE 1": "border-[#0D9970]",
  "STAGE 2": "border-[#D4A800]",
  "STAGE 3": "border-[#C94A00]",
  "STAGE 4": "border-[#0A6B52]",
};

function StatBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className={`border-2 border-[#0C0C0C] bg-[#E8DFC7] p-4 flex flex-col gap-1 ${color ?? ""}`}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</div>
      <div className="font-serif text-4xl leading-none">{value}</div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 font-mono font-bold text-sm uppercase tracking-widest border-2 border-[#0C0C0C] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0C0C0C] active:translate-y-0 active:shadow-none ${color}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  );
}

export function Dashboard() {
  const { data: stats, isLoading } = useGetTrademarkStats();

  const numericStages = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"].map((stage) => {
    const found = stats?.byNumericStage?.find((s) => s.stage === stage);
    return { stage, count: found?.count ?? 0 };
  });

  const maxCityCount = Math.max(1, ...(stats?.byCity ?? []).map((c) => c.count));

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-5xl w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl lg:text-5xl text-[#0C0C0C] uppercase tracking-wide leading-none">
            DASHBOARD
          </h1>
          <p className="font-mono text-xs text-[#6d6658] mt-1 uppercase tracking-widest">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>

        {isLoading ? (
          <div className="font-mono font-bold animate-pulse text-[#6d6658]">LOADING DATA...</div>
        ) : !stats ? (
          <div className="font-mono font-bold text-[#C94A00]">FAILED TO LOAD STATISTICS.</div>
        ) : (
          <div className="space-y-6">
            {/* Top stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBox label="TOTAL RECORDS" value={stats.total} />
              {numericStages.map((s) => (
                <div
                  key={s.stage}
                  className={`border-2 border-[#0C0C0C] p-4 flex flex-col gap-1 ${STAGE_COLORS[s.stage] ?? "bg-[#E8DFC7]"}`}
                >
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">{s.stage}</div>
                  <div className="font-serif text-4xl leading-none">{s.count}</div>
                </div>
              ))}
              <StatBox label="MODIFIED (7D)" value={stats.recentlyModified ?? 0} />
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Records by City */}
              <div className="border-2 border-[#0C0C0C] bg-[#E8DFC7]">
                <div className="px-4 py-3 border-b-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-widest">
                  RECORDS BY CITY
                </div>
                <div className="p-4 space-y-3">
                  {stats.byCity.length === 0 ? (
                    <div className="font-mono text-xs text-[#6d6658]">NO CITY DATA</div>
                  ) : (
                    stats.byCity
                      .sort((a, b) => b.count - a.count)
                      .map((c) => (
                        <div key={c.city} className="space-y-1">
                          <div className="flex justify-between font-mono font-bold text-xs">
                            <span>{c.city || "UNSPECIFIED"}</span>
                            <span>{c.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#F0E8D0] border border-[#0C0C0C]">
                            <div
                              className="h-full bg-[#0C0C0C]"
                              style={{ width: `${Math.max(2, (c.count / maxCityCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Records by Stage */}
              <div className="border-2 border-[#0C0C0C] bg-[#E8DFC7]">
                <div className="px-4 py-3 border-b-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-widest">
                  RECORDS BY STATUS
                </div>
                <div className="p-4 space-y-2">
                  {stats.byStage.length === 0 ? (
                    <div className="font-mono text-xs text-[#6d6658]">NO STATUS DATA</div>
                  ) : (
                    stats.byStage
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.stage} className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-block border border-[#0C0C0C] px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-wider truncate max-w-[180px] ${STAGE_COLORS[s.stage] ?? "bg-[#F0E8D0] text-[#0C0C0C]"}`}
                            title={s.stage}
                          >
                            {s.stage}
                          </span>
                          <span className="font-mono font-bold text-sm shrink-0">{s.count}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-2 border-[#0C0C0C] bg-[#E8DFC7]">
              <div className="px-4 py-3 border-b-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-widest">
                QUICK ACTIONS
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickAction href="/database?new=1" icon={Plus} label="+ ADD RECORD" color="bg-[#C94A00] text-white" />
                <QuickAction href="/search" icon={Search} label="SEARCH TM" color="bg-[#F0E8D0] text-[#0C0C0C]" />
                <QuickAction href="/database" icon={Database} label="DATABASE" color="bg-[#0A6B52] text-white" />
                <QuickAction href="/logs" icon={ScrollText} label="LOGS" color="bg-[#0C0C0C] text-[#F0E8D0]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
