import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { getAdminToken, subscribeAdminAuth } from '@/lib/auth';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// Configure API client to include admin bearer token
setAuthTokenGetter(() => getAdminToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const isAuthenticated = useSyncExternalStore(
    subscribeAdminAuth,
    () => !!getAdminToken(),
    () => false,
  );

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <DashboardPage /> : <LoginPage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
