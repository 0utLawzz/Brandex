import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, Search, Database, ScrollText, RefreshCw, Menu, X, Users2, LogOut, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/search", label: "SEARCH TM", icon: Search },
  { href: "/database", label: "DATABASE", icon: Database },
  { href: "/journal", label: "JOURNAL", icon: BookOpen },
  { href: "/assigned", label: "AGENT CONTROL", icon: Users2 },
  { href: "/logs", label: "LOGS", icon: ScrollText },
];
export function Navbar() {
  const [location] = useLocation(); const [mobileOpen,setMobileOpen]=useState(false); const [refreshing,setRefreshing]=useState(false); const queryClient=useQueryClient();
  const handleRefresh=async()=>{setRefreshing(true);await queryClient.invalidateQueries();setTimeout(()=>setRefreshing(false),800);};
  const isActive=(href:string)=>href==="/"?location==="/":location.startsWith(href);
  return <><header className="sticky top-0 z-40 border-b-2 border-[#1A1A1A] bg-[#0C0C0C] text-[#F0E8D0] shadow-md print:hidden"><div className="flex h-16 w-full items-center justify-between px-4"><Link href="/" className="flex shrink-0 items-center gap-2.5"><img src="/brandex-logo.png" alt="Brandex Law Associates Logo" className="h-9 w-9 rounded-sm border border-[#C94A00]/40 bg-white p-0.5"/><div className="hidden sm:block"><div className="font-serif text-base leading-none tracking-wider whitespace-nowrap">BRANDEX LAW ASSOCIATES</div><div className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-[#C94A00]">Trademark & IP Registry</div></div></Link><nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">{NAV_ITEMS.map(({href,label,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-2 border-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest ${isActive(href)?"border-[#C94A00] bg-[#C94A00] text-white":"border-transparent text-[#C5B89A] hover:border-[#333] hover:bg-[#1A1A1A]"}`}><Icon className="h-3.5 w-3.5"/>{label}</Link>)}</nav><div className="flex w-52 shrink-0 items-center justify-end gap-2"><button onClick={handleRefresh} disabled={refreshing} className="hidden items-center gap-2 border-2 border-black bg-[#D4A800] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider sm:flex"><RefreshCw className={`h-3.5 w-3.5 ${refreshing?"animate-spin":""}`}/>{refreshing?"REFRESHING…":"REFRESH"}</button><button onClick={()=>supabase.auth.signOut()} className="hidden border-2 border-[#333] p-2 text-[#C5B89A] hover:text-white sm:flex"><LogOut className="h-3.5 w-3.5"/></button><button className="p-2 lg:hidden" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X/>:<Menu/>}</button></div></div></header>{mobileOpen&&<div className="fixed inset-0 top-16 z-30 flex flex-col bg-[#0C0C0C] p-4 lg:hidden"><nav className="space-y-2">{NAV_ITEMS.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setMobileOpen(false)} className={`flex items-center gap-3 border-2 px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest ${isActive(href)?"border-[#C94A00] bg-[#C94A00] text-white":"border-transparent text-[#C5B89A]"}`}><Icon className="h-5 w-5"/>{label}</Link>)}</nav><button onClick={()=>{handleRefresh();setMobileOpen(false)}} className="mt-auto flex w-full items-center justify-center gap-2 border-2 border-black bg-[#D4A800] px-4 py-3 font-mono text-sm font-bold uppercase">{refreshing?"REFRESHING…":"REFRESH DATA"}</button></div>}</>;
}
