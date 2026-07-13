import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  Search,
  PlusCircle,
  DatabaseZap,
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
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2 font-serif text-3xl tracking-widest text-[#F0E8D0] mr-12">
          <BriefcaseBusiness
            className="w-8 h-8 text-[#C94A00]"
            strokeWidth={2.5}
          />
          BRANDEX LAW ASSOICATE
        </div>

        <div className="flex items-center space-x-6 flex-1">
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
            Registry
          </Link>
          <Link
            href="/new"
            className={`flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-sm py-2 border-b-2 transition-colors ${location === "/new" ? "border-[#C94A00] text-[#C94A00]" : "border-transparent text-[#E8DFC7] hover:text-white hover:border-white"}`}
          >
            <PlusCircle className="w-4 h-4" />
            New TM
          </Link>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleSync}
            disabled={sync.isPending || syncing}
            className="flex items-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-4 py-1.5 font-mono font-bold text-sm uppercase tracking-wider rounded-[6px] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#F0E8D0] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
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
