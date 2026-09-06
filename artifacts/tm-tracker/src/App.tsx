import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AuthGate } from "@/components/AuthGate";

const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const SearchPage = lazy(() => import("./pages/SearchPage").then(m => ({ default: m.SearchPage })));
const DatabasePage = lazy(() => import("./pages/DatabasePage").then(m => ({ default: m.DatabasePage })));
const JournalPage = lazy(() => import("./pages/JournalPage").then(m => ({ default: m.JournalPage })));
const LogsPage = lazy(() => import("./pages/LogsPage").then(m => ({ default: m.LogsPage })));
const RecordView = lazy(() => import("./pages/RecordView").then(m => ({ default: m.RecordView })));
const AssignedPage = lazy(() => import("./pages/AssignedPage").then(m => ({ default: m.AssignedPage })));
const NotFound = lazy(() => import("@/pages/not-found"));
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function LegacyClientNameGuard() {
  useEffect(() => {
    const hide = () => document.querySelectorAll("label").forEach(label => {
      if (label.textContent?.trim().toUpperCase() === "CLIENT NAME") {
        const field = label.parentElement as HTMLElement | null;
        if (field) { field.setAttribute("data-brandex-hidden-client-name", "true"); field.style.display = "none"; }
      }
    });
    hide();
    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

function Router() { return <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#F0E8D0] font-mono font-bold text-[#6d6658]">LOADING…</div>}><Switch><Route path="/" component={Dashboard}/><Route path="/search" component={SearchPage}/><Route path="/database" component={DatabasePage}/><Route path="/journal" component={JournalPage}/><Route path="/assigned" component={AssignedPage}/><Route path="/record/:id" component={RecordView}/><Route path="/logs" component={LogsPage}/><Route component={NotFound}/></Switch></Suspense>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><LegacyClientNameGuard/><AuthGate><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router/></WouterRouter></AuthGate><Toaster/></TooltipProvider></QueryClientProvider>; }
export default App;
