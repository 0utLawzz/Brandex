/** Brandex browser data layer — Supabase is primary; Sheet mirroring is server-side. */

import { isSupabaseConfigured, supabase, TRADEMARK_FILES_BUCKET } from "./supabase";

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
  /** Private Supabase Storage path; image is the temporary signed display URL. */
  imagePath?: string;
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

type SupabaseTrademarkRow = {
  id: string;
  filing_date: string;
  type: string;
  client_code: string;
  client_name: string | null;
  case_number: string;
  application_name: string;
  tm_cpr_number: string | null;
  nice_class: string | null;
  status: string;
  sub_status: string | null;
  case_type: string | null;
  agent: string | null;
  city: string;
  notes: string | null;
  tm5: boolean;
  tm6: boolean;
  tm11: boolean;
  tm16: boolean;
  tm56: boolean;
  journal_number: string | null;
  journal_date: string | null;
  journal_data: JournalRecord | null;
  logo_path: string | null;
  legacy_image_url: string | null;
  updated_at: string;
};

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function rowToRecord(row: SupabaseTrademarkRow, signedImage = ""): TrademarkRecord {
  const matches: TmMatches = {
    TM5: row.tm5,
    TM6: row.tm6,
    TM11: row.tm11,
    TM16: row.tm16,
    TM56: row.tm56,
  };
  return {
    id: row.id,
    date: row.filing_date,
    type: row.type,
    prefix: row.type,
    clientCode: row.client_code,
    clientNo: row.client_code,
    caseNumber: row.case_number,
    folderNo: row.case_number,
    caseNo: row.case_number,
    clientName: row.client_name ?? "",
    appName: row.application_name,
    tmCprNo: row.tm_cpr_number ?? "",
    tmNo: row.tm_cpr_number ?? "",
    appClass: row.nice_class ?? "",
    stage: row.status,
    subStage: row.sub_status ?? "",
    caseType: row.case_type ?? "",
    agent: row.agent ?? "",
    city: row.city,
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
    image: signedImage || row.legacy_image_url || "",
    imagePath: row.logo_path || row.legacy_image_url || "",
    tm5: row.tm5 ? "YES" : "",
    tm6: row.tm6 ? "YES" : "",
    tm11: row.tm11 ? "YES" : "",
    tm16: row.tm16 ? "YES" : "",
    tm56: row.tm56 ? "YES" : "",
    journalNumber: row.journal_number ?? "",
    journalDate: row.journal_date ?? "",
    tmMatches: matches,
    journal: row.journal_data,
  };
}

async function mapRows(rows: SupabaseTrademarkRow[]): Promise<TrademarkRecord[]> {
  const paths = rows.map((row) => row.logo_path).filter((path): path is string => Boolean(path));
  const signedByPath = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(TRADEMARK_FILES_BUCKET).createSignedUrls(paths, 3600);
    data?.forEach((item, index) => {
      if (item.signedUrl) signedByPath.set(paths[index], item.signedUrl);
    });
  }
  return rows.map((row) => rowToRecord(row, row.logo_path ? signedByPath.get(row.logo_path) ?? "" : ""));
}

