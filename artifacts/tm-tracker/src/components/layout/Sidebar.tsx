import { Link, useLocation } from "wouter";
import { useSyncFromSheets } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Database,
  ScrollText,
  DatabaseZap,
  BriefcaseBusiness,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/search", label: "SEARCH TM", icon: Search },
  { href: "/database", label: "DATABASE", icon: Database },
  { href: "/logs", label: "LOGS", icon: ScrollText },
];

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sync = useSyncFromSheets();
  const queryClient = useQueryClient();
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSynced(false);
    sync.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setSynced(true);
        setTimeout(() => setSynced(false), 3000);
      },
    });
  };

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b-2 border-[#0C0C0C]">
        <BriefcaseBusiness className="w-7 h-7 text-[#C94A00] shrink-0" strokeWidth={2.5} />
        <div>
          <div className="font-serif text-xl leading-none text-[#F0E8D0] tracking-widest">BRANDEX</div>
          <div className="font-mono text-[10px] text-[#C94A00] tracking-widest uppercase">Law Associate</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 font-mono font-bold text-xs tracking-widest uppercase
                transition-all border-2 
                ${active
                  ? "bg-[#C94A00] border-[#C94A00] text-white"
                  : "border-transparent text-[#C5B89A] hover:bg-[#1A1A1A] hover:border-[#333] hover:text-[#F0E8D0]"
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sync button */}
      <div className="px-3 pb-4 border-t-2 border-[#1A1A1A] pt-4">
        <button
          onClick={handleSync}
          disabled={sync.isPending}
          className="w-full flex items-center justify-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hover:brightness-105 active:brightness-95 transition-all disabled:opacity-50"
        >
          <DatabaseZap className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "SYNCING..." : synced ? "SYNCED ✓" : "SYNC G-SHEETS"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 bg-[#0C0C0C] text-[#F0E8D0] p-2 border-2 border-[#333]"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile sliding */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-52 bg-[#0C0C0C] border-r-2 border-[#1A1A1A]
          flex flex-col z-40 transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <NavContent />
      </aside>
    </>
  );
}
