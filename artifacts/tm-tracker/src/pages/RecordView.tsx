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
  CheckCircle2, MinusCircle, BookOpen, Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: { id: string };
}

// ── Small reusable pieces ────────────────────────────────────────────────────

function Field({ label, value, wide }: { label: string; value: string | undefined; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-1">
        {label}
      </div>
      <div className="font-mono text-sm text-[#0C0C0C] font-bold border-b border-[#0C0C0C]/10 pb-1 break-all min-h-[22px]">
        {value || ""}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 print:mb-2">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0C0C0C]">{title}</div>
      <div className="flex-1 h-0.5 bg-[#0C0C0C]/15" />
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function TmBadge({ name, matched }: { name: string; matched: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 border-2 font-mono text-xs font-bold ${
      matched
        ? "border-[#0A6B52] bg-[#0D9970]/10 text-[#0A6B52]"
        : "border-[#0C0C0C]/20 bg-white text-[#9d9488]"
    }`}>
      {matched
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <MinusCircle className="w-3.5 h-3.5 shrink-0" />}
      {name}
    </div>
  );
}

function TmMatchSection({ matches }: { matches: TmMatches | undefined }) {
  if (!matches) return null;
  const sheets = ["TM5", "TM6", "TM11", "TM16", "TM56"] as const;
  return (
    <div>
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
      <div>
        <SectionHead title="Journal" />
        <div className="flex items-center gap-2 font-mono text-xs text-[#9d9488] border-2 border-dashed border-[#0C0C0C]/15 p-4">
          <BookOpen className="w-4 h-4" />
          No published journal record found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="Journal" />
      <div className="border-2 border-[#0A6B52] bg-[#0D9970]/5 p-4 space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0A6B52] mb-2">
          <CheckCircle2 className="w-4 h-4" />
          JOURNAL FOUND
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Journal No</div>
            <div className="font-bold">{String(journal["Journal No"] || "")}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Journal Date</div>
            <div className="font-bold">{journal["Journal Date"] ? formatDateShort(journal["Journal Date"] as string) : ""}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Application No</div>
            <div className="font-bold">{String(journal["Application No"] || "")}</div>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Title</div>
            <div className="font-bold">{String(journal["Title"] || "")}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Class</div>
            <div className="font-bold">{String(journal["Class"] || "")}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Date of Filing</div>
            <div className="font-bold">{journal["Date of Filing"] ? formatDateShort(journal["Date of Filing"] as string) : ""}</div>
          </div>
        </div>
        {(journal["Applicant Name and Address"] || journal["Agent Name and Address"]) && (
          <div className="pt-2 border-t border-[#0A6B52]/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {journal["Applicant Name and Address"] && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Applicant</div>
                <div className="text-[#0C0C0C] leading-relaxed whitespace-pre-wrap">{journal["Applicant Name and Address"] as string}</div>
              </div>
            )}
            {journal["Agent Name and Address"] && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-0.5">Agent</div>
                <div className="text-[#0C0C0C] leading-relaxed whitespace-pre-wrap">{journal["Agent Name and Address"] as string}</div>
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

  // Determine if it's a Google Drive file ID or full URL
  const isUrl = img.startsWith("http");
  const thumbUrl = isUrl
    ? img
    : `https://drive.google.com/thumbnail?id=${img}&sz=w200`;
  const fullUrl = isUrl
    ? img
    : `https://drive.google.com/file/d/${img}/view`;

  return (
    <div>
      <SectionHead title="Trademark Image" />
      <div className="flex items-start gap-4">
        <button
          onClick={() => setViewerOpen(true)}
          className="border-2 border-[#0C0C0C] overflow-hidden hover:border-[#C94A00] transition-colors w-[120px] h-[120px] flex items-center justify-center bg-white"
          title="Click to view full size"
        >
          <img
            src={thumbUrl}
            alt={record.appName}
            className="object-contain w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </button>
        <div className="flex flex-col gap-1 font-mono text-xs">
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">Image</div>
          <div className="font-bold truncate max-w-[200px]">{record.appName}</div>
          <div className="text-[#6d6658]">TM: {record.tmCprNo || "—"}</div>
          <div className="text-[#6d6658]">Class {record.appClass || "—"}</div>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C94A00] font-bold mt-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Open in Drive
          </a>
        </div>
      </div>

      {/* Full Image Viewer overlay */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewerOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#F0E8D0] border-4 border-[#0C0C0C] shadow-[12px_12px_0_#0C0C0C] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#0C0C0C] text-[#F0E8D0]">
              <span className="font-mono font-bold text-xs uppercase tracking-widest">
                {record.appName} — TM {record.tmCprNo}
              </span>
              <button
                onClick={() => setViewerOpen(false)}
                className="font-mono text-xs text-[#C5B89A] hover:text-white"
              >
                ✕ CLOSE
              </button>
            </div>
            <img
              src={isUrl ? img : `https://drive.google.com/thumbnail?id=${img}&sz=w800`}
              alt={record.appName}
              className="max-h-[80vh] w-auto mx-auto block"
            />
          </div>
        </div>
      )}
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
            <div className="font-mono font-bold text-[#6d6658] animate-pulse uppercase tracking-widest text-sm">
              Loading record from Google Sheets…
            </div>
            <div className="w-48 h-1 bg-[#0C0C0C]/10 mx-auto overflow-hidden">
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
          <div className="font-mono font-bold text-lg uppercase tracking-widest mb-2">Record Not Found</div>
          <div className="font-mono text-sm text-[#6d6658] mb-6">
            {error ? String(error) : `No record with ID "${id}" could be found.`}
          </div>
          <button
            onClick={() => navigate("/database")}
            className="flex items-center gap-2 px-5 py-2 bg-[#0C0C0C] text-[#F0E8D0] font-mono font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO DATABASE
          </button>
        </div>
      </AppShell>
    );
  }

  const stageColor = STATUS_COLOR[record.stage] ?? "bg-[#E8DFC7] text-[#0C0C0C]";

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
          className="flex items-center gap-2 px-4 py-1.5 bg-white text-[#0C0C0C] border-2 border-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#E8DFC7] transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> PRINT
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-[#F0E8D0]" id="record-view-body">
        <div className="max-w-5xl mx-auto p-6 space-y-8 print:p-0 print:space-y-6">

          {/* Print header */}
          <div className="hidden print:block border-b-2 border-[#0C0C0C] pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-serif text-3xl uppercase tracking-widest">BRANDEX</div>
                <div className="font-mono text-[10px] text-[#6d6658] uppercase tracking-widest">Trademark Registry</div>
              </div>
              <div className="font-mono text-xs text-right text-[#6d6658]">
                <div>Printed: {formatDate(new Date().toISOString())}</div>
                <div>Record ID: {record.id}</div>
              </div>
            </div>
          </div>

          {/* Record header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 border-b-2 border-[#0C0C0C] pb-6">
            <div className="flex-1">
              <div className="font-mono text-[10px] text-[#6d6658] font-bold uppercase tracking-widest mb-1">
                {record.caseNumber || record.id}
              </div>
              <h1 className="font-serif text-3xl uppercase tracking-wide text-[#0C0C0C] leading-tight">
                {record.appName || ""}
              </h1>
              <div className="font-mono text-sm text-[#6d6658] mt-1">
                {record.clientName}{record.clientCode ? ` · ${record.clientCode}` : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {record.stage && (
                <span className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#0C0C0C]/20 ${stageColor}`}>
                  {record.stage}
                </span>
              )}
              {record.subStage && (
                <span className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-2 border-[#0C0C0C]/15 bg-white text-[#6d6658]">
                  {record.subStage}
                </span>
              )}
              {record.tmCprNo && (
                <span className="font-mono text-sm font-bold text-[#0A6B52]">
                  TM {record.tmCprNo}
                </span>
              )}
            </div>
          </div>

          {/* Application Information */}
          <div>
            <SectionHead title="Application Information" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-5">
              <Field label="ID"               value={record.id} />
              <Field label="Date"             value={formatDateShort(record.date)} />
              <Field label="Type"             value={record.type} />
              <Field label="Client Code"      value={record.clientCode} />
              <Field label="Client Name"      value={record.clientName} wide />
              <Field label="Case Number"      value={record.caseNumber} />
              <Field label="Application Name" value={record.appName} wide />
              <Field label="TM / CPR Number"  value={record.tmCprNo} />
              <Field label="Class"            value={record.appClass} />
              <Field label="Status"           value={record.stage} />
              <Field label="Sub Status"       value={record.subStage} />
              <Field label="Case Type"        value={record.caseType} />
              <Field label="Agent"            value={record.agent} />
              <Field label="City"             value={record.city} />
              <Field label="Last Modified"    value={formatDate(record.updatedAt)} wide />
              {record.notes && (
                <div className="col-span-2 sm:col-span-3 md:col-span-4">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658] mb-1">Notes</div>
                  <div className="font-mono text-sm text-[#0C0C0C] border-2 border-[#0C0C0C]/10 bg-white p-3 whitespace-pre-wrap leading-relaxed">
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

          {/* Print footer */}
          <div className="hidden print:block border-t-2 border-[#0C0C0C] pt-4 mt-8">
            <div className="flex justify-between font-mono text-[9px] text-[#6d6658] uppercase tracking-widest">
              <span>Brandex Trademark Registry</span>
              <span>Confidential — Internal Use Only</span>
              <span>{record.caseNumber}</span>
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
