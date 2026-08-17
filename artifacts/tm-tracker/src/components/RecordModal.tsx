import {
  useCreateTrademark,
  useGetTrademark,
  useUpdateTrademark,
  useDeleteTrademark,
  useCheckDuplicate,
  TrademarkInput,
} from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Trash2, AlertCircle } from "lucide-react";

const STAGES = ["STAGE 1", "STAGE 2", "STAGE 3", "STAGE 4"];
const SUB_STAGES: Record<string, string[]> = {
  "STAGE 1": ["Application Filed", "Acknowledgement", "Examination"],
  "STAGE 2": ["D-Note Received", "D-Note Submitted", "Hearing", "Accepted", "Published"],
  "STAGE 3": ["Opposition Filed", "Opposition Withdrawn", "CER Received"],
  "STAGE 4": ["CER Dispatch", "Certificate Received", "Completed"],
};

const CITIES = ["Islamabad", "Karachi", "Lahore", "Peshawar", "Multan", "Quetta"];
const CASE_TYPES = ["Trademark", "Copyright", "Design", "Patent", "Renewal", "Opposition", "Other"];

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  prefix: z.string().min(1, "Type is required"),
  clientNo: z.string().min(1, "Client Code is required"),
  clientName: z.string().optional(),
  caseNo: z.string().min(1, "Case No is required"),
  folderNo: z.string().optional(),
  appName: z.string().min(1, "Application Name is required"),
  tmNo: z.string().optional(),
  appClass: z.string().optional(),
  caseType: z.string().optional(),
  stage: z.string().min(1, "Status is required"),
  subStage: z.string().optional(),
  city: z.string().min(1, "City is required"),
  notes: z.string().optional(),
  isDuplicate: z.boolean().default(false),
  isTm11: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface RecordModalProps {
  recordId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[#6d6658] mb-1">
      {children}{required && <span className="text-[#C94A00] ml-0.5">*</span>}
    </label>
  );
}

function FormInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-9 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 disabled:opacity-40 ${className}`}
    />
  );
}

function FormSelect({ children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full h-9 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 ${className}`}
    >
      {children}
    </select>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C94A00] border-b border-[#0C0C0C]/20 pb-1 mb-4">
      {children}
    </div>
  );
}

