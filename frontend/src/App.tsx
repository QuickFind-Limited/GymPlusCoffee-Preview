import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
// import { ThemeProvider } from "next-themes";
import { Logger } from "@/services/Logger";
import { navigateToConversation } from "@/utils/navigationUtils";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import Dashboard from "./pages/Dashboard";
import DataSources from "./pages/DataSources";
import Insights from "./pages/Insights";
import Forecasts from "./pages/Forecasts";
import ProductDetails from "./pages/ProductDetails";
import ProductsCatalog from "./pages/ProductsCatalog";
import NotFound from "./pages/NotFound";
import Storage from "./pages/Storage";
import VerifyEmail from "./pages/VerifyEmail";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import { FinancialDataProvider } from "./contexts/FinancialDataContext";
import { UserProvider } from "./contexts/UserContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Checking authentication…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const DashboardWithNavigation = () => {
  const navigate = useNavigate();

  const handleNavigateToConversation = (message: string) => {
    navigateToConversation(navigate, message);
  };

  return (
    <Dashboard
      onNavigateToConversation={handleNavigateToConversation}
    />
  );
};

const AuthGateway = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isProcessingCode, setIsProcessingCode] = useState(false);

  useEffect(() => {
    const processAuthCode = async () => {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");
      const errorDescription = currentUrl.searchParams.get("error_description");

      if (errorDescription) {
        toast({
          title: "Verification failed",
          description: decodeURIComponent(errorDescription),
          variant: "destructive",
        });
      }

      if (code) {
        setIsProcessingCode(true);
        try {
          const { error } = await supabase.auth.exchangeCodeForSession({ authCode: code });

          if (error) {
            toast({
              title: "Verification failed",
              description: error.message,
              variant: "destructive",
            });
            currentUrl.searchParams.delete("code");
            currentUrl.searchParams.delete("error_description");
            window.history.replaceState({}, document.title, currentUrl.pathname);
            navigate("/auth", { replace: true });
            return;
          }

          // Clean the URL and navigate to the confirmation screen
          window.history.replaceState({}, document.title, "/auth/confirm");
          navigate("/auth/confirm", { replace: true });
        } catch (err) {
          toast({
            title: "Verification failed",
            description: err instanceof Error ? err.message : "Unknown error",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
        } finally {
          setIsProcessingCode(false);
        }
        return; // Avoid processing normal navigation when a code was handled
      }

      if (!loading) {
        navigate(user ? "/dashboard" : "/auth", { replace: true });
      }
    };

    processAuthCode();
  }, [user, loading, navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      {isProcessingCode ? "Confirming your email…" : "Redirecting…"}
    </div>
  );
};

const queryClient = new QueryClient();

const RoutesWithProviders = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <FinancialDataProvider>
          <ConversationProvider>
            <Routes>
              <Route path="/" element={<AuthGateway />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardWithNavigation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources"
                element={
                  <ProtectedRoute>
                    <DataSources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products-catalog"
                element={
                  <ProtectedRoute>
                    <ProductsCatalog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forecasts"
                element={
                  <ProtectedRoute>
                    <Forecasts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/insights"
                element={
                  <ProtectedRoute>
                    <Insights />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/storage"
                element={
                  <ProtectedRoute>
                    <Storage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ConversationProvider>
        </FinancialDataProvider>
      </UserProvider>
    </AuthProvider>
  );
};

const App = () => {
  Logger.debug("App render - checking routes");

  return (
    <QueryClientProvider client={queryClient}>
      {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoutesWithProviders />
        </BrowserRouter>
      </TooltipProvider>
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  );
};

export default App;
