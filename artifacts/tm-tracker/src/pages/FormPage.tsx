import { Navbar } from "@/components/layout/Navbar";
import {
  useCreateTrademark,
  useGetTrademark,
  useUpdateTrademark,
  useDeleteTrademark,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// React Hook Form
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  tmNo: z.string().min(1, "TM No is required"),
  appName: z.string().min(1, "App Name is required"),
  folderNo: z.string().optional(),
  appClass: z.string().optional(),
  date: z.string().optional(),
  stage: z.string().optional(),
  subStage: z.string().optional(),
  city: z.string().optional(),
  isDuplicate: z.boolean().default(false),
  isTm11: z.boolean().default(false),
  notes: z.string().optional(),
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

  const { data: trademark, isLoading } = useGetTrademark(id!, {
    query: { enabled: !!id },
  });
  const createMutation = useCreateTrademark();
  const updateMutation = useUpdateTrademark();
  const deleteMutation = useDeleteTrademark();

  const form = useHookForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tmNo: "",
      appName: "",
      folderNo: "",
      appClass: "",
      date: format(new Date(), "yyyy-MM-dd"),
      stage: "",
      subStage: "",
      city: "",
      isDuplicate: false,
      isTm11: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (trademark && !isNew) {
      form.reset({
        tmNo: trademark.tmNo || "",
        appName: trademark.appName || "",
        folderNo: trademark.folderNo || "",
        appClass: trademark.appClass || "",
        date: trademark.date ? trademark.date.split("T")[0] : "",
        stage: trademark.stage || "",
        subStage: trademark.subStage || "",
        city: trademark.city || "",
        isDuplicate: trademark.isDuplicate || false,
        isTm11: trademark.isTm11 || false,
        notes: trademark.notes || "",
      });
    }
  }, [trademark, isNew, form]);

  const onSubmit = (data: FormValues) => {
    if (isNew) {
      createMutation.mutate(
        { data },
        {
          onSuccess: (res) => {
            toast({
              title: "Success",
              description: "Trademark added successfully.",
            });
            setLocation(`/trademarks/${res.id}`);
          },
          onError: () =>
            toast({
              title: "Error",
              description: "Failed to create trademark.",
              variant: "destructive",
            }),
        },
      );
    } else {
      updateMutation.mutate(
        { id: id!, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Trademark updated successfully.",
            });
          },
          onError: () =>
            toast({
              title: "Error",
              description: "Failed to update trademark.",
              variant: "destructive",
            }),
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
            toast({
              title: "Deleted",
              description: "Trademark record deleted.",
            });
            setLocation("/search");
          },
        },
      );
    }
  };

  const watchStage = form.watch("stage");
  const availableSubStages = STAGES[watchStage as keyof typeof STAGES] || [];

  if (isLoading && !isNew) {
    return <div className="p-8 font-mono">LOADING...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 w-full max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 px-0"
          onClick={() => setLocation("/search")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Registry
        </Button>

        <Card className="bg-[#E8DFC7] border-[3px]">
          <CardHeader className="border-[#0C0C0C]">
            <CardTitle className="text-4xl text-[#C94A00]">
              {isNew ? "NEW TRADEMARK" : "EDIT TRADEMARK"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>TM Number *</Label>
                  <Input {...form.register("tmNo")} className="bg-white" />
                  {form.formState.errors.tmNo && (
                    <p className="text-red-600 font-mono text-xs">
                      {form.formState.errors.tmNo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Application Name *</Label>
                  <Input {...form.register("appName")} className="bg-white" />
                  {form.formState.errors.appName && (
                    <p className="text-red-600 font-mono text-xs">
                      {form.formState.errors.appName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Folder / Case No</Label>
                  <Input {...form.register("folderNo")} className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input {...form.register("appClass")} className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Filing Date</Label>
                  <Input
                    type="date"
                    {...form.register("date")}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <select
                    {...form.register("city")}
                    className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
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
                    className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                    onChange={(e) => {
                      form.setValue("stage", e.target.value);
                      form.setValue("subStage", ""); // Reset sub-stage
                    }}
                  >
                    <option value="">SELECT STAGE</option>
                    {Object.keys(STAGES).map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Sub-Stage</Label>
                  <select
                    {...form.register("subStage")}
                    className="flex h-12 w-full bg-white px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-[#C94A00]"
                    disabled={!availableSubStages.length}
                  >
                    <option value="">SELECT SUB-STAGE</option>
                    {availableSubStages.map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-8 p-4 bg-[#F0E8D0] nb-border">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("isDuplicate")}
                    className="w-5 h-5 accent-[#C94A00] border-2 border-[#0C0C0C]"
                  />
                  <span className="font-mono font-bold uppercase">
                    Duplicate Case
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("isTm11")}
                    className="w-5 h-5 accent-[#C94A00] border-2 border-[#0C0C0C]"
                  />
                  <span className="font-mono font-bold uppercase">
                    TM-11 Filed
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  {...form.register("notes")}
                  className="bg-white"
                  placeholder="Add case notes..."
                />
              </div>

              <div className="flex justify-between items-center pt-6 border-t-2 border-[#0C0C0C]">
                {!isNew ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-5 h-5 mr-2" /> DELETE
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  <Save className="w-5 h-5 mr-2" />{" "}
                  {isNew ? "SAVE NEW RECORD" : "UPDATE RECORD"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
