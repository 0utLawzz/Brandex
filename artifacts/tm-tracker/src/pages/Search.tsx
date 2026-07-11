import { Navbar } from "@/components/layout/Navbar";
import { useListTrademarks } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterX, Edit } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export function Search() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [city, setCity] = useState("");

  const { data: trademarks, isLoading } = useListTrademarks({
    search: search || undefined,
    stage: stage || undefined,
    city: city || undefined,
  });

  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 w-full max-w-[1600px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl text-[#0C0C0C] uppercase tracking-wide">
              Trademark <span className="text-[#0A6B52]">Registry</span>
            </h1>
          </div>
        </header>

        <div className="bg-[#E8DFC7] nb-border p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <Input
                placeholder="TM No, Name, Folder..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">
              Stage
            </label>
            <select
              className="flex h-12 w-full bg-[#F0E8D0] px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-offset-2 focus:outline-[#C94A00]"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="">ALL STAGES</option>
              <option value="Filed">FILED</option>
              <option value="Examination">EXAMINATION</option>
              <option value="Accepted">ACCEPTED</option>
              <option value="Advertised">ADVERTISED</option>
              <option value="Opposed">OPPOSED</option>
              <option value="Registered">REGISTERED</option>
              <option value="Abandoned">ABANDONED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest">
              City
            </label>
            <select
              className="flex h-12 w-full bg-[#F0E8D0] px-4 py-2 font-mono text-sm nb-border focus:outline-2 focus:outline-offset-2 focus:outline-[#C94A00]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">ALL CITIES</option>
              <option value="ISB">ISLAMABAD</option>
              <option value="KHI">KARACHI</option>
              <option value="LHR">LAHORE</option>
              <option value="PESH">PESHAWAR</option>
            </select>
          </div>

          <Button
            variant="outline"
            className="h-12 border-2 border-[#0C0C0C] bg-[#F0E8D0]"
            onClick={() => {
              setSearch("");
              setStage("");
              setCity("");
            }}
          >
            <FilterX className="w-4 h-4 mr-2" /> CLEAR
          </Button>
        </div>

        <div className="bg-[#F0E8D0] nb-border nb-shadow overflow-x-auto">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead className="bg-[#0C0C0C] text-[#F0E8D0] uppercase tracking-wider text-xs border-b-2 border-[#0C0C0C]">
              <tr>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">
                  TM No
                </th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">
                  App Name
                </th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">
                  Class
                </th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">
                  Stage
                </th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">City</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">
                  Folder No
                </th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30">Date</th>
                <th className="px-4 py-4 border-r border-[#0C0C0C]/30 text-center">
                  TM-11
                </th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0C0C0C]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center font-bold">
                    LOADING RECORDS...
                  </td>
                </tr>
              ) : trademarks?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center font-bold">
                    NO RECORDS FOUND.
                  </td>
                </tr>
              ) : (
                trademarks?.map((tm) => (
                  <tr
                    key={tm.id}
                    className="hover:bg-[#E8DFC7] transition-colors"
                  >
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] font-bold">
                      {tm.tmNo || "-"}
                    </td>
                    <td
                      className="px-4 py-3 border-r-2 border-[#0C0C0C] max-w-[200px] truncate overflow-hidden"
                      title={tm.appName || ""}
                    >
                      {tm.appName || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.appClass || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.stage && (
                        <Badge variant={tm.stage.toLowerCase() as any}>
                          {tm.stage}
                        </Badge>
                      )}
                      {tm.subStage && (
                        <div className="text-[10px] text-gray-600 mt-1 uppercase">
                          {tm.subStage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.city || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.folderNo || "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C]">
                      {tm.date ? format(new Date(tm.date), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="px-4 py-3 border-r-2 border-[#0C0C0C] text-center">
                      {tm.isTm11 ? (
                        <span className="text-[#C94A00] font-bold text-lg">
                          ★
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/trademarks/${tm.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white"
                        >
                          <Edit className="w-3 h-3 mr-1" /> EDIT
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
