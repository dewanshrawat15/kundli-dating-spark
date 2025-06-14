
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { useAstrologicalMatching } from "@/hooks/useAstrologicalMatching";
import { useLocation } from "@/hooks/useLocation";
import { toast } from "@/hooks/use-toast";
import MobileHeader from "@/components/mobile/MobileHeader";
import ProfileCard from "@/components/mobile/ProfileCard";
import SwipeActions from "@/components/mobile/SwipeActions";
import LoadingState from "@/components/mobile/LoadingState";
import EmptyState from "@/components/mobile/EmptyState";

const Home = () => {
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const { 
    currentProfile, 
    loading, 
    error: matchingError, 
    hasEnoughUsers, 
    processingCount,
    handleLike, 
    handlePass 
  } = useAstrologicalMatching();
  const { isLoading: locationLoading, error: locationError, updateUserLocation } = useLocation();
  const navigate = useNavigate();
  const locationUpdateAttempted = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!profile && user.id) {
      fetchProfile(user.id);
      return;
    }
    
    if (profile) {
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
        navigate("/onboarding");
        return;
      }

      // Only request location once per session if not set
      if (!profile.current_city && !locationUpdateAttempted.current) {
        console.log('Profile loaded but no current_city - requesting location');
        locationUpdateAttempted.current = true;
        updateUserLocation();
      }
    }
  }, [user, profile, navigate, fetchProfile, updateUserLocation]);

  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Error",
        description: locationError,
        variant: "destructive",
      });
    }
  }, [locationError]);

  const onLike = async () => {
    if (!currentProfile) return;
    
    await handleLike();
    toast({
      title: "Cosmic Connection! ✨",
      description: `You and ${currentProfile.name} are astrologically aligned! (Score: ${currentProfile.compatibilityScore}/100)`,
    });
  };

  const onPass = async () => {
    await handlePass();
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleMatchesClick = () => {
    navigate("/matches");
  };

  // Loading state
  if (loading || locationLoading) {
    return (
      <LoadingState 
        message={locationLoading ? 'Getting your location...' : 'Finding your cosmic matches...'}
        processingCount={processingCount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <MobileHeader title="Discover" onProfileClick={handleProfileClick} />
      
      <div className="pt-4 pb-8">
        <div className="text-center mb-4 px-4">
          <Button 
            onClick={handleMatchesClick}
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/20 bg-white/10"
          >
            View Matches
          </Button>
        </div>

        {/* Error state */}
        {matchingError && (
          <EmptyState
            type="error"
            message={matchingError}
            actionText="Complete Profile"
            onAction={() => navigate("/profile")}
          />
        )}

        {/* Waiting state when there aren't enough users */}
        {!matchingError && !hasEnoughUsers && (
          <EmptyState
            type="waiting"
            message="We're gathering more cosmic souls in your area!"
            currentCity={profile?.current_city || 'Your Area'}
          />
        )}

        {/* Profile display */}
        {!matchingError && hasEnoughUsers && currentProfile && (
          <>
            <ProfileCard profile={currentProfile} />
            <SwipeActions 
              onLike={onLike}
              onPass={onPass}
              disabled={!currentProfile}
            />
          </>
        )}

        {/* No more profiles */}
        {!matchingError && hasEnoughUsers && !currentProfile && (
          <EmptyState
            type="noProfiles"
            message="Check back later for new cosmic matches!"
          />
        )}
      </div>
    </div>
  );
};

export default Home;
