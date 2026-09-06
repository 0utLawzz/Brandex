/* Brandex browser data layer — Supabase is primary; Sheet mirroring is server-side. */

import { isSupabaseConfigured, supabase, TRADEMARK_FILES_BUCKET } from "./supabase";

export interface Trademark {
  ID: string; DATE: string; TYPE: string; "CLIENT CODE": string; "CASE NUMBER": string; "CLIENT NAME": string;
  "APPLICATION NAME": string; "TM/CPR NUMBER": string; CLASS: string; STATUS: string; "SUB STATUS": string;
  "CASE TYPE": string; AGENT: string; CITY: string; NOTES: string; TM5: string; TM6: string; TM11: string; TM16: string; TM56: string;
  "JOURNAL NUMBER": string; "JOURNAL DATE": string; "LAST MODIFIED": string; IMAGE: string;
  _tmMatches?: TmMatches; _journal?: JournalRecord | null;
}

export interface TrademarkRecord {
  id:string; date:string; type:string; prefix:string; clientCode:string; clientNo:string; caseNumber:string; folderNo:string; caseNo:string;
  clientName:string; appName:string; tmCprNo:string; tmNo:string; appClass:string; stage:string; subStage:string; caseType:string; agent:string; city:string; notes:string; updatedAt:string; image:string; imagePath?:string;
  tm5:string; tm6:string; tm11:string; tm16:string; tm56:string; journalNumber:string; journalDate:string; tmMatches?:TmMatches; journal?:JournalRecord|null;
  [key:string]: any;
}
export interface TmMatches { TM5:boolean; TM6:boolean; TM11:boolean; TM16:boolean; TM56:boolean; }
export interface JournalRecord { found:boolean; "Application No"?:string; "Journal No"?:string; "Journal Date"?:string; Title?:string; Class?:string; "Applicant Name and Address"?:string; "Agent Name and Address"?:string; "Date of Filing"?:string; [key:string]:string|boolean|undefined; }
export interface AuditLogEntry { id:number; changedAt:string; changedBy:string; action:string; recordId:string; caseNo:string; record:string; field:string; oldValue:string; newValue:string; }
export interface TrademarkStats { total:number; recentlyModified:number; byStage:Array<{stage:string;count:number}>; byCity:Array<{city:string;count:number}>; byNumericStage:Array<{stage:string;count:number}>; }
export interface TrademarkInput {
  id?:string; date?:string; type?:string; prefix?:string; clientCode?:string; clientNo?:string; caseNumber?:string; caseNo?:string; folderNo?:string;
  clientName?:string; appName?:string; tmCprNo?:string; tmNo?:string; appClass?:string; stage?:string; subStage?:string; caseType?:string; agent?:string; city?:string; notes?:string; image?:string;
}
export interface TmSearchResult { records:TrademarkRecord[]; tmMatches:TmMatches; journal:JournalRecord|null; }

export const STAGES = ["STAGE 1","STAGE 2","STAGE 3","STAGE 4","STOPPED"] as const;
export type StageType = typeof STAGES[number];
export const STATUS_WORKFLOW:Record<string,string[]> = {
  "STAGE 1":["Acknowledgment","Examination"],
  "STAGE 2":["Assigned","Accepted","Hearing"],
  "STAGE 3":["TM11 Demand Note Submitted","TM11 Demand Note Received","TM5 Opposition Filed","Opposition Received","TM6 Counter-Statement / Reply","Opposition Withdrawn","Published"],
  "STAGE 4":["CER Dispatch","CER Received","CER Acknowledge"],
  "STOPPED":["Case Stopped"],
};
export const CITIES = ["Islamabad","Karachi","Lahore","Peshawar"] as const;
export const VALID_TYPES = ["X","A","N"] as const;
export interface UploadImageResult { fileId:string; url:string; thumbnailUrl:string; }

