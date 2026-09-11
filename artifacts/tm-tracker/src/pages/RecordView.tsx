import { getRecord } from "@/lib/api";
import type { TrademarkRecord, TmMatches, JournalRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateShort, formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Edit2, Printer, CheckCircle2, MinusCircle,
  Image as ImageIcon, FileText, User, MapPin, Building2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RecordModal } from "@/components/RecordModal";

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">{label}</div>
      <div className="font-mono text-sm text-[#0A1931] break-words">{value}</div>
    </div>
  );
}

function TmFormBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-bold border-2 ${
        active
          ? "border-[#0A6B52] text-[#0A6B52] bg-[#0D9970]/10"
          : "border-[#0C0C0C]/20 text-[#9d9488] bg-[#F0E8D0]"
      }`}
    >
      {active ? <CheckCircle2 className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function RecordView() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  // Local UI state for Stage 1–4 payment ticks (not yet persisted)
  const [payments, setPayments] = useState<Record<string, { paid: boolean; date: string }>>({
    "STAGE 1": { paid: false, date: "" },
    "STAGE 2": { paid: false, date: "" },
    "STAGE 3": { paid: false, date: "" },
    "STAGE 4": { paid: false, date: "" },
  });

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["trademark", params.id],
    queryFn: () => getRecord(params.id!),
    enabled: Boolean(params.id),
  });

  useEffect(() => {
    if (record) {
      // Could hydrate from notes or structured fields later
    }
  }, [record]);

  const handleEditSaved = () => {
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["trademark", params.id] });
  };

  const togglePayment = (stage: string) => {
    setPayments((prev) => ({
      ...prev,
      [stage]: {
        paid: !prev[stage].paid,
        date: !prev[stage].paid ? new Date().toISOString().slice(0, 10) : "",
      },
    }));
  };

  const setPaymentDate = (stage: string, date: string) => {
    setPayments((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], date },
    }));
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full font-mono text-[#6d6658] animate-pulse">
          LOADING RECORD…
        </div>
      </AppShell>
    );
  }

  if (error || !record) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="font-mono font-bold text-[#CC0000]">Record not found</div>
          <button
            onClick={() => navigate("/search")}
            className="px-4 py-2 border-2 border-[#0C0C0C] font-mono text-xs font-bold uppercase"
          >
            BACK TO SEARCH
          </button>
        </div>
      </AppShell>
    );
  }

  const matches: TmMatches = record.tmMatches ?? {
    TM5: false, TM6: false, TM11: false, TM16: false, TM56: false,
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-[#F0E8D0]">
        {/* Top bar */}
        <div className="shrink-0 px-4 py-3 bg-[#E8DFC7] border-b-2 border-[#0C0C0C] flex items-center gap-3 flex-wrap">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#0C0C0C] bg-white font-mono text-xs font-bold uppercase hover:bg-[#0C0C0C] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-lg uppercase tracking-wide text-[#0C0C0C] font-bold truncate">
              {record.appName || "—"}
            </div>
            <div className="font-mono text-[10px] text-[#6d6658]">
              {record.caseNumber} · {record.clientCode} · {record.type}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6B52] text-white font-mono text-xs font-bold uppercase border-2 border-[#0A6B52] hover:brightness-110"
            >
              <Edit2 className="w-3.5 h-3.5" /> EDIT
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#0C0C0C] font-mono text-xs font-bold uppercase hover:bg-[#0C0C0C] hover:text-white"
            >
              <Printer className="w-3.5 h-3.5" /> PRINT
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* Image + Name priority block */}
            <div className="border-2 border-[#0C0C0C] bg-white shadow-[4px_4px_0_#0C0C0C] p-4 flex gap-4 items-start">
              <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 border-2 border-[#0C0C0C] bg-[#F0E8D0] flex items-center justify-center overflow-hidden">
                {record.image ? (
                  <img
                    src={record.image}
                    alt={record.appName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-[#9d9488]" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="font-serif text-2xl sm:text-3xl uppercase tracking-wide text-[#0A1931] font-bold leading-tight">
                  {record.appName || "—"}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {record.stage && (
                    <span className={`px-3 py-1 font-mono text-sm font-bold uppercase border-2 border-[#0C0C0C] ${STAGE_BADGE[record.stage] ?? "bg-[#E8DFC7]"}`}>
                      {record.stage}
                    </span>
                  )}
                  {record.subStage && (
                    <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-[#0C0C0C]/40 bg-[#F0E8D0]">
                      {record.subStage}
                    </span>
                  )}
                  <span className="font-serif text-2xl font-bold text-[#6C1C1F]">{record.type || "—"}</span>
                </div>
                <div className="font-mono text-xs text-[#6d6658] flex flex-wrap gap-x-4 gap-y-1">
                  <span>TM: <strong className="text-[#0C0C0C]">{record.tmCprNo || "—"}</strong></span>
                  <span>CLASS: <strong className="text-[#0C0C0C]">{record.appClass || "—"}</strong></span>
                  <span>CASE: <strong className="text-[#0A6B52]">{record.caseNumber || "—"}</strong></span>
                </div>
              </div>
            </div>

            {/* Application Details — larger / different color */}
            <div className="border-2 border-[#0A1931] bg-[#0A1931] text-[#F0E8D0] shadow-[4px_4px_0_#0C0C0C] p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#C5B89A] mb-3">
                Application Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Client Code" value={record.clientCode} />
                <Field label="Case Number" value={record.caseNumber} />
                <Field label="Filing Date" value={record.date ? formatDateShort(record.date) : undefined} />
                <Field label="Case Type" value={record.caseType} />
                <Field label="TM / CPR Number" value={record.tmCprNo} />
                <Field label="Class" value={record.appClass} />
                <Field label="Client Name" value={record.clientName} wide />
              </div>
            </div>

            {/* Status & Sub-status duplicate emphasis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-2 border-[#0C0C0C] bg-white p-3 shadow-[3px_3px_0_#0C0C0C]">
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-1">Status</div>
                <div className={`inline-block px-3 py-1.5 font-mono text-base font-bold uppercase border-2 border-[#0C0C0C] ${STAGE_BADGE[record.stage] ?? "bg-[#E8DFC7]"}`}>
                  {record.stage || "—"}
                </div>
              </div>
              <div className="border-2 border-[#0C0C0C] bg-white p-3 shadow-[3px_3px_0_#0C0C0C]">
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-1">Sub-Status</div>
                <div className="font-mono text-base font-bold text-[#0A1931]">
                  {record.subStage || "—"}
                </div>
              </div>
            </div>

            {/* Agent detail — important */}
            <div className="border-2 border-[#0C0C0C] bg-white p-4 shadow-[3px_3px_0_#0C0C0C]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-2 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Agent Detail
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-[#6d6658]">Agent</div>
                  <div className="font-mono text-sm font-bold text-[#0A1931]">{record.agent || "—"}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-[#6d6658] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Agent City
                  </div>
                  <div className="font-mono text-sm font-bold text-[#0A1931]">{record.city || "—"}</div>
                </div>
              </div>
            </div>

            {/* TM Forms */}
            <div className="border-2 border-[#0C0C0C] bg-white p-4 shadow-[3px_3px_0_#0C0C0C]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-2">Document Status</div>
              <div className="flex flex-wrap gap-1.5">
                <TmFormBadge label="TM5" active={matches.TM5} />
                <TmFormBadge label="TM6" active={matches.TM6} />
                <TmFormBadge label="TM11" active={matches.TM11} />
                <TmFormBadge label="TM16" active={matches.TM16} />
                <TmFormBadge label="TM56" active={matches.TM56} />
              </div>
            </div>

            {/* Stage payment ticks — Stage 1–4 */}
            <div className="border-2 border-[#0C0C0C] bg-white p-4 shadow-[3px_3px_0_#0C0C0C]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-2">
                Stage Payments
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"] as const).map((stage) => (
                  <div
                    key={stage}
                    className={`border-2 p-3 ${payments[stage].paid ? "border-[#0A6B52] bg-[#0D9970]/10" : "border-[#0C0C0C]/30 bg-[#F0E8D0]"}`}
                  >
                    <div className="font-mono text-[10px] font-bold uppercase mb-2">{stage}</div>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={payments[stage].paid}
                        onChange={() => togglePayment(stage)}
                        className="w-4 h-4 accent-[#0A6B52]"
                      />
                      <span className="font-mono text-xs font-bold">
                        {payments[stage].paid ? "PAID" : "UNPAID"}
                      </span>
                    </label>
                    <input
                      type="date"
                      value={payments[stage].date}
                      onChange={(e) => setPaymentDate(stage, e.target.value)}
                      disabled={!payments[stage].paid}
                      className="w-full h-8 px-2 border border-[#0C0C0C]/40 font-mono text-xs bg-white disabled:opacity-40"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Office Notes */}
            <div className="border-2 border-[#0C0C0C] bg-white p-4 shadow-[3px_3px_0_#0C0C0C]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Office Notes & Manual Proceeding Remarks
              </div>
              <div className="font-mono text-sm text-[#0A1931] whitespace-pre-wrap min-h-[60px]">
                {record.notes || "—"}
              </div>
            </div>

            {/* Signature block */}
            <div className="border-2 border-[#0C0C0C] bg-white p-4 shadow-[3px_3px_0_#0C0C0C]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-3">
                3. CEO BRANDEX SIGNATURE/STAMP
              </div>
              <div className="flex flex-col sm:flex-row gap-6 items-end">
                <div className="flex-1 border-b-2 border-[#0C0C0C] h-16" />
                <div className="font-mono text-[10px] text-[#6d6658] uppercase tracking-wider">
                  Date: _______________
                </div>
              </div>
            </div>

            {/* Journal if present */}
            {record.journal && (
              <div className="border-2 border-[#0A6B52] bg-[#0D9970]/5 p-4">
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#0A6B52] mb-2">Journal Record</div>
                <div className="font-mono text-xs space-y-1">
                  <div>Journal No: <strong>{String(record.journal["Journal No"] || "")}</strong></div>
                  <div>Date: <strong>{record.journal["Journal Date"] ? formatDateShort(String(record.journal["Journal Date"])) : ""}</strong></div>
                </div>
              </div>
            )}

            {/* Last modified */}
            <div className="font-mono text-[10px] text-[#6d6658] text-right">
              Last modified: {record.updatedAt ? formatDate(record.updatedAt) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Print stylesheet target — simplified A4 layout */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {editOpen && (
        <RecordModal
          record={record}
          onClose={() => setEditOpen(false)}
          onSaved={handleEditSaved}
        />
      )}
    </AppShell>
  );
}
