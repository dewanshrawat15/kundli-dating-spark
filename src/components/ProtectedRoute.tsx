
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireOnboarding = false 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything until auth is initialized
    if (!isInitialized || isLoading) return;

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // If user is authenticated, fetch profile if needed
    if (isAuthenticated && user?.id && !profile) {
      fetchProfile(user.id);
      return;
    }

    // If onboarding is required but not complete
    if (requireOnboarding && profile) {
      const hasDefaultValues = 
        !profile.name || 
        profile.name === "User" || 
        profile.placeOfBirth === "Unknown" ||
        !profile.dateOfBirth ||
        !profile.timeOfBirth ||
        !profile.placeOfBirth ||
        !profile.sexualOrientation ||
        !profile.datingPreference;

      if (!profile.isOnboardingComplete || hasDefaultValues) {
        navigate('/onboarding');
        return;
      }
    }

    // If user is authenticated but on auth page, redirect to home
    if (isAuthenticated && window.location.pathname === '/auth') {
      navigate('/home');
    }
  }, [isAuthenticated, isInitialized, isLoading, user, profile, navigate, fetchProfile, requireAuth, requireOnboarding]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