function ensureConfigured(){ if(!isSupabaseConfigured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."); }
function throwIfError(error:{message:string}|null){ if(error) throw new Error(error.message); }

type SupabaseTrademarkRow = {
  id:string; filing_date:string; type:string; client_code:string; client_name:string|null; case_number:string; application_name:string; tm_cpr_number:string|null;
  nice_class:string|null; status:string; sub_status:string|null; case_type:string|null; agent:string|null; city:string; notes?:string|null;
  tm5:boolean; tm6:boolean; tm11:boolean; tm16:boolean; tm56:boolean; journal_number:string|null; journal_date:string|null; journal_data?:JournalRecord|null;
  logo_path?:string|null; legacy_image_url?:string|null; updated_at:string;
  [key:string]:any;
};
function rowToRecord(row:SupabaseTrademarkRow,signedImage=""):TrademarkRecord{
  const matches={TM5:!!row.tm5,TM6:!!row.tm6,TM11:!!row.tm11,TM16:!!row.tm16,TM56:!!row.tm56};
  return {id:row.id,date:row.filing_date,type:row.type,prefix:row.type,clientCode:row.client_code,clientNo:row.client_code,caseNumber:row.case_number,folderNo:row.case_number,caseNo:row.case_number,clientName:row.client_name??"",appName:row.application_name,tmCprNo:row.tm_cpr_number??"",tmNo:row.tm_cpr_number??"",appClass:row.nice_class??"",stage:row.status,subStage:row.sub_status??"",caseType:row.case_type??"",agent:row.agent??"",city:row.city,notes:row.notes??"",updatedAt:row.updated_at,image:signedImage||row.legacy_image_url||"",imagePath:row.logo_path||row.legacy_image_url||"",tm5:row.tm5?"YES":"",tm6:row.tm6?"YES":"",tm11:row.tm11?"YES":"",tm16:row.tm16?"YES":"",tm56:row.tm56?"YES":"",journalNumber:row.journal_number??"",journalDate:row.journal_date??"",tmMatches:matches,journal:row.journal_data};
}
async function mapRows(rows:SupabaseTrademarkRow[],signImages=false){
  if(!signImages)return rows.map(r=>rowToRecord(r));
  const paths=rows.map(r=>r.logo_path).filter((p):p is string=>!!p); const signed=new Map<string,string>();
  if(paths.length){const {data}=await supabase.storage.from(TRADEMARK_FILES_BUCKET).createSignedUrls(paths,3600);data?.forEach((x,i)=>{if(x.signedUrl)signed.set(paths[i],x.signedUrl);});}
  return rows.map(r=>rowToRecord(r,r.logo_path?signed.get(r.logo_path)||"":""));
}
const TRADEMARK_LIST_COLUMNS="id,filing_date,type,client_code,client_name,case_number,application_name,tm_cpr_number,nice_class,status,sub_status,case_type,agent,city,tm5,tm6,tm11,tm16,tm56,journal_number,journal_date,updated_at";
export function inputToRow(input:TrademarkInput){const image=input.image?.trim()||null;const externalImage=image?.startsWith("http")??false;return {filing_date:input.date,type:input.type??input.prefix,client_code:input.clientCode??input.clientNo,client_name:input.clientName??null,case_number:input.caseNumber??input.caseNo??input.folderNo,application_name:input.appName,tm_cpr_number:input.tmCprNo??input.tmNo??null,nice_class:input.appClass??null,status:input.stage,sub_status:input.subStage??null,case_type:input.caseType??null,agent:input.agent??null,city:input.city,notes:input.notes??null,logo_path:externalImage?null:image,legacy_image_url:externalImage?image:null};}
export async function listTrademarks(params?:{search?:string;stage?:string;city?:string;caseType?:string;agent?:string;appClass?:string}):Promise<TrademarkRecord[]>{ensureConfigured();let q=supabase.from("trademarks").select(TRADEMARK_LIST_COLUMNS).order("updated_at",{ascending:false});if(params?.stage)q=q.eq("status",params.stage);if(params?.city)q=q.eq("city",params.city);if(params?.caseType)q=q.eq("case_type",params.caseType);if(params?.agent)q=q.eq("agent",params.agent);if(params?.appClass)q=q.eq("nice_class",params.appClass);const {data,error}=await q;throwIfError(error);let r=await mapRows((data??[]) as SupabaseTrademarkRow[]);if(params?.search){const s=params.search.toLowerCase();r=r.filter(x=>[x.clientName,x.clientCode,x.caseNumber,x.appName,x.tmCprNo,x.appClass,x.agent].some(v=>v?.toLowerCase().includes(s)));}return r;}
export async function getRecord(id:string){ensureConfigured();const {data,error}=await supabase.from("trademarks").select("*").eq("id",id).maybeSingle();throwIfError(error);return data?(await mapRows([data as SupabaseTrademarkRow],true))[0]:null;}
export async function getTrademark(id:string){return getRecord(id);}
export async function searchTm(tmNo:string):Promise<TmSearchResult>{ensureConfigured();const {data,error}=await supabase.from("trademarks").select("*").ilike("tm_cpr_number",tmNo.trim()).order("updated_at",{ascending:false});throwIfError(error);const records=await mapRows((data??[]) as SupabaseTrademarkRow[]);const first=records[0];return {records,tmMatches:first?.tmMatches??{TM5:false,TM6:false,TM11:false,TM16:false,TM56:false},journal:first?.journal??null};}
export async function createTrademark(input:TrademarkInput){ensureConfigured();const {data:auth}=await supabase.auth.getUser();const {data,error}=await supabase.from("trademarks").insert({...inputToRow(input),created_by:auth.user?.id,updated_by:auth.user?.id}).select("id,case_number").single();throwIfError(error);if(!data)throw new Error("Supabase did not return the created record.");return {id:data.id,caseNumber:data.case_number};}
export async function updateTrademark(id:string,input:TrademarkInput){ensureConfigured();const {data,error}=await supabase.from("trademarks").update(inputToRow(input)).eq("id",id).select("id").single();throwIfError(error);if(!data)throw new Error("Supabase did not return the updated record.");return {id:data.id};}
export async function deleteTrademark(id:string){ensureConfigured();const {error}=await supabase.from("trademarks").delete().eq("id",id);throwIfError(error);}
export async function uploadImage(file:File,onProgress?:(pct:number)=>void):Promise<UploadImageResult>{ensureConfigured();const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";const path=`${crypto.randomUUID()}.${ext}`;onProgress?.(10);const {error}=await supabase.storage.from(TRADEMARK_FILES_BUCKET).upload(path,file,{upsert:false,contentType:file.type});throwIfError(error);onProgress?.(80);const {data}=await supabase.storage.from(TRADEMARK_FILES_BUCKET).createSignedUrl(path,3600);onProgress?.(100);return {fileId:path,url:data?.signedUrl||"",thumbnailUrl:data?.signedUrl||""};}
export async function getStats():Promise<TrademarkStats>{ensureConfigured();const {data,error,count}=await supabase.from("trademarks").select("status,city,updated_at",{count:"exact"});throwIfError(error);const rows=data??[];const by=(k:"status"|"city")=>Object.entries(rows.reduce<Record<string,number>>((a,r)=>{const v=r[k]||"Unspecified";a[v]=(a[v]||0)+1;return a},{})).map(([name,count])=>({stage:name,city:name,count}));const cutoff=Date.now()-7*86400000;return {total:count??rows.length,recentlyModified:rows.filter(r=>Date.parse(r.updated_at)>=cutoff).length,byStage:by("status").map(x=>({stage:x.stage,count:x.count})),byCity:by("city").map(x=>({city:x.city,count:x.count})),byNumericStage:by("status").filter(x=>/^STAGE \d+$/.test(x.stage)).map(x=>({stage:x.stage,count:x.count}))};}
export async function listAuditLogs(limit=100,offset=0):Promise<AuditLogEntry[]>{ensureConfigured();const {data,error}=await supabase.from("audit_logs").select("*").order("changed_at",{ascending:false}).range(offset,offset+limit-1);throwIfError(error);return (data??[]).map((r:any)=>({id:r.id,changedAt:r.changed_at,changedBy:r.changed_by??"system",action:r.action,recordId:r.trademark_id??"",caseNo:r.new_record?.case_number??r.old_record?.case_number??"",record:r.new_record?.case_number??r.old_record?.case_number??r.trademark_id??"",field:"RECORD",oldValue:r.old_record?JSON.stringify(r.old_record):"",newValue:r.new_record?JSON.stringify(r.new_record):""}));}
export async function listAgents(){ensureConfigured();const {data,error}=await supabase.from("trademarks").select("agent").not("agent","is",null).order("agent");throwIfError(error);return Array.from(new Set((data??[]).map(r=>r.agent).filter((x):x is string=>!!x)));}
