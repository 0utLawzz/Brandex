import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock3, UserRound, AlertTriangle, ArrowRight } from "lucide-react";

export type StageEvent = {
  id: string;
  stage: number;
  sub_status: string | null;
  started_at: string;
  completed_at: string | null;
  expected_days: number | null;
  outcome: string | null;
  notes: string | null;
};

export type AssignmentEvent = {
  id: string;
  agent_name: string;
  assigned_at: string;
  response_status: string;
  responded_at: string | null;
  notes: string | null;
};

const stageNames: Record<number, string> = {
  1: "FILING / EXAMINATION",
  2: "ASSIGNMENT / HEARING",
  3: "PUBLICATION / OPPOSITION",
  4: "REGISTRATION / CER",
  5: "POST-REGISTRY / SPECIAL",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function durationDays(start: string, end?: string | null) {
  const a = new Date(start).getTime();
  const b = new Date(end || Date.now()).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function RecordHistoryPanel({ trademarkId, tm11 }: { trademarkId: string; tm11: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["record-history", trademarkId],
    queryFn: async () => {
      const [timeline, assignments] = await Promise.all([
        supabase.from("trademark_stage_events").select("id,stage,sub_status,started_at,completed_at,expected_days,outcome,notes").eq("trademark_id", trademarkId).order("started_at", { ascending: false }),
        supabase.from("agent_assignments").select("id,agent_name,assigned_at,response_status,responded_at,notes").eq("trademark_id", trademarkId).order("assigned_at", { ascending: false }),
      ]);
      if (timeline.error) throw timeline.error;
      if (assignments.error) throw assignments.error;
      return { timeline: (timeline.data ?? []) as StageEvent[], assignments: (assignments.data ?? []) as AssignmentEvent[] };
    },
    staleTime: 15_000,
  });

  const events = data?.timeline ?? [];
  const assignments = data?.assignments ?? [];
  const demandEvents = events.filter((event) => /TM11|DEMAND NOTE|REGISTRATION FEE/i.test(`${event.sub_status ?? ""} ${event.outcome ?? ""} ${event.notes ?? ""}`));
  const latestDemand = demandEvents[0];

  return (
    <div className="space-y-6">
      <section>
        <SectionHead title="TM11 — DEMAND NOTE / REGISTRATION FEE" />
        <div className={`border-2 p-4 ${tm11 ? "border-[#0A6B52] bg-[#0D9970]/5" : "border-[#1E3E62]/15 bg-white"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider ${tm11 ? "bg-[#0A6B52] text-white" : "bg-[#E8DFC7] text-[#3A506B]"}`}>
              {tm11 ? "TM11 RECORDED" : "TM11 NOT RECORDED"}
            </div>
            <div className="font-mono text-xs font-bold text-[#0A1931]">
              {latestDemand ? (latestDemand.sub_status || latestDemand.outcome || "Demand Note activity recorded") : "Demand Note activity will appear here when logged."}
            </div>
          </div>
          {latestDemand && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <Mini label="Started" value={formatDate(latestDemand.started_at)} />
              <Mini label="Completed" value={formatDate(latestDemand.completed_at)} />
              <Mini label="Elapsed" value={`${durationDays(latestDemand.started_at, latestDemand.completed_at) ?? 0} days`} />
              <Mini label="Expected" value={latestDemand.expected_days ? `${latestDemand.expected_days} days` : "Not set"} />
            </div>
          )}
          {latestDemand?.notes && <div className="mt-3 border-t border-[#0A6B52]/20 pt-3 font-mono text-xs whitespace-pre-wrap">{latestDemand.notes}</div>}
        </div>
      </section>

      <section>
        <SectionHead title="CASE TIMELINE" />
        {isLoading ? <Loading /> : events.length === 0 ? <Empty text="No timeline events have been logged for this record yet." /> : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const overdue = event.expected_days != null && durationDays(event.started_at, event.completed_at) != null && (durationDays(event.started_at, event.completed_at) as number) > event.expected_days && !event.completed_at;
              return (
                <div key={event.id} className={`relative border-2 bg-white p-4 ${overdue ? "border-red-900/30 bg-red-50" : "border-[#1E3E62]/12"}`}>
                  {index < events.length - 1 && <div className="absolute left-6 top-full h-3 w-px bg-[#1E3E62]/20" />}
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center bg-[#0A1931] text-white font-mono text-[9px] font-black">{event.stage}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#3A506B]">{stageNames[event.stage] ?? `STAGE ${event.stage}`}</span>
                        {event.sub_status && <ArrowRight className="h-3 w-3 text-[#C94A00]" />}
                        {event.sub_status && <span className="font-mono text-xs font-black text-[#0A1931]">{event.sub_status}</span>}
                        {overdue && <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-900 font-mono text-[8px] font-black"><AlertTriangle className="h-3 w-3" /> OVERDUE</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[#3A506B]">
                        <span>START {formatDate(event.started_at)}</span>
                        <span>{event.completed_at ? `END ${formatDate(event.completed_at)}` : "OPEN"}</span>
                        <span>{durationDays(event.started_at, event.completed_at) ?? 0} DAYS</span>
                        {event.expected_days != null && <span>EXPECTED {event.expected_days} DAYS</span>}
                      </div>
                      {(event.outcome || event.notes) && <div className="mt-2 border-t border-[#1E3E62]/10 pt-2 font-mono text-xs whitespace-pre-wrap">{event.outcome && <b>{event.outcome}</b>}{event.outcome && event.notes ? " — " : ""}{event.notes}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="ASSIGNMENT HISTORY" />
        {isLoading ? <Loading /> : assignments.length === 0 ? <Empty text="No assignment history has been logged for this record yet." /> : (
          <div className="border-2 border-[#1E3E62]/12 bg-white divide-y divide-[#1E3E62]/10">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center bg-[#E8DFC7]"><UserRound className="h-4 w-4 text-[#0A1931]" /></div>
                <div className="min-w-[160px] flex-1">
                  <div className="font-mono text-xs font-black uppercase">{assignment.agent_name}</div>
                  <div className="font-mono text-[9px] text-[#3A506B]">ASSIGNED {formatDate(assignment.assigned_at)}</div>
                </div>
                <div className={`px-2.5 py-1 font-mono text-[9px] font-black ${assignment.response_status === "REJECTED" ? "bg-red-100 text-red-900" : assignment.response_status === "ACCEPTED" ? "bg-[#0D9970]/15 text-[#0A6B52]" : "bg-[#E8DFC7] text-[#3A506B]"}`}>
                  {assignment.response_status}
                </div>
                {assignment.responded_at && <div className="font-mono text-[9px] text-[#3A506B]">RESPONDED {formatDate(assignment.responded_at)}</div>}
                {assignment.notes && <div className="w-full pl-12 font-mono text-xs whitespace-pre-wrap text-[#3A506B]">{assignment.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return <div className="flex items-center gap-2.5 mb-3"><div className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#0A1931]">{title}</div><div className="flex-1 h-px bg-[#1E3E62]/20" /></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8px] uppercase tracking-widest text-[#3A506B] font-black">{label}</div><div className="font-bold mt-0.5">{value}</div></div>;
}

function Loading() {
  return <div className="border border-dashed border-[#1E3E62]/20 bg-white p-6 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-[#3A506B] animate-pulse">Loading case history…</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="border border-dashed border-[#1E3E62]/20 bg-white p-6 text-center font-mono text-xs text-[#3A506B]"><Clock3 className="mx-auto mb-2 h-5 w-5" />{text}</div>;
}
