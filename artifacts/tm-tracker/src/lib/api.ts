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
// Types
// ---------------------------------------------------------------------------
export interface Trademark {
  ID: string;
  DATE: string;
  TYPE: string;
  "CLIENT CODE": string;
  "CLIENT NAME": string;
  "CASE NUMBER": string;
  "APPLICATION NAME": string;
  STATUS: string;
  "SUB STATUS": string;
  "TM NUMBER": string;
  CLASS: string;
  "CASE TYPE": string;
  CITY: string;
  NOTES: string;
  "LAST MODIFIED": string;
}

// Normalized version used by the UI components
export interface TrademarkRecord {
  id: string;
  date: string;
  prefix: string;
  clientNo: string;
  clientName: string;
  folderNo: string;
  caseNo: string;
  appName: string;
  stage: string;
  subStage: string;
  tmNo: string;
  appClass: string;
  caseType: string;
  city: string;
  notes: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  changedAt: string;
  changedBy: string;
  action: string;
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
  prefix?: string;
  type?: string;
  clientNo?: string;
  clientName?: string;
  caseNo?: string;
  folderNo?: string;
  appName?: string;
  stage?: string;
  subStage?: string;
  tmNo?: string;
  appClass?: string;
  caseType?: string;
  city?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
export function mapRowToRecord(row: Trademark): TrademarkRecord {
  return {
    id: row["ID"],
    date: row["DATE"],
    prefix: row["TYPE"],
    clientNo: row["CLIENT CODE"],
    clientName: row["CLIENT NAME"],
    folderNo: row["CASE NUMBER"],
    caseNo: row["CASE NUMBER"],
    appName: row["APPLICATION NAME"],
    stage: row["STATUS"],
    subStage: row["SUB STATUS"],
    tmNo: row["TM NUMBER"],
    appClass: row["CLASS"],
    caseType: row["CASE TYPE"],
    city: row["CITY"],
    notes: row["NOTES"],
    updatedAt: row["LAST MODIFIED"],
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
export async function listTrademarks(params?: {
  search?: string;
  stage?: string;
  city?: string;
  caseType?: string;
}): Promise<TrademarkRecord[]> {
  const rows = await gasGet<Trademark[]>({ action: "list" });
  let records = rows.map(mapRowToRecord);

  if (params?.stage) records = records.filter((r) => r.stage === params.stage);
  if (params?.city) records = records.filter((r) => r.city === params.city);
  if (params?.caseType) records = records.filter((r) => r.caseType === params.caseType);
  if (params?.search) {
    const q = params.search.toLowerCase();
    records = records.filter(
      (r) =>
        r.clientName?.toLowerCase().includes(q) ||
        r.clientNo?.toLowerCase().includes(q) ||
        r.folderNo?.toLowerCase().includes(q) ||
        r.appName?.toLowerCase().includes(q) ||
        r.tmNo?.toLowerCase().includes(q) ||
        r.appClass?.toLowerCase().includes(q)
    );
  }
  return records;
}

export async function getTrademark(id: string): Promise<TrademarkRecord | null> {
  const records = await listTrademarks();
  return records.find((r) => r.id === id) ?? null;
}

export async function createTrademark(input: TrademarkInput): Promise<{ id: string; folderNo: string }> {
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
