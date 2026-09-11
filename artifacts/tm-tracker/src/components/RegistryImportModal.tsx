import { useMemo, useState } from "react";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  commitFormImport,
  commitJournalImport,
  dryRunFormImport,
  dryRunJournalImport,
  type DryRunResult,
  type FormRegistryRow,
  type JournalRegistryRow,
} from "@/lib/registryImport";

type Kind = "form" | "journal";

interface Props {
  onClose: () => void;
  onCommitted?: () => void;
}

export function RegistryImportModal({ onClose, onCommitted }: Props) {
  const [kind, setKind] = useState<Kind>("form");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMsg, setCommitMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const insertRows = useMemo(() => {
    if (!dryRun) return [];
    return dryRun.items.filter((i) => i.action === "insert").map((i) => i.row);
  }, [dryRun]);

  const onFile = async (file: File | null) => {
    setError(null);
    setDryRun(null);
    setCommitMsg(null);
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
  };

  const runDry = async () => {
    if (!csvText.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    setRunning(true);
    setError(null);
    setCommitMsg(null);
    try {
      const result =
        kind === "form" ? await dryRunFormImport(csvText) : await dryRunJournalImport(csvText);
      setDryRun(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dry-run failed");
    } finally {
      setRunning(false);
    }
  };

  const runCommit = async () => {
    if (!insertRows.length) return;
    setCommitting(true);
    setError(null);
    try {
      const result =
        kind === "form"
          ? await commitFormImport(insertRows as FormRegistryRow[])
          : await commitJournalImport(insertRows as JournalRegistryRow[]);
      if (result.errors.length) {
        setError(result.errors.join("; "));
      }
      setCommitMsg(
        `Committed ${result.inserted} row(s)` +
          (result.skipped ? ` · ${result.skipped} skipped` : "") +
          (result.errors.length ? ` · ${result.errors.length} error(s)` : ""),
      );
      onCommitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commit failed");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-[#0C0C0C] bg-[#FFF9F0] shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b-2 border-[#0C0C0C] bg-[#E8DFC7] px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 text-[#0A6B52]" />
          <h2 className="font-serif text-xl uppercase tracking-widest text-[#0C0C0C]">
            Admin CSV Import
          </h2>
          <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-[#6d6658]">
            Dry-run first
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#0C0C0C]/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kind toggle */}
        <div className="flex gap-2 border-b border-[#0C0C0C]/15 px-4 py-3">
          {(["form", "journal"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setDryRun(null);
                setCommitMsg(null);
                setError(null);
              }}
              className={`h-9 px-4 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#0C0C0C] ${
                kind === k ? "bg-[#0C0C0C] text-[#F0E8D0]" : "bg-white text-[#0C0C0C]"
              }`}
            >
              {k === "form" ? "Form registry (TM5–56)" : "Journal registry"}
            </button>
          ))}
        </div>

        {/* File + actions */}
        <div className="space-y-3 border-b border-[#0C0C0C]/15 px-4 py-4">
          <p className="font-mono text-[11px] text-[#6d6658]">
            {kind === "form"
              ? "Expected columns: serial, office, TM number, class, type (tm5/tm6/tm11/tm16/tm56), status, date (col G)."
              : "Expected columns: Journal No, Journal Date, Application No (TM), Class, Applicant, Agent, Date of Filing, Generated Doc."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 cursor-pointer items-center gap-2 border-2 border-[#0C0C0C] bg-white px-4 font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#E8DFC7]">
              <Upload className="h-4 w-4" />
              Choose CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="font-mono text-xs text-[#0C0C0C]">{fileName || "No file selected"}</span>
            <button
              type="button"
              onClick={runDry}
              disabled={running || !csvText}
              className="ml-auto flex h-10 items-center gap-2 border-2 border-[#0A6B52] bg-[#0A6B52] px-4 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {running ? "Running…" : "Dry-run"}
            </button>
          </div>
          {error && (
            <div className="flex items-start gap-2 border-2 border-[#CC0000] bg-[#CC0000]/10 px-3 py-2 font-mono text-xs text-[#CC0000]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {commitMsg && (
            <div className="flex items-start gap-2 border-2 border-[#0A6B52] bg-[#0A6B52]/10 px-3 py-2 font-mono text-xs text-[#0A6B52]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{commitMsg}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {!dryRun && (
            <p className="py-8 text-center font-mono text-xs font-bold uppercase tracking-widest text-[#9d9488]">
              Upload a CSV and run dry-run to preview inserts.
            </p>
          )}
          {dryRun && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Valid", dryRun.valid],
                  ["Invalid", dryRun.invalid],
                  ["Would insert", dryRun.wouldInsert],
                  ["Duplicates", dryRun.wouldSkipDuplicate],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="border-2 border-[#0C0C0C] bg-white px-3 py-2 text-center"
                  >
                    <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6d6658]">
                      {label}
                    </div>
                    <div className="font-serif text-2xl text-[#0C0C0C]">{value}</div>
                  </div>
                ))}
              </div>

              {dryRun.errors.length > 0 && (
                <div className="max-h-28 overflow-auto border border-[#CC0000]/40 bg-[#CC0000]/5 p-2 font-mono text-[10px] text-[#CC0000]">
                  {dryRun.errors.slice(0, 40).map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                  {dryRun.errors.length > 40 && (
                    <div>…and {dryRun.errors.length - 40} more</div>
                  )}
                </div>
              )}

              <div className="max-h-56 overflow-auto border-2 border-[#0C0C0C] bg-white">
                <table className="w-full font-mono text-[10px]">
                  <thead className="sticky top-0 bg-[#0C0C0C] text-[#F0E8D0]">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Action</th>
                      <th className="px-2 py-1.5 text-left">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRun.items.slice(0, 200).map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          item.action === "insert"
                            ? "border-b border-[#0C0C0C]/10 bg-[#0A6B52]/5"
                            : "border-b border-[#0C0C0C]/10 bg-[#9d9488]/10"
                        }
                      >
                        <td className="px-2 py-1 font-bold uppercase">
                          {item.action === "insert" ? "INSERT" : "SKIP"}
                        </td>
                        <td className="px-2 py-1">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dryRun.items.length > 200 && (
                  <p className="px-2 py-1 text-center text-[#6d6658]">
                    Showing first 200 of {dryRun.items.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t-2 border-[#0C0C0C] bg-[#E8DFC7] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 border-2 border-[#0C0C0C] bg-white px-4 font-mono text-xs font-bold uppercase tracking-wider"
          >
            Close
          </button>
          <button
            type="button"
            onClick={runCommit}
            disabled={committing || !insertRows.length || Boolean(commitMsg)}
            className="ml-auto flex h-10 items-center gap-2 border-2 border-[#6C1C1F] bg-[#6C1C1F] px-4 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {committing
              ? "Committing…"
              : `Commit ${insertRows.length} insert${insertRows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
