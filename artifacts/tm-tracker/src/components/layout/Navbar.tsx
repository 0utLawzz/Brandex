import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  Search,
  PlusCircle,
  DatabaseZap,
  Users,
} from "lucide-react";
import { useSyncFromSheets } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const sync = useSyncFromSheets();
  const queryClient = useQueryClient();
  const [syncing, setSynced] = useState(false);

  const handleSync = () => {
    setSynced(true);
    sync.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setTimeout(() => setSynced(false), 2000);
      },
      onError: () => {
        setSynced(false);
      },
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0C0C0C] text-[#F0E8D0] border-b-[3px] border-[#0C0C0C]">
      <div className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-serif text-lg tracking-widest text-[#F0E8D0] sm:text-2xl lg:text-3xl">
          <BriefcaseBusiness
            className="w-8 h-8 text-[#C94A00]"
            strokeWidth={2.5}
          />
          BRANDEX LAW ASSOICATE
        </div>

        <div className="order-3 flex w-full items-center gap-3 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:flex-1 lg:space-x-6">
          <Link
            href="/"
            className={`font-mono font-bold uppercase tracking-widest text-sm py-2 border-b-2 transition-colors ${location === "/" ? "border-[#C94A00] text-[#C94A00]" : "border-transparent text-[#E8DFC7] hover:text-white hover:border-white"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/search"
            className={`flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-sm py-2 border-b-2 transition-colors ${location.startsWith("/search") ? "border-[#C94A00] text-[#C94A00]" : "border-transparent text-[#E8DFC7] hover:text-white hover:border-white"}`}
          >
            <Search className="w-4 h-4" />
            Database
          </Link>
          <Link
            href="/new"
            className={`flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-sm py-2 border-b-2 transition-colors ${location === "/new" ? "border-[#C94A00] text-[#C94A00]" : "border-transparent text-[#E8DFC7] hover:text-white hover:border-white"}`}
          >
            <PlusCircle className="w-4 h-4" />
            New TM
          </Link>
          <Link
            href="/agents"
            className={`flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-sm py-2 border-b-2 transition-colors ${location.startsWith("/agents") ? "border-[#C94A00] text-[#C94A00]" : "border-transparent text-[#E8DFC7] hover:text-white hover:border-white"}`}
          >
            <Users className="w-4 h-4" />
            Agents
          </Link>
        </div>

        <div className="order-2 ml-auto flex items-center lg:order-3">
          <button
            onClick={handleSync}
            disabled={sync.isPending || syncing}
            className="flex items-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-2 py-1.5 font-mono text-xs font-bold uppercase tracking-wider rounded-[6px] whitespace-nowrap sm:px-4 sm:text-sm hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#F0E8D0] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
          >
            <DatabaseZap
              className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`}
            />
            {sync.isPending
              ? "SYNCING..."
              : syncing
                ? "SYNCED!"
                : "SYNC G-SHEETS"}
          </button>
        </div>
      </div>
    </nav>
  );
}
