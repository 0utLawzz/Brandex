import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";

import { Dashboard }    from "./pages/Dashboard";
import { SearchPage }   from "./pages/SearchPage";
import { DatabasePage } from "./pages/DatabasePage";
import { LogsPage }     from "./pages/LogsPage";
import { RecordView }   from "./pages/RecordView";
import { AssignedPage } from "./pages/AssignedPage";
import NotFound from "@/pages/not-found";
import { AuthGate } from "@/components/AuthGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/"              component={Dashboard} />
      <Route path="/search"        component={SearchPage} />
      <Route path="/database"      component={DatabasePage} />
      <Route path="/assigned"      component={AssignedPage} />
      <Route path="/record/:id"    component={RecordView} />
      <Route path="/logs"          component={LogsPage} />
      <Route                       component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
