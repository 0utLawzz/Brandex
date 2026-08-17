import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";

import { Dashboard } from "./pages/Dashboard";
import { SearchPage } from "./pages/SearchPage";
import { DatabasePage } from "./pages/DatabasePage";
import { LogsPage } from "./pages/LogsPage";
import NotFound from "@/pages/not-found";

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
      <Route path="/" component={Dashboard} />
      <Route path="/search" component={SearchPage} />
      <Route path="/database" component={DatabasePage} />
      <Route path="/logs" component={LogsPage} />
      {/* Legacy routes — redirect to database with edit modal */}
      <Route path="/trademarks/:id">
        {(params) => {
          window.location.href = `/database?edit=${params.id}`;
          return null;
        }}
      </Route>
      <Route path="/new">
        {() => {
          window.location.href = `/database?new=1`;
          return null;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
