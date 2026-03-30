import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setBaseUrl } from "@workspace/api-client-react";

// Context & Layout
import { CheckinProvider } from "@/context/CheckinContext";
import { Layout } from "@/components/Layout";

// Pages
import Home from "@/pages/Home";
import Share from "@/pages/Share";
import Insights from "@/pages/Insights";
import Community from "@/pages/Community";
import Goals from "@/pages/Goals";
import Meditate from "@/pages/Meditate";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/share" component={Share} />
        <Route path="/insights" component={Insights} />
        <Route path="/goals" component={Goals} />
        <Route path="/community" component={Community} />
        <Route path="/meditate" component={Meditate} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Set the API base URL for backend calls
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    setBaseUrl(apiUrl);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CheckinProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CheckinProvider>
    </QueryClientProvider>
  );
}

export default App;
