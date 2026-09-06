import { getRecord } from "@/lib/api";
import type { TrademarkRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { RecordHistoryPanel } from "@/components/RecordHistoryPanel";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Edit2, Printer, AlertTriangle, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface Props { params: { id: string } }

const STATUS_COLOR: Record<string, string> = {
  "STAGE 1": "bg-emerald-700 text-white",
  "STAGE 2": "bg-amber-500 text-black",
  "STAGE 3": "bg-orange-700 text-white",
  "STAGE 4": "bg-teal-800 text-white",
  "STOPPED": "bg-red-800 text-white",
};

function Field({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}>
    <div className="font-mono text-[8px] font-black uppercase tracking-widest text-[#6d6658]">{label}</div>
    <div className="mt-1 min-h-[22px] border-b border-black/10 pb-1 font-mono text-xs font-bold break-words">{value || "—"}</div>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><div className="mb-3 flex items-center gap-3"><h2 className="font-mono text-[10px] font-black uppercase tracking-[0.16em]">{title}</h2><div className="h-px flex-1 bg-black/15" /></div>{children}</section>;
}

function TmChip({ name, active }: { name: string; active: boolean }) {
  return <div className={`flex items-center gap-1.5 border-2 px-3 py-2 font-mono text-[9px] font-black ${active ? "border-[#0A6B52] bg-[#0A6B52] text-white" : "border-black/10 bg-white text-black/35"}`}>
    {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}{name}
  </div>;
}

export function RecordView({ params }: Props) {
  const { id } = params;
  const [, navigate] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: record, isLoading, error, refetch } = useQuery<TrademarkRecord | null>({
    queryKey: ["record", id], queryFn: () => getRecord(id), staleTime: 30_000, retry: 1,
  });

  const saved = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["record", id] });
    queryClient.invalidateQueries({ queryKey: ["trademarks"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    refetch();
  };

  if (isLoading) return <AppShell><div className="flex h-full items-center justify-center bg-[#F0E8D0] font-mono text-xs font-black uppercase tracking-widest animate-pulse">Loading secure case record…</div></AppShell>;
  if (error || !record) return <AppShell><div className="flex h-full flex-col items-center justify-center bg-[#F0E8D0] p-8 text-center"><AlertTriangle className="mb-4 h-10 w-10 text-[#C94A00]" /><h1 className="font-serif text-2xl uppercase">Record not found</h1><p className="my-3 max-w-lg font-mono text-xs text-[#6d6658]">{error ? String(error) : `No record with ID ${id} could be found.`}</p><button onClick={() => navigate("/database")} className="bg-[#0C0C0C] px-4 py-2 font-mono text-xs font-black text-white">BACK TO DATABASE</button></div></AppShell>;

  const compromised = record.condition && record.condition !== "NORMAL";
  const stageColor = STATUS_COLOR[record.stage] ?? "bg-[#E8DFC7] text-black";

  return <AppShell>
    <div className="flex h-full min-h-0 flex-col bg-[#F0E8D0]">
      <header className="shrink-0 border-b-2 border-black bg-[#0C0C0C] px-4 py-3 text-white print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate("/database")} className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#E8DFC7]"><ArrowLeft className="h-4 w-4" /> Database</button>
          <div className="ml-auto flex gap-2"><button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 bg-[#C94A00] px-3 py-1.5 font-mono text-[10px] font-black"><Edit2 className="h-3.5 w-3.5" /> Edit</button><button onClick={() => window.print()} className="flex items-center gap-1.5 bg-white px-3 py-1.5 font-mono text-[10px] font-black text-black"><Printer className="h-3.5 w-3.5" /> Print</button></div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 print:p-0">
          <div className={`border-2 border-black bg-white p-4 sm:p-6 ${compromised ? "bg-red-50" : ""}`}>
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="flex min-h-[210px] w-full items-center justify-center border-2 border-black/15 bg-[#F8F6EF] p-3 lg:w-[260px] lg:shrink-0">
                {record.image ? <button onClick={() => setImageOpen(true)} className="h-full w-full cursor-zoom-in" title="Open full image"><img src={record.image} alt={record.appName} className="mx-auto max-h-[240px] w-full object-contain" /></button> : <div className="text-center font-mono text-[9px] font-black uppercase text-black/30"><ImageIcon className="mx-auto mb-2 h-7 w-7" />No mark image</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="font-mono text-[9px] font-black uppercase tracking-widest text-[#6d6658]">{record.prefix || record.type || "—"} · CLIENT {record.clientCode || "—"} · CASE {record.caseNumber || "—"}</div><h1 className="mt-2 font-serif text-3xl uppercase leading-tight tracking-wide sm:text-4xl">{record.appName || "Untitled Mark"}</h1><div className="mt-2 font-mono text-lg font-black text-[#0A6B52]">TM / CPR {record.tmCprNo || "—"}</div></div><div className="flex flex-col items-end gap-2"><span className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase ${stageColor}`}>{record.stage || "NO STATUS"}</span><span className="max-w-[240px] text-right font-mono text-xs font-black">{record.subStage || "No sub-status"}</span></div></div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-black/10 pt-4 sm:grid-cols-4"><Field label="Filing Date" value={formatDateShort(record.date)} /><Field label="Last Modified" value={formatDate(record.updatedAt)} /><Field label="Class" value={record.appClass} /><Field label="City" value={record.city} /></div>
              </div>
            </div>
            {compromised && <div className="mt-4 flex items-center gap-2 border-2 border-red-900/20 bg-red-100/60 px-3 py-2 font-mono text-[10px] font-black uppercase text-red-900"><AlertTriangle className="h-4 w-4" /> {record.condition} {record.isProlonged ? "· PROLONGED CASE" : "· SPECIAL ATTENTION"}</div>}
          </div>

          <Section title="Case Information"><div className="grid grid-cols-2 gap-x-5 gap-y-4 border-2 border-black/10 bg-white p-4 sm:grid-cols-4"><Field label="Prefix" value={record.prefix || record.type} /><Field label="Client Code" value={record.clientCode} /><Field label="Case / Folder Number" value={record.caseNumber} /><Field label="Case Type" value={record.caseType} /><Field label="Agent / Counsel" value={record.agent} /><Field label="City" value={record.city} /><Field label="Application / Mark" value={record.appName} wide /><Field label="TM / CPR Number" value={record.tmCprNo} wide /><Field label="Notes" value={record.notes} wide /></div></Section>

          <Section title="TM Document Control"><div className="flex flex-wrap gap-2">{([['TM5', record.tm5], ['TM6', record.tm6], ['TM11', record.tm11], ['TM16', record.tm16], ['TM56', record.tm56]] as const).map(([name, value]) => <TmChip key={name} name={name} active={value === "YES"} />)}</div></Section>

          <RecordHistoryPanel trademarkId={record.id} tm11={record.tm11 === "YES"} />

          {record.journal && <Section title="Journal Publication"><div className="border-2 border-[#0A6B52]/30 bg-white p-4"><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Field label="Journal No" value={String(record.journal["Journal No"] || "")} /><Field label="Journal Date" value={String(record.journal["Journal Date"] || "")} /><Field label="Application No" value={String(record.journal["Application No"] || "")} /><Field label="Class" value={String(record.journal["Class"] || "")} /></div><div className="mt-4"><Field label="Title" value={String(record.journal["Title"] || record.appName || "")} wide /></div></div></Section>}

          {record.notes && <Section title="Office Notes"><div className="border-2 border-black/10 bg-white p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">{record.notes}</div></Section>}
        </div>
      </main>

      {imageOpen && record.image && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setImageOpen(false)}><div className="max-h-[92vh] max-w-5xl border-4 border-white bg-white p-2" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between bg-black px-3 py-2 text-white"><span className="font-mono text-[10px] font-black uppercase">{record.appName} · TM {record.tmCprNo}</span><button onClick={() => setImageOpen(false)} className="font-mono text-[10px] font-black">CLOSE ✕</button></div><img src={record.image} alt={record.appName} className="max-h-[82vh] w-auto object-contain" /></div></div>}
      {editOpen && <RecordModal recordId={record.id} isNew={false} onClose={() => setEditOpen(false)} onSaved={saved} />}
    </div>
  </AppShell>;
}
