/**
 * Brandex API client — talks directly to Google Apps Script Web App.
 *
 * Set VITE_APPS_SCRIPT_URL in your .env file:
 *   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 */

const GAS_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

if (!GAS_URL) {
  console.warn(
    "[Brandex] VITE_APPS_SCRIPT_URL is not set. API calls will fail. " +
    "Add it to your .env file: VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/..."
  );
}

// ---------------------------------------------------------------------------
// Types — 24-column DATABASE schema
// ---------------------------------------------------------------------------

/** Raw row from Google Sheets (24 cols) */
export interface Trademark {
  ID: string;
  DATE: string;
  TYPE: string;
  "CLIENT CODE": string;
  "CASE NUMBER": string;
  "CLIENT NAME": string;
  "APPLICATION NAME": string;
  "TM/CPR NUMBER": string;
  CLASS: string;
  STATUS: string;
  "SUB STATUS": string;
  "CASE TYPE": string;
  AGENT: string;
  CITY: string;
  NOTES: string;
  TM5: string;
  TM6: string;
  TM11: string;
  TM16: string;
  TM56: string;
  "JOURNAL NUMBER": string;
  "JOURNAL DATE": string;
  "LAST MODIFIED": string;
  IMAGE: string;
  // Enrichment from GAS server (only in getRecord / searchTm)
  _tmMatches?: TmMatches;
  _journal?: JournalRecord | null;
}

/** Normalized UI-friendly record */
export interface TrademarkRecord {
  id: string;
  date: string;
  type: string;
  /** @deprecated use type */
  prefix: string;
  clientCode: string;
  /** @deprecated use clientCode */
  clientNo: string;
  caseNumber: string;
  /** @deprecated use caseNumber */
  folderNo: string;
  /** @deprecated use caseNumber */
  caseNo: string;
  clientName: string;
  appName: string;
  tmCprNo: string;
  /** @deprecated use tmCprNo */
  tmNo: string;
  appClass: string;
  stage: string;
  subStage: string;
  caseType: string;
  agent: string;
  city: string;
  notes: string;
  updatedAt: string;
  image: string;
  // Stored reference fields (set by GAS after matching)
  tm5: string;
  tm6: string;
  tm11: string;
  tm16: string;
  tm56: string;
  journalNumber: string;
  journalDate: string;
  // Enrichment
  tmMatches?: TmMatches;
  journal?: JournalRecord | null;
}

export interface TmMatches {
  TM5: boolean;
  TM6: boolean;
  TM11: boolean;
  TM16: boolean;
  TM56: boolean;
}

export interface JournalRecord {
  found: boolean;
  "Application No"?: string;
  "Journal No"?: string;
  "Journal Date"?: string;
  Title?: string;
  Class?: string;
  "Applicant Name and Address"?: string;
  "Agent Name and Address"?: string;
  "Date of Filing"?: string;
  [key: string]: string | boolean | undefined;
}

