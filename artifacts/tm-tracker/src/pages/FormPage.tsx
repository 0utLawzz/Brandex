import { Navbar } from "@/components/layout/Navbar";
import {
  useCreateTrademark,
  useGetTrademark,
  useUpdateTrademark,
  useDeleteTrademark,
  useGetTrademarkChangeLog,
  useCheckDuplicate,
  useListAgents,
  TrademarkInput,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Trash2, ArrowLeft, ArrowRightLeft, Clock, ChevronDown, ChevronUp, AlertCircle, Image as ImageIcon, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// React Hook Form
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  tmNo: z.string().min(1, "TM No is required"),
  appName: z.string().min(1, "App Name is required"),
  prefix: z.string().min(1, "Prefix is required"),
  clientNo: z.string().min(1, "Client No is required"),
  caseNo: z.string().min(1, "Case No is required"),
  appClass: z.string().optional(),
  date: z.string().optional(),
  stage: z.string().optional(),
  subStage: z.string().optional(),
  city: z.string().optional(),
  assignedTo: z.string().optional(),
  isDuplicate: z.boolean().default(false),
  isTm11: z.boolean().default(false),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STAGES: Record<string, string[]> = {
  "Application Filed": ["Acknowledgement", "Examination"],
  "Examination": ["Assigned", "Accepted", "Hearing"],
  "Accepted": ["Assigned", "Hearing"],
  "Published": ["Oppo: Withdrawn", "Oppo: Filed", "Oppo: Received", "Demand Note Received", "Demand Note Paid"],
  "Certificate Received": ["Certificate Dispatch", "Hearing"],
  "Stopped": ["Abandoned", "Note", "Hold", "Refused"],
  "Copyright": ["Filed", "In Newspapers", "Acknowledgement", "Examination", "Certificate Received", "Certificate Dispatched"],
};

export function FormPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : undefined;
  const isNew = !id;
  const { toast } = useToast();
  const [showChangeLog, setShowChangeLog] = useState(false);

  const { data: trademark, isLoading } = useGetTrademark(id ?? 0, {
    query: { enabled: !!id } as any,
  });
  
  const { data: agents = [] } = useListAgents();
  
  const { data: changeLog } = useGetTrademarkChangeLog(id ?? 0, {
    query: { enabled: !!id && showChangeLog } as any,
  });

  const createMutation = useCreateTrademark();
  const updateMutation = useUpdateTrademark();
  const deleteMutation = useDeleteTrademark();

  const transfer = async (target: "local" | "sheets") => {
    if (!id) return;
    const response = await fetch(`/api/trademarks/${id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    const payload = await response.json();
    toast({
      title: response.ok ? "Source updated" : "Transfer failed",
      description: payload.message || payload.error,
      variant: response.ok ? "default" : "destructive",
    });
  };

  const form = useHookForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tmNo: "",
      appName: "",
      prefix: "TM",
      clientNo: "",
      caseNo: "",
      appClass: "",
      date: format(new Date(), "yyyy-MM-dd"), // default for new records
      stage: "",
      subStage: "",
      city: "",
      assignedTo: "",
      isDuplicate: false,
      isTm11: false,
      notes: "",
      imageUrl: "",
      pdfUrl: "",
    },
  });

  useEffect(() => {
    if (trademark && !isNew) {
      form.reset({
        tmNo: trademark.tmNo || "",
        appName: trademark.appName || "",
        prefix: trademark.prefix || "TM",
        clientNo: trademark.clientNo || "",
        caseNo: trademark.caseNo || "",
        appClass: trademark.appClass || "",
        date: trademark.date ? trademark.date.split("T")[0] : "", // preserves existing date
        stage: trademark.stage || "",
        subStage: trademark.subStage || "",
        city: trademark.city || "",
        assignedTo: trademark.assignedTo || "",
        isDuplicate: trademark.isDuplicate || false,
        isTm11: trademark.isTm11 || false,
        notes: trademark.notes || "",
        imageUrl: trademark.imageUrl || "",
        pdfUrl: trademark.pdfUrl || "",
      });
    }
  }, [trademark, isNew, form]);

  const watchTmNo = form.watch("tmNo");
  const { data: duplicateCheck } = useCheckDuplicate(
    { tmNo: watchTmNo },
    { query: { enabled: isNew && watchTmNo.length > 3, staleTime: 5000 } as any },
  );

  const onSubmit = (data: FormValues) => {
    const payload: TrademarkInput = {
      tmNo: data.tmNo || null,
      appName: data.appName,
      prefix: data.prefix,
      clientNo: data.clientNo,
      caseNo: data.caseNo,
      appClass: data.appClass || null,
      date: data.date || format(new Date(), "yyyy-MM-dd"),
      stage: data.stage || "Application Filed",
      subStage: data.subStage || null,
      city: data.city || "Unknown",
      status: "Active",
      isDuplicate: data.isDuplicate,
      isTm11: data.isTm11,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      pdfUrl: data.pdfUrl || null,
      assignedTo: data.assignedTo || null,
    };

    if (isNew) {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (res) => {
            toast({ title: "Success", description: "Trademark added successfully." });
            setLocation(`/trademarks/${res.id}`);
          },
          onError: () => toast({ title: "Error", description: "Failed to create trademark.", variant: "destructive" }),
        },
      );
    } else {
      updateMutation.mutate(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Trademark updated successfully." });
          },
          onError: () => toast({ title: "Error", description: "Failed to update trademark.", variant: "destructive" }),
        },
      );
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(
        { id: id! },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Trademark record deleted." });
            setLocation("/search");
          },
        },
      );
    }
  };

  const watchStage = form.watch("stage");
  const availableSubStages = STAGES[watchStage as keyof typeof STAGES] || [];

  if (isLoading && !isNew) {
    return <div className="p-8 font-mono text-center">LOADING...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 px-0"
          onClick={() => setLocation("/search")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Registry
        </Button>

        <Card className="bg-[#E8DFC7] border-[3px] shadow-sm">
          <CardHeader className="border-b-2 border-[#0C0C0C]">
            <CardTitle className="text-3xl md:text-4xl text-[#C94A00] uppercase font-bold tracking-tight">
              {isNew ? "NEW TRADEMARK" : "EDIT TRADEMARK"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!isNew && trademark && (
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-2 border-[#0C0C0C] bg-[#F0E8D0] p-3 font-mono text-xs uppercase">
                <span className="font-bold bg-[#0C0C0C] text-white px-2 py-1">{trademark.source === "sheets" ? "SHEET RECORD" : "DATABASE RECORD"}</span>
                <span className="text-[#6d6658]">STAGE: {trademark.stage || "—"} · SUB-STAGE: {trademark.subStage || "—"}</span>
                <div className="sm:ml-auto flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <Button type="button" size="sm" variant="outline" onClick={() => transfer("sheets")}><ArrowRightLeft className="mr-1 h-3 w-3" /> MOVE TO SHEET</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => transfer("local")}><ArrowRightLeft className="mr-1 h-3 w-3" /> MOVE TO DB</Button>
                </div>
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* CORE DETAILS SECTION */}
              <div className="bg-[#FFF8E7] p-5 border-2 border-[#0C0C0C]">
                <h3 className="font-mono text-lg font-bold mb-4 flex items-center gap-2 text-[#0A6B52]">
                  CORE DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="font-bold">TM Number *</Label>
                    <Input {...form.register("tmNo")} className="bg-white border-2 border-[#0C0C0C] h-11 text-lg font-mono font-bold" />
                    {form.formState.errors.tmNo && (
                      <p className="text-red-600 font-mono text-xs">{form.formState.errors.tmNo.message}</p>
                    )}
                    {isNew && duplicateCheck?.duplicate && duplicateCheck.record && (
                      <div className="mt-2 flex items-start gap-2 bg-[#FFF0E8] border-l-4 border-[#CC0000] p-2 text-xs font-mono">
                        <AlertCircle className="w-4 h-4 text-[#CC0000] shrink-0" />
                        <div>
                          <span className="font-bold text-[#CC0000] uppercase">Duplicate Found: </span> 
                          Record ID {duplicateCheck.record.id} ({duplicateCheck.record.appName} - {duplicateCheck.record.stage})
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="font-bold">Application Name *</Label>
                    <Input {...form.register("appName")} className="bg-white border-2 border-[#0C0C0C] h-11 text-lg font-bold" />
                    {form.formState.errors.appName && (
                      <p className="text-red-600 font-mono text-xs">{form.formState.errors.appName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Prefix</Label>
                    <Input {...form.register("prefix")} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client No</Label>
                    <Input {...form.register("clientNo")} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Case No</Label>
                    <Input {...form.register("caseNo")} className="bg-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <select
                      {...form.register("appClass")}
                      className="flex h-10 w-full bg-white px-3 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                    >
                      <option value="">SELECT CLASS</option>
                      {Array.from({ length: 45 }, (_, i) => String(i + 1)).map((c) => (
                        <option key={c} value={c}>CLASS {c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STATUS & ASSIGNMENT SECTION */}
              <div className="bg-white p-5 border-2 border-[#0C0C0C]">
                <h3 className="font-mono text-lg font-bold mb-4 flex items-center gap-2 text-[#C94A00]">
                  STATUS & ASSIGNMENT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="space-y-2">
                    <Label>Filing Date</Label>
                    <Input type="date" {...form.register("date")} className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <select
                      {...form.register("city")}
                      className="flex h-10 w-full bg-white px-3 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                    >
                      <option value="">SELECT CITY</option>
                      <option value="ISB">ISLAMABAD</option>
                      <option value="KHI">KARACHI</option>
                      <option value="LHR">LAHORE</option>
                      <option value="PESH">PESHAWAR</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <select
                      {...form.register("stage")}
                      className="flex h-10 w-full bg-[#E8DFC7] px-3 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                      onChange={(e) => {
                        form.setValue("stage", e.target.value);
                        form.setValue("subStage", ""); // Reset sub-stage
                      }}
                    >
                      <option value="">SELECT STAGE</option>
                      {Object.keys(STAGES).map((s) => (
                        <option key={s} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sub-Stage</Label>
                    <select
                      {...form.register("subStage")}
                      className="flex h-10 w-full bg-[#E8DFC7] px-3 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                      disabled={!availableSubStages.length}
                    >
                      <option value="">SELECT SUB-STAGE</option>
                      {availableSubStages.map((s) => (
                        <option key={s} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="font-bold">Assigned Agent</Label>
                    <select
                      {...form.register("assignedTo")}
                      className="flex h-10 w-full bg-white px-3 py-2 font-mono text-sm font-bold border-2 border-[#0C0C0C] focus:outline-2 focus:outline-[#C94A00]"
                    >
                      <option value="">UNASSIGNED</option>
                      {agents.map((a) => (
                        <option key={a.key} value={a.key}>{a.name} ({a.city})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="lg:col-span-2 flex items-center gap-6 mt-4 md:mt-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" {...form.register("isDuplicate")} className="w-5 h-5 accent-[#C94A00] border-2 border-[#0C0C0C]" />
                      <span className="font-mono font-bold uppercase text-sm">Duplicate Case</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" {...form.register("isTm11")} className="w-5 h-5 accent-[#C94A00] border-2 border-[#0C0C0C]" />
                      <span className="font-mono font-bold uppercase text-sm">TM-11 Filed</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* ATTACHMENTS SECTION */}
              <div className="bg-[#E8F5EE] p-5 border-2 border-[#0C0C0C]">
                <h3 className="font-mono text-lg font-bold mb-4 flex items-center gap-2 text-[#0A6B52]">
                  ATTACHMENTS & NOTES
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Image Base64 / URL</Label>
                    <Input {...form.register("imageUrl")} className="bg-white font-mono text-xs" placeholder="data:image/jpeg;base64,..." />
                    {form.watch("imageUrl") && (
                      <div className="mt-2 border-2 border-[#0C0C0C] bg-white p-2 inline-block">
                        <img src={form.watch("imageUrl")} alt="Preview" className="max-h-32 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><FileText className="w-4 h-4"/> PDF Base64 / URL</Label>
                    <Input {...form.register("pdfUrl")} className="bg-white font-mono text-xs" placeholder="data:application/pdf;base64,..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea {...form.register("notes")} className="bg-white min-h-[100px]" placeholder="Add case notes..." />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-6 gap-4 border-t-2 border-[#0C0C0C]">
                {!isNew ? (
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="w-full sm:w-auto">
                    <Trash2 className="w-5 h-5 mr-2" /> DELETE
                  </Button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="w-full sm:w-auto text-lg h-12 px-8">
                  <Save className="w-5 h-5 mr-2" /> {isNew ? "SAVE NEW RECORD" : "UPDATE RECORD"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Log / Audit Trail */}
        {!isNew && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowChangeLog((v) => !v)}
              className="flex items-center gap-3 w-full bg-[#E8DFC7] border-[3px] border-[#0C0C0C] px-4 py-3 font-mono font-bold text-sm uppercase tracking-wider hover:bg-[#D9D0B7] transition-colors shadow-sm"
            >
              <Clock className="w-5 h-5" />
              CHANGE LOG
              {changeLog && (
                <span className="ml-2 bg-[#0C0C0C] text-[#F0E8D0] text-[10px] px-2 py-0.5 font-bold">
                  {changeLog.length}
                </span>
              )}
              <span className="ml-auto">
                {showChangeLog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </span>
            </button>

            {showChangeLog && (
              <div className="border-[3px] border-t-0 border-[#0C0C0C] bg-[#F0E8D0]">
                {!changeLog || changeLog.length === 0 ? (
                  <div className="px-6 py-8 text-center font-mono text-sm text-[#6d6658]">
                    NO CHANGES RECORDED YET.
                  </div>
                ) : (
                  <div className="divide-y-2 divide-[#0C0C0C]">
                    {changeLog.map((entry) => {
                      const isCreate = entry.field === 'CREATE';
                      const changedAt = entry.changedAt
                        ? new Date(entry.changedAt).toLocaleString()
                        : '—';
                      return (
                        <div key={entry.id} className="px-5 py-4 flex flex-col gap-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-block border-2 border-[#0C0C0C] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isCreate ? 'bg-[#0A6B52] text-white' : 'bg-[#C94A00] text-white'
                            }`}>
                              {isCreate ? 'CREATED' : entry.field.toUpperCase()}
                            </span>
                            <span className="font-mono text-xs text-[#6d6658] ml-auto">{changedAt}</span>
                            <span className="font-mono text-[10px] bg-[#E8DFC7] border border-[#0C0C0C] px-2 py-0.5 uppercase">
                              BY {entry.changedBy}
                            </span>
                          </div>
                          {!isCreate && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div className="bg-[#FFF0E8] border-l-4 border-[#CC0000] px-3 py-2 font-mono text-xs">
                                <div className="text-[#CC0000] font-bold text-[9px] uppercase tracking-widest mb-1">BEFORE</div>
                                <div className="text-[#0C0C0C] break-all">{entry.oldValue ?? '—'}</div>
                              </div>
                              <div className="bg-[#E8F5EE] border-l-4 border-[#0A6B52] px-3 py-2 font-mono text-xs">
                                <div className="text-[#0A6B52] font-bold text-[9px] uppercase tracking-widest mb-1">AFTER</div>
                                <div className="text-[#0C0C0C] break-all">{entry.newValue}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
