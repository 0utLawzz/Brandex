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
// Mappers
// ---------------------------------------------------------------------------
export function mapRowToRecord(row: Trademark): TrademarkRecord {
  return {
    id:          row["ID"]                ?? "",
    date:        row["DATE"]              ?? "",
    type:        row["TYPE"]              ?? "",
    prefix:      row["TYPE"]              ?? "",   // compat alias
    clientCode:  row["CLIENT CODE"]       ?? "",
    clientNo:    row["CLIENT CODE"]       ?? "",   // compat alias
    caseNumber:  row["CASE NUMBER"]       ?? "",
    folderNo:    row["CASE NUMBER"]       ?? "",   // compat alias
    caseNo:      row["CASE NUMBER"]       ?? "",   // compat alias
    clientName:  row["CLIENT NAME"]       ?? "",
    appName:     row["APPLICATION NAME"]  ?? "",
    tmCprNo:     row["TM/CPR NUMBER"]     ?? "",
    tmNo:        row["TM/CPR NUMBER"]     ?? "",   // compat alias
    appClass:    row["CLASS"]             ?? "",
    stage:       row["STATUS"]            ?? "",
    subStage:    row["SUB STATUS"]        ?? "",
    caseType:    row["CASE TYPE"]         ?? "",
    agent:       row["AGENT"]             ?? "",
    city:        row["CITY"]              ?? "",
    notes:       row["NOTES"]             ?? "",
    tm5:         row["TM5"]               ?? "",
    tm6:         row["TM6"]               ?? "",
    tm11:        row["TM11"]              ?? "",
    tm16:        row["TM16"]              ?? "",
    tm56:        row["TM56"]              ?? "",
    journalNumber: row["JOURNAL NUMBER"]  ?? "",
    journalDate:   row["JOURNAL DATE"]    ?? "",
    updatedAt:   row["LAST MODIFIED"]     ?? "",
    image:       row["IMAGE"]             ?? "",
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
