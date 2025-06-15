
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/auth" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Auth />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/matches" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                  <Matches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat/:chatId?" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account-settings" 
              element={
                <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                  <AccountSettings />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
