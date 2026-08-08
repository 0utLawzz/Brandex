import { Navbar } from "@/components/layout/Navbar";
import { useListTrademarks, useGetTrademarkStats, useImportCsv } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterX, Edit, Database, Grid3X3, Upload, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { format, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STAGES: Record<string, string[]> = {
  "Application Filed": ["Acknowledgement", "Examination"],
  "Examination": ["Assigned", "Accepted", "Hearing"],
  "Accepted": ["Assigned", "Hearing"],
  "Published": ["Oppo: Withdrawn", "Oppo: Filed", "Oppo: Received", "Demand Note Received", "Demand Note Paid"],
  "Certificate Received": ["Certificate Dispatch", "Hearing"],
  "Stopped": ["Abandoned", "Note", "Hold", "Refused"],
  "Copyright": ["Filed", "In Newspapers", "Acknowledgement", "Examination", "Certificate Received", "Certificate Dispatched"],
};

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, "dd MMM yyyy") : dateStr;
}

export function Search() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [subStageFilter, setSubStageFilter] = useState("");
  const [city, setCity] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const availableSubStages = stage ? (STAGES[stage] ?? []) : [];

  const { data: trademarks, isLoading, refetch } = useListTrademarks({
    search: search || undefined,
    stage: stage || undefined,
    city: city || undefined,
  });
  const { data: stats, refetch: refetchStats } = useGetTrademarkStats();
  const importCsvMutation = useImportCsv();

  // Client-side substage filter
  const filtered = subStageFilter
    ? (trademarks ?? []).filter((tm) => tm.subStage === subStageFilter)
    : (trademarks ?? []);

  const sheetCount = (trademarks ?? []).filter((tm) => tm.source === "sheets").length;
  const dbCount = (trademarks ?? []).filter((tm) => tm.source === "local").length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const rows = text.split('\n').filter(Boolean).slice(1).map(row => {
        // very naive CSV parsing
        const cols = row.split(',').map(s => s.replace(/^"/, '').replace(/"$/, '').trim());
        return {
          date: cols[0] || undefined,
          prefix: cols[11] || "TM",
          clientNo: cols[12] || "IMPORT",
          caseNo: cols[13] || "IMPORT",
          appName: cols[2] || "",
          tmNo: cols[3] || undefined,
          appClass: cols[4] || undefined,
          stage: cols[5] || undefined,
          subStage: cols[6] || undefined,
          isDuplicate: cols[7] === 'TRUE',
          isTm11: cols[8] === 'TRUE',
          notes: cols[9] || undefined,
          city: cols[10] || undefined,
        };
      });

      importCsvMutation.mutate({ data: { rows } }, {
        onSuccess: (res) => {
          toast({ title: "Import Successful", description: res.message });
          refetch();
          refetchStats();
        },
        onError: () => {
          toast({ title: "Import Failed", description: "Failed to parse or import CSV.", variant: "destructive" });
        }
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-8 w-full max-w-[1600px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl text-[#0C0C0C] uppercase tracking-wide">
              Trademark <span className="text-[#0A6B52]">Database</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-[#0C0C0C] text-[#F0E8D0] border-2 border-[#0C0C0C] px-3 py-1.5 font-mono font-bold text-sm uppercase tracking-wider">
              <Database className="w-4 h-4" /> {dbCount} DB
            </div>
            <div className="flex items-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-3 py-1.5 font-mono font-bold text-sm uppercase tracking-wider">
              <Grid3X3 className="w-4 h-4" /> {sheetCount} SHEETS
            </div>
            <div className="flex items-center gap-2 bg-[#E8DFC7] border-2 border-[#0C0C0C] px-3 py-1.5 font-mono font-bold text-sm uppercase tracking-wider">
              TOTAL {stats?.total ?? 0}
            </div>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Button variant="outline" className="h-10 bg-white border-2 border-[#0C0C0C]" onClick={() => fileInputRef.current?.click()} disabled={importCsvMutation.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              {importCsvMutation.isPending ? "IMPORTING..." : "IMPORT CSV"}
            </Button>
          </div>
        </header>

        <div className="bg-[#E8DFC7] nb-border p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <Input
                placeholder="TM No, Name, File No..."
                className="pl-10 h-12 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">Stage</label>
            <select
              className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-offset-2 focus:outline-[#C94A00]"
              value={stage}
              onChange={(e) => { setStage(e.target.value); setSubStageFilter(""); }}
            >
              <option value="">ALL STAGES</option>
              {Object.keys(STAGES).map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">Sub-Stage</label>
            <select
              className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-offset-2 focus:outline-[#C94A00] disabled:opacity-40 disabled:cursor-not-allowed"
              value={subStageFilter}
              onChange={(e) => setSubStageFilter(e.target.value)}
              disabled={!availableSubStages.length}
            >
              <option value="">ALL SUB-STAGES</option>
              {availableSubStages.map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">City</label>
            <select
              className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-offset-2 focus:outline-[#C94A00]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">ALL CITIES</option>
              <option value="ISB">ISLAMABAD (ISB)</option>
              <option value="KHI">KARACHI (KHI)</option>
              <option value="LHR">LAHORE (LHR)</option>
              <option value="PESH">PESHAWAR (PESH)</option>
            </select>
          </div>
        </div>

        <div className="bg-white nb-border nb-shadow overflow-x-auto">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] uppercase tracking-wider text-xs border-b-2 border-[#0C0C0C]">
              <tr>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30 text-center">Img</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">TM No</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Source</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">App Name</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Class</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Stage</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Assigned</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">File No</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Date</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30 text-center">TM-11</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30 text-center">DUP</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0C0C0C]">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center font-bold">LOADING RECORDS...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center font-bold">NO RECORDS FOUND.</td>
                </tr>
              ) : (
                filtered.map((tm) => (
                  <tr
                    key={tm.id}
                    className={`transition-colors ${tm.isDuplicate ? "bg-[#FFF0E8] hover:bg-[#FFE4D4]" : "hover:bg-[#E8DFC7]"}`}
                  >
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] text-center w-12">
                      {tm.imageUrl ? (
                        <img src={tm.imageUrl} alt="img" className="w-8 h-8 object-cover rounded border border-[#0C0C0C]" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] font-bold">
                      {tm.tmNo || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      <span className={`inline-block border-2 border-[#0C0C0C] px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tm.source === "sheets" ? "bg-[#D4A800]" : "bg-[#0C0C0C] text-[#F0E8D0]"}`}>
                        {tm.source === "sheets" ? "SHEETS" : "LOCAL"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] max-w-[200px] truncate overflow-hidden" title={tm.appName || ""}>
                      {tm.appName || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.appClass || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.stage && <Badge variant={tm.stage.toLowerCase() as any}>{tm.stage}</Badge>}
                      {tm.subStage && <div className="text-[10px] text-gray-600 mt-1 uppercase">{tm.subStage}</div>}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.assignedTo ? <span className="font-bold text-[#0A6B52]">{tm.assignedTo}</span> : "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] font-bold text-[#C94A00]">
                      {`${tm.prefix || "TM"}-${tm.clientNo || ""}-${tm.caseNo || ""}`.replace(/-+$/, "")}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {safeFormatDate(tm.date)}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] text-center">
                      {tm.isTm11 ? <span className="text-[#C94A00] font-bold text-lg">★</span> : "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] text-center">
                      {tm.isDuplicate ? (
                        <span className="inline-block bg-[#CC0000] text-white font-mono font-bold text-[10px] tracking-widest px-2 py-0.5 border-2 border-[#0C0C0C]">DUP</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/trademarks/${tm.id}`}>
                        <Button variant="outline" size="sm" className="bg-white">
                          <Edit className="w-3 h-3 mr-1" /> EDIT
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
