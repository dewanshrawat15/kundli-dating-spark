import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (isAuthenticated && !profile) {
      fetchProfile();
      return;
    }

    if (requireOnboarding && user && !user.is_onboarding_complete) {
      navigate("/onboarding");
      return;
    }

    if (isAuthenticated && window.location.pathname === "/auth") {
      navigate("/home");
    }
  }, [isAuthenticated, isInitialized, isLoading, user, profile, navigate, fetchProfile, requireAuth, requireOnboarding]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
