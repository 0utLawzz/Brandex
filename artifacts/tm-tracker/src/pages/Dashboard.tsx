import { useGetTrademarkStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Copy, FileText, MapPin, Layers } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export function Dashboard() {
  const { data: stats, isLoading } = useGetTrademarkStats();

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="font-serif text-5xl md:text-7xl text-[#0C0C0C] uppercase tracking-wide">
            Overview <span className="text-[#C94A00]">Stats</span>
          </h1>
          <p className="font-mono text-[#0C0C0C] mt-2 font-medium">
            Real-time registry pulse.
          </p>
        </header>

        {isLoading ? (
          <div className="font-mono text-2xl font-bold animate-pulse">
            Loading data...
          </div>
        ) : !stats ? (
          <div className="font-mono text-2xl font-bold text-red-600">
            Failed to load statistics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#0A6B52] text-white border-2 border-[#0C0C0C]">
              <CardHeader className="border-[#0C0C0C]/20 pb-4">
                <CardTitle className="text-[#E8DFC7] flex items-center gap-2 text-2xl">
                  <Activity className="w-6 h-6" /> TOTAL TMs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-serif">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#D4A800] border-2 border-[#0C0C0C]">
              <CardHeader className="border-[#0C0C0C]/20 pb-4">
                <CardTitle className="text-[#0C0C0C] flex items-center gap-2 text-2xl">
                  <FileText className="w-6 h-6" /> TM-11 FILED
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-serif text-[#0C0C0C]">
                  {stats.tm11Count}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#C94A00] text-white border-2 border-[#0C0C0C]">
              <CardHeader className="border-[#0C0C0C]/20 pb-4">
                <CardTitle className="text-[#E8DFC7] flex items-center gap-2 text-2xl">
                  <Copy className="w-6 h-6" /> DUPLICATES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-serif">{stats.duplicates}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#E8DFC7] border-2 border-[#0C0C0C] md:col-span-2 lg:col-span-1">
              <CardHeader className="border-[#0C0C0C] pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MapPin className="w-6 h-6" /> CITY BREAKDOWN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  {stats.byCity.map((city) => (
                    <div key={city.city} className="flex flex-col gap-1">
                      <div className="flex justify-between font-mono font-bold text-sm">
                        <span>{city.city || "UNASSIGNED"}</span>
                        <span>{city.count}</span>
                      </div>
                      <div className="w-full h-4 bg-[#F0E8D0] border-2 border-[#0C0C0C]">
                        <div
                          className="h-full bg-[#0C0C0C]"
                          style={{
                            width: `${Math.max(2, (city.count / stats.total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-4 bg-[#F0E8D0] mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Layers className="w-8 h-8 text-[#C94A00]" /> STAGE
                  DISTRIBUTION
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {stats.byStage.map((stage) => {
                    const stageKey = stage.stage?.toLowerCase() as any;
                    return (
                      <div
                        key={stage.stage || "unknown"}
                        className="flex flex-col border-2 border-[#0C0C0C] p-4 bg-[#E8DFC7]"
                      >
                        <div className="font-serif text-4xl mb-2">
                          {stage.count}
                        </div>
                        <Badge variant={stageKey} className="self-start">
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
