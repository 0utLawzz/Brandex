import { Navbar } from "@/components/layout/Navbar";
import { useListAgents, useCreateAgent, useDeleteAgent, useListTrademarks } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trash2, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Agents() {
  const { data: agents = [], isLoading, refetch } = useListAgents();
  const { data: trademarks = [] } = useListTrademarks();
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();
  const { toast } = useToast();

  const [newAgent, setNewAgent] = useState({ key: "", name: "", city: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAgent.mutate({ data: newAgent }, {
      onSuccess: () => {
        toast({ title: "Agent created" });
        setNewAgent({ key: "", name: "", city: "" });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err.response?.data?.error || "Error", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this agent?")) {
      deleteAgent.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Agent deleted" });
          refetch();
        }
      });
    }
  };

  const handleExportPDF = () => {
    // Basic text export acting as a report, since true PDF generation in browser requires heavy libraries.
    // We'll generate a formatted text/HTML string and trigger a print dialog.
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let html = `
      <html>
        <head>
          <title>Agents Report</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #eee; }
          </style>
        </head>
        <body>
          <h1>BRANDEX LAW - AGENTS REPORT</h1>
          <p>Generated on: ${format(new Date(), 'PPpp')}</p>
          <table>
            <thead>
              <tr>
                <th>Agent Key</th>
                <th>Name</th>
                <th>City</th>
                <th>Assigned Records</th>
              </tr>
            </thead>
            <tbody>
    `;

    agents.forEach(agent => {
      const count = trademarks.filter(t => t.assignedTo === agent.key).length;
      html += `
        <tr>
          <td>${agent.key}</td>
          <td>${agent.name}</td>
          <td>${agent.city}</td>
          <td>${count}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#0C0C0C] uppercase tracking-wide">
              Manage <span className="text-[#C94A00]">Agents</span>
            </h1>
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="border-2 border-[#0C0C0C] bg-white">
            <Download className="w-4 h-4 mr-2" /> EXPORT PDF / PRINT
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="bg-[#E8DFC7] border-[3px] border-[#0C0C0C]">
              <CardHeader className="border-b-2 border-[#0C0C0C]">
                <CardTitle className="text-xl uppercase flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#0A6B52]" /> New Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold uppercase">Agent Key (Code)</label>
                    <Input required value={newAgent.key} onChange={e => setNewAgent({...newAgent, key: e.target.value.toUpperCase()})} placeholder="e.g. UZMA" className="bg-white border-2 border-[#0C0C0C]" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold uppercase">Full Name</label>
                    <Input required value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} placeholder="Agent Name" className="bg-white border-2 border-[#0C0C0C]" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold uppercase">City</label>
                    <Input required value={newAgent.city} onChange={e => setNewAgent({...newAgent, city: e.target.value.toUpperCase()})} placeholder="City" className="bg-white border-2 border-[#0C0C0C]" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createAgent.isPending}>
                    ADD AGENT
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="bg-white border-[3px] border-[#0C0C0C]">
              <CardHeader className="border-b-2 border-[#0C0C0C] bg-[#F0E8D0]">
                <CardTitle className="text-xl uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C94A00]" /> Agent Directory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center font-mono">LOADING...</div>
                ) : (
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="bg-[#0C0C0C] text-[#F0E8D0] border-b-2 border-[#0C0C0C]">
                      <tr>
                        <th className="p-3 border-r border-[#0C0C0C]/30">Key</th>
                        <th className="p-3 border-r border-[#0C0C0C]/30">Name</th>
                        <th className="p-3 border-r border-[#0C0C0C]/30">City</th>
                        <th className="p-3 border-r border-[#0C0C0C]/30 text-center">Cases</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-[#0C0C0C]">
                      {agents.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center">NO AGENTS REGISTERED.</td></tr>
                      ) : agents.map(agent => (
                        <tr key={agent.id} className="hover:bg-[#E8DFC7] transition-colors">
                          <td className="p-3 border-r-2 border-[#0C0C0C] font-bold text-[#0A6B52]">{agent.key}</td>
                          <td className="p-3 border-r-2 border-[#0C0C0C] font-bold">{agent.name}</td>
                          <td className="p-3 border-r-2 border-[#0C0C0C]">{agent.city}</td>
                          <td className="p-3 border-r-2 border-[#0C0C0C] text-center font-bold text-lg">
                            {trademarks.filter(t => t.assignedTo === agent.key).length}
                          </td>
                          <td className="p-3 text-center">
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(agent.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
