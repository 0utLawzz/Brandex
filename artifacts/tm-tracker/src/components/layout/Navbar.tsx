import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Database,
  ScrollText,
  RefreshCw,
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

export function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0C0C0C] border-b-2 border-[#1A1A1A] text-[#F0E8D0] shadow-md">
        <div className="flex items-center justify-between px-4 h-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 w-48 shrink-0">
            <BriefcaseBusiness className="w-6 h-6 text-[#C94A00]" strokeWidth={2.5} />
            <div className="hidden sm:block">
              <div className="font-serif text-lg leading-none text-[#F0E8D0] tracking-widest">BRANDEX</div>
              <div className="font-mono text-[9px] text-[#C94A00] tracking-widest uppercase">Google Sheets</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 font-mono font-bold text-xs tracking-widest uppercase transition-all border-2 ${
                    active
                      ? "bg-[#C94A00] border-[#C94A00] text-white"
                      : "border-transparent text-[#C5B89A] hover:bg-[#1A1A1A] hover:border-[#333] hover:text-[#F0E8D0]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 w-48 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh data from Google Sheets"
              className="hidden sm:flex items-center justify-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:brightness-105 active:brightness-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "REFRESHING..." : "REFRESH"}
            </button>

            <button
              className="lg:hidden p-2 text-[#F0E8D0] hover:text-white"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-30 bg-[#0C0C0C] border-t-2 border-[#1A1A1A] flex flex-col p-4">
          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all border-2 ${
                    active
                      ? "bg-[#C94A00] border-[#C94A00] text-white"
                      : "border-transparent text-[#C5B89A] hover:bg-[#1A1A1A] hover:border-[#333] hover:text-[#F0E8D0]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => { handleRefresh(); setMobileOpen(false); }}
            disabled={refreshing}
            className="mt-auto w-full flex items-center justify-center gap-2 bg-[#D4A800] text-[#0C0C0C] border-2 border-[#0C0C0C] px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "REFRESHING..." : "REFRESH DATA"}
          </button>
        </div>
      )}
    </>
  );
}
