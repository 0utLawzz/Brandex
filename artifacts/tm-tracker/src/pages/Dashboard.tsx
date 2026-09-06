import { getStats, listTrademarks } from "@/lib/api";
import type { TrademarkStats, TrademarkRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "wouter";
import { Plus, Search, Database, ScrollText, Clock, AlertCircle, Users2, FileText } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const TM_STAGES = [
  { key: "tm5", label: "TM5", description: "Application / filing", color: "bg-emerald-700 text-white" },
  { key: "tm6", label: "TM6", description: "Examination / registry action", color: "bg-amber-500 text-black" },
  { key: "tm11", label: "TM11", description: "Demand Note / registration fee", color: "bg-orange-700 text-white" },
  { key: "tm16", label: "TM16", description: "Certificate / registration", color: "bg-teal-800 text-white" },
  { key: "tm56", label: "TM56", description: "Post-registration filing", color: "bg-slate-800 text-white" },
] as const;

function StatBox({ label, value }: { label: string; value: number | string }) {
  return <div className="border-2 border-[#0C0C0C] bg-[#E8DFC7] p-3"><div className="font-mono text-[10px] font-bold uppercase tracking-widest">{label}</div><div className="mt-1 font-serif text-3xl leading-none">{value}</div></div>;
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return <Link href={href} className={`flex items-center justify-center gap-2 border-2 border-[#0C0C0C] p-3 font-mono text-[10px] font-bold uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0C0C0C] ${color}`}><Icon className="h-4 w-4" />{label}</Link>;
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery<TrademarkStats>({ queryKey: ["stats"], queryFn: getStats, staleTime: 30_000 });
  const { data: records = [] } = useQuery<TrademarkRecord[]>({ queryKey: ["trademarks"], queryFn: () => listTrademarks(), staleTime: 30_000 });
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<AuditLogEntry[]>({ queryKey: ["recent-activity"], queryFn: () => listAuditLogs(5, 0), staleTime: 30_000 });

  const tmCounts = TM_STAGES.map((item) => ({ ...item, count: records.filter((r) => r[item.key] === "YES").length }));
  const latest = (key: typeof TM_STAGES[number]["key"]) => records.filter((r) => r[key] === "YES").sort((a,b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime())[0];
  const latestTm11 = latest("tm11");
  const latestTm16 = latest("tm16");

  return <AppShell><div className="flex-1 overflow-auto bg-[#F0E8D0] p-6"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-center gap-3 border-b-2 border-[#0C0C0C] pb-4"><img src="/brandex-logo.png" alt="Brandex Law Associates" className="h-11 w-11 rounded border-2 border-[#0C0C0C] bg-white p-1 shadow-[2px_2px_0_#0C0C0C]" /><div className="mr-auto"><h1 className="font-serif text-3xl uppercase tracking-wide leading-none">BRANDEX LAW ASSOCIATES</h1><p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#6d6658]">TRADEMARK CONTROL · {format(new Date(), "EEEE, d MMMM yyyy")}</p></div></header>
    {isLoading || !stats ? <div className="flex items-center gap-2 py-10 font-mono text-xs font-bold text-[#6d6658]"><AlertCircle className="h-4 w-4" />{isLoading ? "LOADING DATA…" : "NO DASHBOARD DATA"}</div> : <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"><StatBox label="TOTAL RECORDS" value={stats.total} />{["STAGE 1","STAGE 2","STAGE 3","STAGE 4"].map((s) => <StatBox key={s} label={s} value={stats.byNumericStage?.find(x=>x.stage===s)?.count ?? 0} />)}<StatBox label="MODIFIED 7D" value={stats.recentlyModified ?? 0} /></div>
      <section><div className="mb-3 flex items-end justify-between"><div><h2 className="font-serif text-xl uppercase tracking-widest">TM CONTROL BLOCKS</h2><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#6d6658]">Five distinct forms · TM11 is Demand Note / registration fee</p></div><Link href="/database" className="font-mono text-[10px] font-bold underline">OPEN DATASHEET →</Link></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">{tmCounts.map((tm)=><Link key={tm.key} href={`/database?tm=${tm.label}`} className={`border-2 border-[#0C0C0C] p-4 ${tm.color} transition-transform hover:-translate-y-1`}><div className="font-mono text-[10px] font-bold uppercase tracking-widest">{tm.label}</div><div className="mt-2 font-serif text-4xl leading-none">{tm.count}</div><div className="mt-2 font-mono text-[9px] font-bold uppercase tracking-wider opacity-80">{tm.description}</div></Link>)}</div></section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 border-2 border-[#0C0C0C] bg-white"><div className="border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest"><FileText className="mr-2 inline h-3.5 w-3.5" />LATEST TM ACTIVITY</div><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">{[["TM11 · DEMAND NOTE",latestTm11],["TM16 · REGISTRATION",latestTm16]].map(([label,r])=><div key={label as string} className="border border-black/20 p-3"><div className="font-mono text-[9px] font-bold uppercase text-[#6d6658]">{label as string}</div>{r ? <Link href={`/record/${(r as TrademarkRecord).id}`} className="mt-2 block"><div className="font-mono text-xs font-bold">{(r as TrademarkRecord).appName || "Unnamed mark"}</div><div className="mt-1 font-mono text-[10px]">TM {((r as TrademarkRecord).tmCprNo || "—")} · {((r as TrademarkRecord).subStage || (r as TrademarkRecord).stage || "—")}</div><div className="mt-1 font-mono text-[9px] text-[#6d6658]">{formatDate((r as TrademarkRecord).updatedAt || (r as TrademarkRecord).date)}</div></Link> : <div className="mt-2 font-mono text-xs text-[#6d6658]">NO ENTRY YET</div>}</div>)}</div></section>
        <section className="border-2 border-[#0C0C0C] bg-white"><div className="border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">JOURNAL · MONTHLY PUBLICATION</div><div className="p-4"><p className="font-mono text-[10px] leading-relaxed text-[#6d6658]">Journal is tracked separately from TM stages. Use the Journal module for monthly IPO publications, submitted vs published cases, and mark lookup.</p><Link href="/journal" className="mt-4 block border-2 border-black bg-[#0A6B52] p-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-white">OPEN JOURNAL →</Link></div></section>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><QuickAction href="/database?new=1" icon={Plus} label="ADD" color="bg-[#C94A00] text-white"/><QuickAction href="/search" icon={Search} label="SEARCH" color="bg-white"/><QuickAction href="/database" icon={Database} label="DATABASE" color="bg-white"/><QuickAction href="/assigned" icon={Users2} label="AGENTS" color="bg-[#D4A800]"/><QuickAction href="/logs" icon={ScrollText} label="AUDIT LOG" color="bg-[#0C0C0C] text-white"/></div>
      <section className="border-2 border-[#0C0C0C] bg-white"><div className="border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest"><Clock className="mr-2 inline h-3.5 w-3.5" />RECENT ACTIVITY</div>{activityLoading ? <div className="p-4 font-mono text-xs">LOADING…</div> : recentActivity.map(log=><div key={log.id} className="flex items-center gap-4 border-b border-black/10 p-3 font-mono text-[10px]"><span className="font-bold">{log.action}</span><span className="font-bold">{log.record}</span><span className="ml-auto text-[#6d6658]">{formatDate(log.changedAt)}</span></div>)}<Link href="/logs" className="block bg-[#F0E8D0] p-2 text-center font-mono text-[10px] font-bold uppercase">VIEW ALL LOGS →</Link></section>
    </>}</div></div></AppShell>;
}
