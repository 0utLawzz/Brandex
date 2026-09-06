import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, BookOpen } from "lucide-react";

export function JournalPage() {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["journal-publications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_publications")
        .select("*")
        .order("publication_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30000,
  });

  const months = useMemo(() => {
    return [...new Set(
      data
        .map((r: any) => String(r.publication_date ?? "").slice(0, 7))
        .filter(Boolean),
    )].sort().reverse();
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r: any) => {
      const matchesMonth = !month || String(r.publication_date ?? "").startsWith(month);
      const matchesQuery = !q || [
        r.journal_no,
        r.application_no,
        r.trademark_number,
        r.title,
        r.class,
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
      return matchesMonth && matchesQuery;
    });
  }, [data, month, query]);

  const grouped = useMemo(() => {
    return filtered.reduce((m: Record<string, number>, r: any) => {
      const key = r.journal_no || "UNNUMBERED";
      m[key] = (m[key] || 0) + 1;
      return m;
    }, {});
  }, [filtered]);

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-[#F0E8D0] p-5">
        <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-3 border-b-2 border-black pb-4">
            <BookOpen className="h-6 w-6" />
            <div>
              <h1 className="font-serif text-3xl uppercase tracking-widest">JOURNAL</h1>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#6d6658]">
                Monthly IPO publication history · separate from TM workflow
              </p>
            </div>
            <div className="ml-auto font-mono text-xs font-bold">{filtered.length} PUBLICATIONS</div>
          </header>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mark, TM number, application, journal…"
                className="h-9 w-full border-2 border-black bg-white pl-9 pr-3 font-mono text-xs"
              />
            </div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 border-2 border-black bg-white px-3 font-mono text-xs"
            >
              <option value="">ALL MONTHS</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(grouped).slice(0, 8).map(([journal, count]) => (
              <div key={journal} className="border-2 border-black bg-white p-3">
                <div className="font-mono text-[9px] font-bold uppercase text-[#6d6658]">JOURNAL {journal}</div>
                <div className="font-serif text-3xl">{count}</div>
                <div className="font-mono text-[9px]">PUBLICATIONS FOUND</div>
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto border-2 border-black bg-white">
            <table className="w-full whitespace-nowrap font-mono text-xs">
              <thead className="sticky top-0 bg-black text-[#F0E8D0]">
                <tr>
                  {[
                    "JOURNAL", "PUBLICATION DATE", "APPLICATION NO", "TM / CPR",
                    "MARK / TITLE", "CLASS", "FILING DATE",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="p-10 text-center">LOADING JOURNAL…</td></tr>
                )}
                {!isLoading && error && (
                  <tr><td colSpan={7} className="p-10 text-center text-red-800">JOURNAL LOAD FAILED</td></tr>
                )}
                {!isLoading && !error && filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-black/10 odd:bg-[#F0E8D0]">
                    <td className="px-3 py-2 font-bold">{r.journal_no || "—"}</td>
                    <td className="px-3 py-2">{r.publication_date || "—"}</td>
                    <td className="px-3 py-2">{r.application_no || "—"}</td>
                    <td className="px-3 py-2 font-bold">{r.trademark_number || "—"}</td>
                    <td className="max-w-[280px] truncate px-3 py-2 font-semibold">{r.title || "—"}</td>
                    <td className="px-3 py-2">{r.class || "—"}</td>
                    <td className="px-3 py-2">{r.filing_date || "—"}</td>
                  </tr>
                ))}
                {!isLoading && !error && filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-[#6d6658]">NO PUBLICATIONS FOUND</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
