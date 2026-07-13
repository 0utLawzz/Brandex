import { useGetTrademarkStats, useSyncFromSheets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Copy, FileText, MapPin, Layers, BarChart3, DatabaseZap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getGetTrademarkStatsQueryKey, getListTrademarksQueryKey } from "@workspace/api-client-react";

function StatCard({
  title,
  value,
  icon: Icon,
  bg,
  text,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bg: string;
  text: string;
}) {
  return (
    <Card className={`border-2 border-[#0C0C0C] ${bg} ${text}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-xl uppercase tracking-wider ${text}`}>
          <Icon className="w-6 h-6" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-5xl font-serif`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  emptyText,
  keyProp,
  labelProp,
  countProp,
  colorClass,
}: {
  title: string;
  icon: React.ElementType;
  items: any[];
  emptyText: string;
  keyProp: string;
  labelProp: string;
  countProp: string;
  colorClass: string;
}) {
  return (
    <Card className="bg-[#E8DFC7] border-2 border-[#0C0C0C]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl uppercase tracking-wider">
          <Icon className="w-6 h-6" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="font-mono text-sm font-bold text-gray-600">{emptyText}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item[keyProp]} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono font-bold text-sm">
                  <span>{item[labelProp] || "UNASSIGNED"}</span>
                  <span>{item[countProp]}</span>
                </div>
                <div className="w-full h-3 bg-[#F0E8D0] border-2 border-[#0C0C0C]">
                  <div
                    className={`h-full ${colorClass}`}
                    style={{ width: `${Math.max(2, Math.min(100, (item[countProp] / Math.max(...items.map((i: any) => i[countProp]))) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: stats, isLoading } = useGetTrademarkStats();
  const sync = useSyncFromSheets();
  const queryClient = useQueryClient();
  const [syncing, setSynced] = useState(false);

  const handleSync = () => {
    setSynced(true);
    sync.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTrademarkStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTrademarksQueryKey() });
        setTimeout(() => setSynced(false), 2000);
      },
      onError: () => setSynced(false),
    });
  };

  const numericStages = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"].map((stage) => {
    const found = stats?.byNumericStage?.find((s) => s.stage === stage);
    return { stage, count: found?.count ?? 0 };
  });

  const maxStageCount = Math.max(1, ...numericStages.map((s) => s.count));

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl md:text-6xl text-[#0C0C0C] uppercase tracking-wide">
              BRANDEX LAW <span className="text-[#C94A00]">ASSOICATE</span>
            </h1>
            <p className="font-mono text-[#0C0C0C] mt-2 font-medium">
              Trademark Registry Dashboard
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={sync.isPending || syncing}
            className="flex items-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-4 py-2 font-mono font-bold text-sm uppercase tracking-wider rounded-[6px] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#F0E8D0] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 self-start md:self-auto"
          >
            <DatabaseZap className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`} />
            {sync.isPending ? "SYNCING..." : syncing ? "SYNCED!" : "SYNC G-SHEETS"}
          </button>
        </header>

        {isLoading ? (
          <div className="font-mono text-2xl font-bold animate-pulse">Loading data...</div>
        ) : !stats ? (
          <div className="font-mono text-2xl font-bold text-red-600">Failed to load statistics.</div>
        ) : (
          <div className="space-y-6">
            {/* Overview stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="TOTAL TMs" value={stats.total} icon={Activity} bg="bg-[#0A6B52]" text="text-white" />
              <StatCard title="TM-11 FILED" value={stats.tm11Count} icon={FileText} bg="bg-[#D4A800]" text="text-[#0C0C0C]" />
              <StatCard title="DUPLICATES" value={stats.duplicates} icon={Copy} bg="bg-[#C94A00]" text="text-white" />
              <StatCard title="ASSIGNED" value={stats.byAssignedSubStage?.reduce((sum, s) => sum + s.count, 0) ?? 0} icon={BarChart3} bg="bg-[#0A6B52]" text="text-white" />
            </div>

            {/* Stage 1-4 + Assigned breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#E8DFC7] border-2 border-[#0C0C0C]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl uppercase tracking-wider">
                    <Layers className="w-6 h-6" /> STAGE 1 — 4
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {numericStages.map((s) => (
                      <div key={s.stage} className="border-2 border-[#0C0C0C] p-3 bg-[#F0E8D0]">
                        <div className="text-3xl font-serif">{s.count}</div>
                        <Badge variant="outline" className="mt-2 uppercase text-xs">
                          {s.stage}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <BreakdownCard
                title="ASSIGNED BY SUB-STATUS"
                icon={BarChart3}
                items={stats.byAssignedSubStage ?? []}
                emptyText="NO ASSIGNED RECORDS"
                keyProp="subStage"
                labelProp="subStage"
                countProp="count"
                colorClass="bg-[#0A6B52]"
              />
            </div>

            {/* City breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownCard
                title="CITY BREAKDOWN"
                icon={MapPin}
                items={stats.byCity ?? []}
                emptyText="NO CITY DATA"
                keyProp="city"
                labelProp="city"
                countProp="count"
                colorClass="bg-[#0C0C0C]"
              />
            </div>

            {/* Stage distribution */}
            <Card className="bg-[#F0E8D0] border-2 border-[#0C0C0C]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl uppercase tracking-wider">
                  <Layers className="w-8 h-8 text-[#C94A00]" /> STAGE DISTRIBUTION
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {stats.byStage.map((stage) => {
                    const stageKey = stage.stage?.toLowerCase() as any;
                    return (
                      <div
                        key={stage.stage || "unknown"}
                        className="flex flex-col border-2 border-[#0C0C0C] p-4 bg-[#E8DFC7]"
                      >
                        <div className="font-serif text-4xl mb-2">{stage.count}</div>
                        <Badge variant={stageKey} className="self-start uppercase">
                          {stage.stage || "UNKNOWN"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
