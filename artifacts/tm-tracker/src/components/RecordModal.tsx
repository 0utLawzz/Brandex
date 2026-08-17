import { createTrademark, updateTrademark, deleteTrademark, getTrademark } from "@/lib/api";
import type { TrademarkInput, TrademarkRecord } from "@/lib/api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

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
  appName: z.string().min(1, "Application Name is required"),
  stage: z.string().min(1, "Status is required"),
  subStage: z.string().optional(),
  tmNo: z.string().optional(),
  appClass: z.string().optional(),
  caseType: z.string().optional(),
  city: z.string().min(1, "City is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RecordModalProps {
  recordId?: string;
  isNew?: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[#6d6658] mb-1.5">
      {children}{required && <span className="text-[#CC0000] ml-0.5">*</span>}
    </label>
  );
}

function FormInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full h-10 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 disabled:opacity-40 disabled:bg-[#E8DFC7] ${className}`} />
  );
}

function FormSelect({ children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`w-full h-10 px-3 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 disabled:opacity-40 disabled:bg-[#E8DFC7] ${className}`}>
      {children}
    </select>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#0C0C0C]">{title}</div>
      <div className="flex-1 h-0.5 bg-[#0C0C0C]/10" />
    </div>
  );
}

export function RecordModal({ recordId, isNew: forceNew, onClose, onSaved }: RecordModalProps) {
  const creating = forceNew || !recordId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trademark, isLoading } = useQuery<TrademarkRecord | null>({
    queryKey: ["trademark", recordId],
    queryFn: () => getTrademark(recordId!),
    enabled: !creating && !!recordId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: TrademarkInput) => createTrademark(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trademarks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: TrademarkInput) => updateTrademark(recordId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trademarks"] });
      queryClient.invalidateQueries({ queryKey: ["trademark", recordId] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrademark(recordId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trademarks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      prefix: "TM",
      clientNo: "",
      clientName: "",
      caseNo: "",
      appName: "",
      stage: "STAGE 1",
      subStage: "",
      tmNo: "",
      appClass: "",
      caseType: "Trademark",
      city: "Islamabad",
      notes: "",
    },
  });

  useEffect(() => {
    if (trademark && !creating) {
      form.reset({
        date: trademark.date?.split("T")[0] ?? format(new Date(), "yyyy-MM-dd"),
        prefix: trademark.prefix ?? "TM",
        clientNo: trademark.clientNo ?? "",
        clientName: trademark.clientName ?? "",
        caseNo: trademark.caseNo ?? "",
        appName: trademark.appName ?? "",
        stage: trademark.stage ?? "STAGE 1",
        subStage: trademark.subStage ?? "",
        tmNo: trademark.tmNo ?? "",
        appClass: trademark.appClass ?? "",
        caseType: trademark.caseType ?? "Trademark",
        city: trademark.city ?? "Islamabad",
        notes: trademark.notes ?? "",
      });
    }
  }, [trademark, creating, form]);

  const watchStage = form.watch("stage");
  const availableSubStages = SUB_STAGES[watchStage] ?? [];

  const onSubmit = (data: FormValues) => {
    const folderNo = `${data.prefix}-${data.clientNo}-${data.caseNo}`;
    const payload: TrademarkInput = {
      date: data.date,
      prefix: data.prefix,
      clientNo: data.clientNo,
      clientName: data.clientName || undefined,
      caseNo: data.caseNo,
      folderNo,
      appName: data.appName,
      tmNo: data.tmNo || undefined,
      appClass: data.appClass || undefined,
      caseType: data.caseType || undefined,
      stage: data.stage,
      subStage: data.subStage || undefined,
      city: data.city,
      notes: data.notes || undefined,
    };

    if (creating) {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Record Created", description: `${data.appName} added to Google Sheets.` });
          onSaved?.();
          onClose();
        },
        onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
      });
    } else {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Record Updated", description: "Changes saved to Google Sheets." });
          onSaved?.();
          onClose();
        },
        onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!confirm(`Delete this record permanently from Google Sheets?`)) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Record Deleted" });
        onClose();
      },
      onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60">
      <div className="relative w-full max-w-3xl max-h-full bg-[#F0E8D0] border-2 border-[#0C0C0C] flex flex-col shadow-[8px_8px_0_#0C0C0C] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0C0C0C] text-[#F0E8D0] shrink-0">
          <div>
            <div className="font-serif text-2xl uppercase tracking-widest leading-none">
              {creating ? "ADD RECORD" : "EDIT RECORD"}
            </div>
            {!creating && trademark && (
              <div className="font-mono text-[10px] text-[#C5B89A] uppercase tracking-widest mt-1">
                {trademark.folderNo || trademark.id} · GOOGLE SHEETS
              </div>
            )}
          </div>
          <button onClick={onClose} disabled={isPending} className="text-[#C5B89A] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!creating && isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12 font-mono font-bold text-[#6d6658] animate-pulse">
            LOADING FROM GOOGLE SHEETS...
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <SectionHead title="Basic Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel required>DATE</FieldLabel>
                    <FormInput type="date" {...form.register("date")} />
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
                  </div>
                  <div>
                    <FieldLabel required>CASE NUMBER</FieldLabel>
                    <FormInput placeholder="e.g. 001" {...form.register("caseNo")} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>CLIENT NAME</FieldLabel>
                    <FormInput placeholder="Full client name" {...form.register("clientName")} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel required>APPLICATION NAME</FieldLabel>
                    <FormInput placeholder="Trademark / Application name" {...form.register("appName")} />
                  </div>
                </div>
              </div>

              <div>
                <SectionHead title="Case Information" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel required>STATUS</FieldLabel>
                    <FormSelect {...form.register("stage")} onChange={(e) => { form.setValue("stage", e.target.value); form.setValue("subStage", ""); }}>
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </FormSelect>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>SUB-STATUS</FieldLabel>
                    <FormSelect {...form.register("subStage")}>
                      <option value="">SELECT SUB-STATUS</option>
                      {availableSubStages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel>TM NUMBER</FieldLabel>
                    <FormInput placeholder="e.g. 633710" {...form.register("tmNo")} />
                  </div>
                  <div>
                    <FieldLabel>CLASS</FieldLabel>
                    <FormSelect {...form.register("appClass")}>
                      <option value="">SELECT</option>
                      {Array.from({ length: 45 }, (_, i) => String(i + 1)).map((c) => <option key={c} value={c}>{c}</option>)}
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel>CASE TYPE</FieldLabel>
                    <FormSelect {...form.register("caseType")}>
                      {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </FormSelect>
                  </div>
                </div>
              </div>

              <div>
                <SectionHead title="Assignment" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel required>CITY</FieldLabel>
                    <FormSelect {...form.register("city")}>
                      {CITIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </FormSelect>
                  </div>
                </div>
              </div>

              <div>
                <SectionHead title="Additional" />
                <div>
                  <FieldLabel>NOTES</FieldLabel>
                  <textarea {...form.register("notes")} rows={4} placeholder="Enter any notes here..." className="w-full p-3 bg-white border-2 border-[#0C0C0C] font-mono text-sm focus:outline-2 focus:outline-[#C94A00] focus:outline-offset-0 resize-none" />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#E8DFC7] border-t-2 border-[#0C0C0C]">
              {!creating ? (
                <button type="button" onClick={handleDelete} disabled={deleteMutation.isPending || isPending} className="flex items-center gap-2 bg-white text-[#CC0000] border-2 border-[#CC0000] px-4 h-10 font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#CC0000] hover:text-white transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> DELETE
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} disabled={isPending} className="px-5 h-10 bg-white border-2 border-[#0C0C0C] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#0C0C0C] hover:text-[#F0E8D0] transition-colors disabled:opacity-50">
                  CANCEL
                </button>
                <button type="submit" disabled={isPending} className="flex items-center gap-2 bg-[#C94A00] text-white border-2 border-[#C94A00] px-6 h-10 font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isPending ? "SAVING TO SHEETS..." : creating ? "SAVE RECORD" : "UPDATE RECORD"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