export interface AuditLogEntry {
  id: number;
  changedAt: string;
  changedBy: string;
  action: string;
  recordId: string;
  caseNo: string;
  /** Legacy compat — same as caseNo or recordId */
  record: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface TrademarkStats {
  total: number;
  recentlyModified: number;
  byStage: Array<{ stage: string; count: number }>;
  byCity: Array<{ city: string; count: number }>;
  byNumericStage: Array<{ stage: string; count: number }>;
}

export interface TrademarkInput {
  id?: string;
  date?: string;
  type?: string;
  /** @deprecated use type */
  prefix?: string;
  clientCode?: string;
  /** @deprecated use clientCode */
  clientNo?: string;
  caseNumber?: string;
  /** @deprecated use caseNumber */
  caseNo?: string;
  /** @deprecated use caseNumber */
  folderNo?: string;
  clientName?: string;
  appName?: string;
  tmCprNo?: string;
  /** @deprecated use tmCprNo */
  tmNo?: string;
  appClass?: string;
  stage?: string;
  subStage?: string;
  caseType?: string;
  agent?: string;
  city?: string;
  notes?: string;
  image?: string;
}

export interface TmSearchResult {
  records: TrademarkRecord[];
  tmMatches: TmMatches;
  journal: JournalRecord | null;
}

// ---------------------------------------------------------------------------
// Authoritative Constants
// ---------------------------------------------------------------------------
export const STAGES = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4", "STOPPED"] as const;
export type StageType = typeof STAGES[number];

export const STATUS_WORKFLOW: Record<string, string[]> = {
  "STAGE 1": [
    "Acknowledgment",
    "Examination",
  ],
  "STAGE 2": [
    "Assigned",
    "Accepted",
    "Hearing",
  ],
  "STAGE 3": [
    "D-Note Submitted",
    "D-Note Received",
    "OPPO: Filed",
    "OPPO: Received",
    "OPPO: Withdrawn",
    "Published",
  ],
  "STAGE 4": [
    "CER Dispatch",
    "CER Received",
    "CER Acknowledge",
  ],
  "STOPPED": [
    "Case Stopped",
  ],
};

export const CITIES = ["Islamabad", "Karachi", "Lahore", "Peshawar"] as const;
export const VALID_TYPES = ["X", "A", "N"] as const;

export interface UploadImageResult {
  fileId: string;
  url: string;
  thumbnailUrl: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
export function mapRowToRecord(row: Trademark): TrademarkRecord {
  return {
    id:          String(row["ID"] ?? "").trim(),
    date:        String(row["DATE"] ?? "").trim(),
    type:        String(row["TYPE"] ?? "").trim(),
    prefix:      String(row["TYPE"] ?? "").trim(),   // compat alias
    clientCode:  String(row["CLIENT CODE"] ?? "").trim(),
    clientNo:    String(row["CLIENT CODE"] ?? "").trim(),   // compat alias
    caseNumber:  String(row["CASE NUMBER"] ?? "").trim(),
    folderNo:    String(row["CASE NUMBER"] ?? "").trim(),   // compat alias
    caseNo:      String(row["CASE NUMBER"] ?? "").trim(),   // compat alias
    clientName:  String(row["CLIENT NAME"] ?? "").trim(),
    appName:     String(row["APPLICATION NAME"] ?? "").trim(),
    tmCprNo:     String(row["TM/CPR NUMBER"] ?? "").trim(),
    tmNo:        String(row["TM/CPR NUMBER"] ?? "").trim(),   // compat alias
    appClass:    String(row["CLASS"] ?? "").trim(),
    stage:       String(row["STATUS"] ?? "").trim(),
    subStage:    String(row["SUB STATUS"] ?? "").trim(),
    caseType:    String(row["CASE TYPE"] ?? "").trim(),
    agent:       String(row["AGENT"] ?? "").trim(),
    city:        String(row["CITY"] ?? "").trim(),
    notes:       String(row["NOTES"] ?? "").trim(),
    tm5:         String(row["TM5"] ?? "").trim(),
    tm6:         String(row["TM6"] ?? "").trim(),
    tm11:        String(row["TM11"] ?? "").trim(),
    tm16:        String(row["TM16"] ?? "").trim(),
    tm56:        String(row["TM56"] ?? "").trim(),
    journalNumber: String(row["JOURNAL NUMBER"] ?? "").trim(),
    journalDate:   String(row["JOURNAL DATE"] ?? "").trim(),
    updatedAt:   String(row["LAST MODIFIED"] ?? "").trim(),
    image:       String(row["IMAGE"] ?? "").trim(),
    tmMatches:   row["_tmMatches"],
    journal:     row["_journal"],
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
async function gasGet<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: "follow" });
  if (!res.ok) throw new Error(`GAS GET failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "GAS error");
  return data.data as T;
}

async function gasPost<T>(body: object): Promise<T> {
  // GAS CORS: send as text/plain to avoid preflight
  const res = await fetch(GAS_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GAS POST failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "GAS error");
  return data.data as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** List all records with optional client-side filtering */
export async function listTrademarks(params?: {
  search?: string;
  stage?: string;
  city?: string;
  caseType?: string;
  agent?: string;
  appClass?: string;
}): Promise<TrademarkRecord[]> {
  const rows = await gasGet<Trademark[]>({ action: "list" });

  // Filter out blank rows defensively (GAS already does this, but be safe)
  let records = rows
    .filter((r) => r["ID"] && String(r["ID"]).trim() !== "")
    .map(mapRowToRecord);

  if (params?.stage)    records = records.filter((r) => r.stage === params.stage);
  if (params?.city)     records = records.filter((r) => r.city === params.city);
  if (params?.caseType) records = records.filter((r) => r.caseType === params.caseType);
  if (params?.agent)    records = records.filter((r) => r.agent === params.agent);
  if (params?.appClass) records = records.filter((r) => r.appClass === params.appClass);
  if (params?.search) {
    const q = params.search.toLowerCase();
    records = records.filter(
      (r) =>
        r.clientName?.toLowerCase().includes(q) ||
        r.clientCode?.toLowerCase().includes(q) ||
        r.caseNumber?.toLowerCase().includes(q) ||
        r.appName?.toLowerCase().includes(q) ||
        r.tmCprNo?.toLowerCase().includes(q) ||
        r.appClass?.toLowerCase().includes(q) ||
        r.agent?.toLowerCase().includes(q)
    );
  }
  return records;
}

/** Fetch a single record enriched with TM matches and Journal data */
export async function getRecord(id: string): Promise<TrademarkRecord | null> {
  try {
    const row = await gasGet<Trademark>({ action: "getRecord", id });
    return mapRowToRecord(row);
  } catch {
    return null;
  }
}

/** Legacy alias used by RecordModal */
export async function getTrademark(id: string): Promise<TrademarkRecord | null> {
  return getRecord(id);
}

/** Search by TM/CPR Number — returns compact card data */
export async function searchTm(tmNo: string): Promise<TmSearchResult> {
  const raw = await gasGet<{
    records: Trademark[];
    tmMatches: TmMatches;
    journal: JournalRecord | null;
  }>({ action: "searchTm", tmNo });
  return {
    records: raw.records.map(mapRowToRecord),
    tmMatches: raw.tmMatches,
    journal: raw.journal,
  };
}

export async function createTrademark(input: TrademarkInput): Promise<{ id: string; caseNumber: string }> {
  return gasPost({ action: "create", record: input });
}

export async function updateTrademark(id: string, input: TrademarkInput): Promise<{ id: string }> {
  return gasPost({ action: "update", id, record: input });
}

export async function deleteTrademark(id: string): Promise<void> {
  await gasPost({ action: "delete", id });
}

export async function getStats(): Promise<TrademarkStats> {
  return gasGet<TrademarkStats>({ action: "stats" });
}

export async function listAuditLogs(limit = 100, offset = 0): Promise<AuditLogEntry[]> {
  return gasGet<AuditLogEntry[]>({
    action: "listLogs",
    limit: String(limit),
    offset: String(offset),
  });
}

export async function listAgents(): Promise<string[]> {
  return gasGet<string[]>({ action: "listAgents" });
}

export interface ClientRef {
  code: string;
  name: string;
}

export async function listClients(): Promise<ClientRef[]> {
  try {
    return await gasGet<ClientRef[]>({ action: "listClients" });
  } catch {
    return [];
  }
}

/**
 * Upload an image to Google Drive via Google Apps Script.
 * Returns the Drive file ID, shareable URL, and thumbnail preview URL.
 */
export async function uploadImage(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file from disk"));
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const parts = dataUrl.split(",");
        const base64Data = parts[1];
        if (!base64Data) {
          throw new Error("Unable to encode image data");
        }

        if (onProgress) onProgress(30);

        const result = await gasPost<UploadImageResult>({
          action: "uploadImage",
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64Data: base64Data,
        });

        if (onProgress) onProgress(100);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}