export function inputToRow(input: TrademarkInput) {
  const image = input.image?.trim() || null;
  const externalImage = image?.startsWith("http") ?? false;
  return {
    filing_date: input.date,
    type: input.type ?? input.prefix,
    client_code: input.clientCode ?? input.clientNo,
    client_name: input.clientName ?? null,
    case_number: input.caseNumber ?? input.caseNo ?? input.folderNo,
    application_name: input.appName,
    tm_cpr_number: input.tmCprNo ?? input.tmNo ?? null,
    nice_class: input.appClass ?? null,
    status: input.stage,
    sub_status: input.subStage ?? null,
    case_type: input.caseType ?? null,
    agent: input.agent ?? null,
    city: input.city,
    notes: input.notes ?? null,
    logo_path: externalImage ? null : image,
    legacy_image_url: externalImage ? image : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** List records using indexed database filters. */
export async function listTrademarks(params?: {
  search?: string;
  stage?: string;
  city?: string;
  caseType?: string;
  agent?: string;
  appClass?: string;
}): Promise<TrademarkRecord[]> {
  ensureConfigured();
  let query = supabase.from("trademarks").select("*").order("updated_at", { ascending: false });
  if (params?.stage) query = query.eq("status", params.stage);
  if (params?.city) query = query.eq("city", params.city);
  if (params?.caseType) query = query.eq("case_type", params.caseType);
  if (params?.agent) query = query.eq("agent", params.agent);
  if (params?.appClass) query = query.eq("nice_class", params.appClass);
  const { data, error } = await query;
  throwIfError(error);
  let records = await mapRows((data ?? []) as SupabaseTrademarkRow[]);
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
  ensureConfigured();
  const { data, error } = await supabase.from("trademarks").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return (await mapRows([data as SupabaseTrademarkRow]))[0];
}

/** Legacy alias used by RecordModal */
export async function getTrademark(id: string): Promise<TrademarkRecord | null> {
  return getRecord(id);
}

/** Search by TM/CPR Number — returns compact card data */
export async function searchTm(tmNo: string): Promise<TmSearchResult> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("trademarks")
    .select("*")
    .ilike("tm_cpr_number", tmNo.trim())
    .order("updated_at", { ascending: false });
  throwIfError(error);
  const records = await mapRows((data ?? []) as SupabaseTrademarkRow[]);
  const first = records[0];
  return {
    records,
    tmMatches: first?.tmMatches ?? { TM5: false, TM6: false, TM11: false, TM16: false, TM56: false },
    journal: first?.journal ?? null,
  };
}

export async function createTrademark(input: TrademarkInput): Promise<{ id: string; caseNumber: string }> {
  ensureConfigured();
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("trademarks")
    .insert({ ...inputToRow(input), created_by: authData.user?.id, updated_by: authData.user?.id })
    .select("id,case_number")
    .single();
  throwIfError(error);
  if (!data) throw new Error("Supabase did not return the created record.");
  return { id: data.id, caseNumber: data.case_number };
}

export async function updateTrademark(id: string, input: TrademarkInput): Promise<{ id: string }> {
  ensureConfigured();
  const { data, error } = await supabase.from("trademarks").update(inputToRow(input)).eq("id", id).select("id").single();
  throwIfError(error);
  if (!data) throw new Error("Supabase did not return the updated record.");
  return { id: data.id };
}

export async function deleteTrademark(id: string): Promise<void> {
  ensureConfigured();
  const { error } = await supabase.from("trademarks").delete().eq("id", id);
  throwIfError(error);
}

export async function getStats(): Promise<TrademarkStats> {
  const records = await listTrademarks();
  const countBy = (key: "stage" | "city") => Object.entries(records.reduce<Record<string, number>>((acc, row) => {
    const value = row[key] || "Unspecified";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {})).map(([name, count]) => ({ stage: name, city: name, count }));
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    total: records.length,
    recentlyModified: records.filter((record) => Date.parse(record.updatedAt) >= recentCutoff).length,
    byStage: countBy("stage").map(({ stage, count }) => ({ stage, count })),
    byCity: countBy("city").map(({ city, count }) => ({ city, count })),
    byNumericStage: countBy("stage").filter(({ stage }) => /^STAGE \d+$/.test(stage)).map(({ stage, count }) => ({ stage, count })),
  };
}

export async function listAuditLogs(limit = 100, offset = 0): Promise<AuditLogEntry[]> {
  ensureConfigured();
  const { data, error } = await supabase.from("audit_logs").select("*")
    .order("changed_at", { ascending: false }).range(offset, offset + limit - 1);
  throwIfError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    changedAt: row.changed_at,
    changedBy: row.changed_by ?? "system",
    action: row.action,
    recordId: row.trademark_id ?? "",
    caseNo: row.new_record?.case_number ?? row.old_record?.case_number ?? "",
    record: row.new_record?.case_number ?? row.old_record?.case_number ?? row.trademark_id ?? "",
    field: "RECORD",
    oldValue: row.old_record ? JSON.stringify(row.old_record) : "",
    newValue: row.new_record ? JSON.stringify(row.new_record) : "",
  }));
}

export async function listAgents(): Promise<string[]> {
  ensureConfigured();
  const { data, error } = await supabase.from("trademarks").select("agent").not("agent", "is", null).order("agent");
  throwIfError(error);
  return Array.from(new Set((data ?? []).map((row) => row.agent).filter((agent): agent is string => Boolean(agent))));
}

export interface ClientRef {
  code: string;
  name: string;
}

export async function listClients(): Promise<ClientRef[]> {
  ensureConfigured();
  const { data, error } = await supabase.from("clients").select("code,name").order("code");
  throwIfError(error);
  return data ?? [];
}

/**
 * Upload a private logo/image to Supabase Storage.
 */
export async function uploadImage(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadImageResult> {
  ensureConfigured();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Please sign in before uploading files.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be 10 MB or smaller.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `pending/${authData.user.id}/${crypto.randomUUID()}.${extension}`;
  onProgress?.(20);
  const { error } = await supabase.storage.from(TRADEMARK_FILES_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  throwIfError(error);
  onProgress?.(80);
  const { data } = await supabase.storage.from(TRADEMARK_FILES_BUCKET).createSignedUrl(path, 3600);
  onProgress?.(100);
  return { fileId: path, url: data?.signedUrl ?? "", thumbnailUrl: data?.signedUrl ?? "" };
}