export function RecordModal({ recordId, onClose, onSaved }: RecordModalProps) {
  const isNew = !recordId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trademark, isLoading } = useGetTrademark(recordId ?? 0, {
    query: { enabled: !!recordId } as any,
  });

  const create = useCreateTrademark();
  const update = useUpdateTrademark();
  const del = useDeleteTrademark();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      prefix: "TM",
      clientNo: "",
      clientName: "",
      caseNo: "",
      folderNo: "",
      appName: "",
      tmNo: "",
      appClass: "",
      caseType: "",
      stage: "STAGE 1",
      subStage: "",
      city: "",
      notes: "",
      isDuplicate: false,
      isTm11: false,
    },
  });

  useEffect(() => {
    if (trademark && !isNew) {
      form.reset({
        date: trademark.date?.split("T")[0] ?? format(new Date(), "yyyy-MM-dd"),
        prefix: trademark.prefix ?? "TM",
        clientNo: trademark.clientNo ?? "",
        clientName: (trademark as any).clientName ?? "",
        caseNo: trademark.caseNo ?? "",
        folderNo: trademark.folderNo ?? "",
        appName: trademark.appName ?? "",
        tmNo: trademark.tmNo ?? "",
        appClass: trademark.appClass ?? "",
        caseType: (trademark as any).caseType ?? "",
        stage: trademark.stage ?? "STAGE 1",
        subStage: trademark.subStage ?? "",
        city: trademark.city ?? "",
        notes: trademark.notes ?? "",
        isDuplicate: trademark.isDuplicate ?? false,
        isTm11: trademark.isTm11 ?? false,
      });
    }
  }, [trademark, isNew]);

  const watchStage = form.watch("stage");
  const watchTmNo = form.watch("tmNo");
  const availableSubStages = SUB_STAGES[watchStage] ?? [];

  const { data: dupCheck } = useCheckDuplicate(
    { tmNo: watchTmNo ?? "" },
    { query: { enabled: isNew && (watchTmNo?.length ?? 0) > 3, staleTime: 5000 } as any }
  );

  const isDuplicate = isNew && dupCheck?.duplicate && dupCheck?.record?.id !== recordId;

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const onSubmit = (data: FormValues) => {
    const folderNo = data.folderNo || `${data.prefix}-${data.clientNo}-${data.caseNo}`;
    const payload: TrademarkInput & { clientName?: string; caseType?: string } = {
      date: data.date,
      prefix: data.prefix,
      clientNo: data.clientNo,
      clientName: data.clientName || undefined,
      caseNo: data.caseNo,
      folderNo,
      appName: data.appName,
      tmNo: data.tmNo || null,
      appClass: data.appClass || null,
      caseType: data.caseType || undefined,
      stage: data.stage,
      subStage: data.subStage || data.stage,
      status: data.subStage || data.stage,
      city: data.city,
      notes: data.notes || null,
      isDuplicate: data.isDuplicate,
      isTm11: data.isTm11,
      imageUrl: null,
      pdfUrl: null,
      assignedTo: null,
    };

    if (isNew) {
      create.mutate(
        { data: payload as TrademarkInput },
        {
          onSuccess: () => {
            toast({ title: "Record Created", description: `${data.appName} added to database.` });
            invalidateAll();
            onSaved?.();
            onClose();
          },
          onError: () => toast({ title: "Error", description: "Failed to create record.", variant: "destructive" }),
        }
      );
    } else {
      update.mutate(
        { id: recordId!, data: payload as TrademarkInput },
        {
          onSuccess: () => {
            toast({ title: "Record Updated", description: "Changes saved successfully." });
            invalidateAll();
            onSaved?.();
          },
          onError: () => toast({ title: "Error", description: "Failed to update record.", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this record permanently?")) return;
    del.mutate(
      { id: recordId! },
      {
        onSuccess: () => {
          toast({ title: "Record Deleted" });
          invalidateAll();
          onClose();
        },
      }
    );
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-[#F0E8D0] border-l-2 border-[#0C0C0C] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0C0C0C] text-[#F0E8D0] border-b-2 border-[#C94A00] shrink-0">
          <div>
            <div className="font-serif text-xl uppercase tracking-widest text-[#C94A00]">
              {isNew ? "ADD RECORD" : "EDIT RECORD"}
            </div>
            {!isNew && trademark && (
              <div className="font-mono text-[10px] text-[#C5B89A] uppercase tracking-widest mt-0.5">
                ID #{recordId} · {trademark.folderNo || `${trademark.prefix}-${trademark.clientNo}-${trademark.caseNo}`}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[#C5B89A] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {!isNew && isLoading ? (
          <div className="flex-1 flex items-center justify-center font-mono font-bold animate-pulse text-[#6d6658]">
            LOADING RECORD...
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {/* Duplicate warning */}
              {isDuplicate && dupCheck?.record && (
                <div className="flex items-start gap-2 bg-[#FFF0E8] border-l-4 border-[#CC0000] p-3 font-mono text-xs">
                  <AlertCircle className="w-4 h-4 text-[#CC0000] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#CC0000] uppercase">Duplicate TM No: </span>
                    Record ID {dupCheck.record.id} — {dupCheck.record.appName} ({dupCheck.record.stage})
                  </div>
                </div>
              )}

              {/* BASIC INFORMATION */}
              <div>
                <SectionHead>BASIC INFORMATION</SectionHead>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required>DATE</FieldLabel>
                    <FormInput type="date" {...form.register("date")} />
                    {form.formState.errors.date && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.date.message}</p>}
                  </div>
                  <div>
                    <FieldLabel required>TYPE</FieldLabel>
                    <FormSelect {...form.register("prefix")}>
                      <option value="TM">TM</option>
                      <option value="X">X</option>
                      <option value="A">A</option>
                      <option value="N">N</option>
                      <option value="C">C (Copyright)</option>
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel required>CLIENT CODE</FieldLabel>
                    <FormInput placeholder="e.g. 284" {...form.register("clientNo")} />
                    {form.formState.errors.clientNo && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.clientNo.message}</p>}
                  </div>
                  <div>
                    <FieldLabel>CLIENT NAME</FieldLabel>
                    <FormInput placeholder="Client full name" {...form.register("clientName")} />
                  </div>
                  <div>
                    <FieldLabel required>CASE NO</FieldLabel>
                    <FormInput placeholder="e.g. 001" {...form.register("caseNo")} />
                    {form.formState.errors.caseNo && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.caseNo.message}</p>}
                  </div>
                  <div>
                    <FieldLabel>FOLDER / CASE NUMBER</FieldLabel>
                    <FormInput
                      placeholder="Auto: TYPE-CLIENT-CASE"
                      {...form.register("folderNo")}
                    />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel required>APPLICATION NAME</FieldLabel>
                    <FormInput placeholder="Trademark / application name" {...form.register("appName")} />
                    {form.formState.errors.appName && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.appName.message}</p>}
                  </div>
                </div>
              </div>

              {/* CASE INFORMATION */}
              <div>
                <SectionHead>CASE INFORMATION</SectionHead>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>TM NUMBER</FieldLabel>
                    <FormInput placeholder="e.g. 633710" {...form.register("tmNo")} />
                  </div>
                  <div>
                    <FieldLabel>CLASS NUMBER</FieldLabel>
                    <FormSelect {...form.register("appClass")}>
                      <option value="">SELECT CLASS</option>
                      {Array.from({ length: 45 }, (_, i) => String(i + 1)).map((c) => (
                        <option key={c} value={c}>CLASS {c}</option>
                      ))}
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel required>STATUS</FieldLabel>
                    <FormSelect
                      {...form.register("stage")}
                      onChange={(e) => {
                        form.setValue("stage", e.target.value);
                        form.setValue("subStage", "");
                      }}
                    >
                      <option value="">SELECT STATUS</option>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </FormSelect>
                    {form.formState.errors.stage && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.stage.message}</p>}
                  </div>
                  <div>
                    <FieldLabel>SUB-STATUS</FieldLabel>
                    <FormSelect {...form.register("subStage")}>
                      <option value="">SELECT SUB-STATUS</option>
                      {availableSubStages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel>CASE TYPE</FieldLabel>
                    <FormSelect {...form.register("caseType")}>
                      <option value="">SELECT CASE TYPE</option>
                      {CASE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel required>CITY</FieldLabel>
                    <FormSelect {...form.register("city")}>
                      <option value="">SELECT CITY</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c.toUpperCase()}</option>
                      ))}
                    </FormSelect>
                    {form.formState.errors.city && <p className="text-[#C94A00] font-mono text-[10px] mt-1">{form.formState.errors.city.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-mono font-bold text-xs uppercase">
                    <input type="checkbox" {...form.register("isDuplicate")} className="w-4 h-4 accent-[#C94A00]" />
                    Duplicate Case
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-mono font-bold text-xs uppercase">
                    <input type="checkbox" {...form.register("isTm11")} className="w-4 h-4 accent-[#C94A00]" />
                    TM-11 Filed
                  </label>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <SectionHead>NOTES</SectionHead>
                <textarea
                  {...form.register("notes")}
                  rows={3}
                  placeholder="Additional case notes..."
                  className="w-full px-3 py-2 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 resize-none"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-[#E8DFC7] border-t-2 border-[#0C0C0C]">
              {!isNew ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={del.isPending}
                  className="flex items-center gap-2 bg-white text-[#CC0000] border-2 border-[#CC0000] px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> DELETE
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-[#C94A00] text-white border-2 border-[#C94A00] px-5 py-2 font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isPending ? "SAVING..." : isNew ? "SAVE RECORD" : "UPDATE RECORD"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
