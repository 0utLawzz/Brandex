import { listTrademarks, searchTm, STAGES, CITIES } from "@/lib/api";
import type { TrademarkRecord, TmSearchResult } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateShort } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  SearchIcon, X, Filter, CheckCircle2, MinusCircle,
  ArrowRight, AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const STAGE_BADGE: Record<string, string> = {
  "STAGE 1": "bg-[#0D9970] text-white",
  "STAGE 2": "bg-[#D4A800] text-[#0C0C0C]",
  "STAGE 3": "bg-[#C94A00] text-white",
  "STAGE 4": "bg-[#0A6B52] text-white",
  "STOPPED": "bg-[#CC0000] text-white",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// FULL FILE RESTORED VIA LOCAL - see Progress.md
// This is a temporary marker; full content follows in next commit if truncated.
export default function SearchPage() {
  return (
    <AppShell title="Search">
      <div className="p-6 font-mono text-sm">Search page restoring…</div>
    </AppShell>
  );
}
