import { getRecord } from "@/lib/api";
import type { TrademarkRecord, TmMatches, JournalRecord } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { RecordModal } from "@/components/RecordModal";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Edit2, Printer, AlertCircle,
  CheckCircle2, MinusCircle, BookOpen,
  ExternalLink, FileEdit,
} from "lucide-react";

interface Props {
  params: { id: string };
}

// ── Small reusable pieces ────────────────────────────────────────────────────

function Field({ label, value, wide }: { label: string; value: string | undefined; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#3A506B] print:text-[#3A506B] mb-0.5">
        {label}
      </div>
      <div className="font-mono text-xs sm:text-sm text-[#0A1931] print:text-[#0A1931] font-bold border-b border-[#1E3E62]/20 pb-0.5 break-all min-h-[20px]">
        {value || ""}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5 print:mb-1.5">
      <div className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#0A1931] print:text-[#0A1931]">
        {title}
      </div>
      <div className="flex-1 h-[1.5px] bg-[#1E3E62]/20 print:bg-[#1E3E62]/30" />
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0A1931]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function TmBadge({ name, matched }: { name: string; matched: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 border font-mono text-[10px] font-bold ${
      matched
        ? "border-[#0A6B52] bg-[#0D9970]/10 text-[#0A6B52]"
        : "border-[#1E3E62]/20 bg-white text-[#6d6658]"
    }`}>
      {matched
        ? <CheckCircle2 className="w-3 h-3 shrink-0" />
        : <MinusCircle className="w-3 h-3 shrink-0" />}
      {name}
    </div>
  );
}

function TmMatchSection({ matches }: { matches: TmMatches | undefined }) {
  if (!matches) return null;
  const sheets = ["TM5", "TM6", "TM11", "TM16", "TM56"] as const;
  return (
    <div className="print-avoid-break">
      <SectionHead title="Document Status" />
      <div className="flex flex-wrap gap-2">
        {sheets.map((s) => (
          <TmBadge key={s} name={s} matched={matches[s]} />
        ))}
      </div>
    </div>
  );
}

function JournalSection({ journal }: { journal: JournalRecord | null | undefined }) {
  if (!journal) {
    return (
      <div className="print:hidden">
        <SectionHead title="Journal" />
        <div className="flex items-center gap-2 font-mono text-xs text-[#3A506B] border border-dashed border-[#1E3E62]/20 p-3 bg-white">
          <BookOpen className="w-4 h-4" />
          No published journal record found.
        </div>
      </div>
    );
  }

  return (
    <div className="print-avoid-break">
      <SectionHead title="Journal Information" />
      <div className="border border-[#0A6B52] bg-[#0D9970]/5 p-3 print:p-2 space-y-2 text-[#0A1931]">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#0A6B52]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          PUBLISHED JOURNAL RECORD
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Journal No</div>
            <div className="font-bold">{String(journal["Journal No"] || "")}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Journal Date</div>
            <div className="font-bold">{journal["Journal Date"] ? formatDateShort(journal["Journal Date"] as string) : ""}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Application No</div>
            <div className="font-bold">{String(journal["Application No"] || "")}</div>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Title</div>
            <div className="font-bold">{String(journal["Title"] || "")}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Class</div>
            <div className="font-bold">{String(journal["Class"] || "")}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Date of Filing</div>
            <div className="font-bold">{journal["Date of Filing"] ? formatDateShort(journal["Date of Filing"] as string) : ""}</div>
          </div>
        </div>
        {(journal["Applicant Name and Address"] || journal["Agent Name and Address"]) && (
          <div className="pt-1.5 border-t border-[#0A6B52]/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {journal["Applicant Name and Address"] && (
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Applicant</div>
                <div className="text-[#0A1931] leading-tight whitespace-pre-wrap">{journal["Applicant Name and Address"] as string}</div>
              </div>
            )}
            {journal["Agent Name and Address"] && (
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Agent</div>
                <div className="text-[#0A1931] leading-tight whitespace-pre-wrap">{journal["Agent Name and Address"] as string}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageSection({ record }: { record: TrademarkRecord }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const img = record.image;
  if (!img) return null;

  const thumbUrl = img;
  const fullUrl = img;

  return (
    <div className="print-avoid-break">
      <SectionHead title="Trademark Image" />
      <div className="flex items-start gap-4">
        <button
          onClick={() => setViewerOpen(true)}
          className="border-2 border-[#1E3E62] overflow-hidden hover:border-[#C94A00] transition-colors w-[100px] h-[100px] print:w-[80px] print:h-[80px] flex items-center justify-center bg-white shrink-0 shadow-sm"
          title="Click to view full size"
        >
          <img
            src={thumbUrl}
            alt={record.appName}
            className="object-contain w-full h-full p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </button>
        <div className="flex flex-col gap-1 font-mono text-xs print:text-[10px]">
          <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B]">Mark Details</div>
          <div className="font-bold truncate max-w-[200px] text-[#0A1931]">{record.appName}</div>
          <div className="text-[#3A506B]">TM: {record.tmCprNo || ""}</div>
          <div className="text-[#3A506B]">Class {record.appClass || ""}</div>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C94A00] font-bold mt-0.5 hover:underline print:hidden"
          >
            <ExternalLink className="w-3 h-3" /> Open Full Image
          </a>
        </div>
      </div>

      {/* Full Image Viewer overlay */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:hidden"
          onClick={() => setViewerOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#F0E8D0] border-4 border-[#1E3E62] shadow-[12px_12px_0_#1E3E62] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#1E3E62] text-white">
              <span className="font-mono font-bold text-xs uppercase tracking-widest">
                {record.appName} — TM {record.tmCprNo}
              </span>
              <button
                onClick={() => setViewerOpen(false)}
                className="font-mono text-xs text-[#E8DFC7] hover:text-white"
              >
                ✕ CLOSE
              </button>
            </div>
            <img
              src={img}
              alt={record.appName}
              className="max-h-[80vh] w-auto mx-auto block"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Manual Writing Notes Section for Legal Printouts ────────────────────────

function ManualNotesSection() {
  return (
    <div className="print-avoid-break mt-3 print:mt-2">
      <SectionHead title="Office Notes & Manual Proceeding Remarks" />
      <div className="border border-[#1E3E62]/40 bg-white p-3 print:p-2 space-y-3 font-mono">
        {/* Hearing / Proceeding Notes Lines */}
        <div>
          <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-1">
            <span>1. Hearing / Court Proceedings & Orders</span>
            <span>Date: _________________</span>
          </div>
          <div className="space-y-4 pt-1">
            <div className="border-b border-dashed border-[#1E3E62]/30 h-4" />
            <div className="border-b border-dashed border-[#1E3E62]/30 h-4" />
            <div className="border-b border-dashed border-[#1E3E62]/30 h-4" />
          </div>
        </div>

        {/* Action Required & Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1E3E62]/15">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-1">
              2. Action Required / Follow-up Steps
            </div>
            <div className="space-y-4 pt-1">
              <div className="border-b border-dashed border-[#1E3E62]/30 h-4" />
              <div className="border-b border-dashed border-[#1E3E62]/30 h-4" />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#3A506B] mb-1">
              3. Counsel / Officer Signature & Stamp
            </div>
            <div className="flex items-end justify-between gap-2 pt-2">
              <div className="text-[8px] text-[#3A506B] space-y-1">
                <div>Sign: ___________________</div>
                <div>Date: ___________________</div>
              </div>
              <div className="w-28 h-12 border-2 border-dashed border-[#1E3E62]/30 rounded flex items-center justify-center text-[7px] font-bold uppercase text-[#3A506B] tracking-wider text-center p-1">
                Official Stamp Box
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main RecordView page ─────────────────────────────────────────────────────

export function RecordView({ params }: Props) {
  const { id } = params;
  const [, navigate] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: record, isLoading, error, refetch } = useQuery<TrademarkRecord | null>({
    queryKey: ["record", id],
    queryFn: () => getRecord(id),
    staleTime: 30_000,
    retry: 1,
  });

  const handlePrint = () => window.print();

  const handleEditSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["record", id] });
    queryClient.invalidateQueries({ queryKey: ["trademarks"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    refetch();
    setEditOpen(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full bg-[#F0E8D0]">
          <div className="text-center space-y-3">
            <div className="font-mono font-bold text-[#3A506B] animate-pulse uppercase tracking-widest text-sm">
              Loading secure record…
            </div>
            <div className="w-48 h-1 bg-[#1E3E62]/10 mx-auto overflow-hidden">
              <div className="h-full bg-[#C94A00] animate-[slide_1.2s_ease-in-out_infinite]" style={{ width: "40%" }} />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Error / Not Found ────────────────────────────────────────────────────
  if (error || !record) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full bg-[#F0E8D0] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#C94A00] mb-4" />
          <div className="font-mono font-bold text-lg text-[#0A1931] uppercase tracking-widest mb-2">Record Not Found</div>
          <div className="font-mono text-sm text-[#3A506B] mb-6">
            {error ? String(error) : `No record with ID "${id}" could be found.`}
          </div>
          <button
            onClick={() => navigate("/database")}
            className="flex items-center gap-2 px-5 py-2 bg-[#0A1931] text-[#F0E8D0] font-mono font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO DATABASE
          </button>
        </div>
      </AppShell>
    );
  }

  const stageColor = STATUS_COLOR[record.stage] ?? "bg-[#E8DFC7] text-[#0A1931]";

  return (
    <AppShell>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 bg-[#0C0C0C] text-[#F0E8D0] print:hidden">
        <button
          onClick={() => navigate(-1 as unknown as string)}
          className="flex items-center gap-1.5 text-[#C5B89A] hover:text-[#F0E8D0] font-mono text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#C94A00] text-white border-2 border-[#C94A00] font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" /> EDIT
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 bg-white text-[#0A1931] border-2 border-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#E8DFC7] transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> PRINT RECORD (A4)
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-[#F0E8D0] print:bg-white" id="record-view-body">
        <div className="max-w-5xl mx-auto p-6 space-y-6 print:p-0 print:space-y-3">

          {/* Print Letterhead Header (Dark Blue Typography & Logo) */}
          <div className="hidden print:block border-b-2 border-[#1E3E62] pb-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/brandex-logo.png"
                  alt="Brandex Law Associates"
                  className="w-14 h-14 object-contain bg-white rounded p-0.5 border border-[#1E3E62]/30"
                />
                <div>
                  <div className="font-serif text-2xl tracking-wider text-[#0A1931] uppercase leading-none font-bold">
                    BRANDEX LAW ASSOCIATES
                  </div>
                  <div className="font-mono text-[9px] text-[#C94A00] uppercase tracking-widest font-bold mt-1">
                    Advocates, IP Attorneys & Trademark Consultants
                  </div>
                  <div className="font-mono text-[8px] text-[#3A506B] mt-0.5">
                    Web: www.brandex.pk · Official Trademark Docket
                  </div>
                </div>
              </div>
              <div className="font-mono text-[9px] text-right text-[#3A506B] leading-relaxed">
                <div><span className="font-bold text-[#0A1931]">PRINTED:</span> {formatDate(new Date().toISOString())}</div>
                <div><span className="font-bold text-[#0A1931]">RECORD ID:</span> {record.id}</div>
                <div><span className="font-bold text-[#0A1931]">CASE REF:</span> {record.caseNumber || "—"}</div>
              </div>
            </div>
          </div>

          {/* Record title bar */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 border-b-2 border-[#1E3E62]/30 pb-4 print:pb-2">
            <div className="flex-1">
              <div className="font-mono text-[9px] sm:text-[10px] text-[#3A506B] font-bold uppercase tracking-widest mb-0.5">
                {record.caseNumber ? `CASE: ${record.caseNumber}` : `ID: ${record.id}`}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl uppercase tracking-wide text-[#0A1931] leading-tight">
                {record.appName || ""}
              </h1>
              <div className="font-mono text-xs sm:text-sm text-[#3A506B] mt-0.5">
                {record.clientName}{record.clientCode ? ` · [${record.clientCode}]` : ""}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0">
              {record.stage && (
                <span className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border border-[#1E3E62]/20 ${stageColor}`}>
                  {record.stage}
                </span>
              )}
              {record.subStage && (
                <span className="px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border border-[#1E3E62]/20 bg-white text-[#3A506B]">
                  {record.subStage}
                </span>
              )}
              {record.tmCprNo && (
                <span className="font-mono text-xs sm:text-sm font-bold text-[#0A6B52]">
                  TM {record.tmCprNo}
                </span>
              )}
            </div>
          </div>

          {/* Application Information (Compact 4-column layout) */}
          <div className="print-avoid-break">
            <SectionHead title="Application Details" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 print:gap-x-3 print:gap-y-2 bg-white print:bg-transparent p-4 print:p-0 border-2 print:border-none border-[#1E3E62]/15">
              <Field label="Record ID"        value={record.id} />
              <Field label="Filing Date"      value={formatDateShort(record.date)} />
              <Field label="Series / Type"    value={record.type} />
              <Field label="Client Code"      value={record.clientCode} />
              <Field label="Client Name"      value={record.clientName} wide />
              <Field label="Case Number"      value={record.caseNumber} />
              <Field label="TM / CPR Number"  value={record.tmCprNo} />
              <Field label="Application Name" value={record.appName} wide />
              <Field label="Class"            value={record.appClass} />
              <Field label="Status"           value={record.stage} />
              <Field label="Sub Status"       value={record.subStage} />
              <Field label="Case Type"        value={record.caseType} />
              <Field label="City"             value={record.city} />
              <Field label="Agent / Counsel"  value={record.agent} />
              <Field label="Last Modified"    value={formatDate(record.updatedAt)} wide />
              {record.notes && (
                <div className="col-span-2 sm:col-span-4">
                  <div className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#3A506B] mb-0.5">Notes</div>
                  <div className="font-mono text-xs text-[#0A1931] border border-[#1E3E62]/20 bg-[#F0E8D0]/40 print:bg-white p-2 whitespace-pre-wrap leading-relaxed">
                    {record.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Status (TM Matches) */}
          <TmMatchSection matches={record.tmMatches} />

          {/* Journal */}
          <JournalSection journal={record.journal} />

          {/* Image */}
          <ImageSection record={record} />

          {/* Blank Notes Boxes for Manual Proceeding Notes & Writing */}
          <ManualNotesSection />

          {/* Print footer */}
          <div className="hidden print:block border-t border-[#1E3E62]/30 pt-2 mt-4 text-[#3A506B]">
            <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest">
              <span>BRANDEX LAW ASSOCIATES · TRADEMARK REGISTRY</span>
              <span>CONFIDENTIAL — INTERNAL / COURT USE ONLY</span>
              <span>CASE REF: {record.caseNumber || record.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <RecordModal
          recordId={record.id}
          isNew={false}
          onClose={() => setEditOpen(false)}
          onSaved={handleEditSaved}
        />
      )}
    </AppShell>
  );
}
