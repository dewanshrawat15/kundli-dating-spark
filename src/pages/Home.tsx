import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, Star, MapPin, Users, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { useAstrologicalMatching } from "@/hooks/useAstrologicalMatching";
import { useLocation } from "@/hooks/useLocation";
import { toast } from "@/hooks/use-toast";

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

  if (loading || locationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <div className="text-xl mb-2">
            {locationLoading ? 'Getting your location...' : 'Finding your cosmic matches...'}
          </div>
          {processingCount > 0 && (
            <div className="text-sm text-purple-200">
              Calculating astrological compatibility for {processingCount} profiles...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (matchingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-sm mx-auto pt-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Discover</h1>
            <Button 
              onClick={() => navigate("/matches")}
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/20 bg-white/10"
            >
              View Matches
            </Button>
          </div>

          <Card className="bg-white/90 backdrop-blur border-white/20 overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Astrological Setup Required
              </h2>
              <p className="text-gray-700 mb-4">
                {matchingError}
              </p>
              <Button 
                onClick={() => navigate("/profile")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show waiting state when there aren't enough users
  if (!hasEnoughUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-sm mx-auto pt-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Discover</h1>
            <Button 
              onClick={() => navigate("/matches")}
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/20 bg-white/10"
            >
              View Matches
            </Button>
          </div>

          <Card className="bg-white/90 backdrop-blur border-white/20 overflow-hidden shadow-lg">
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Building Your Community
              </h2>
              <p className="text-gray-700 mb-4">
                We're gathering more cosmic souls in your area! 
              </p>
              <div className="bg-purple-100 rounded-lg p-4 mb-4 border border-purple-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-800 font-medium">
                    {profile?.current_city || 'Your Area'}
                  </span>
                </div>
                <p className="text-purple-700 text-sm">
                  We need at least 10 users in your city to start showing matches. 
                  Invite friends to join and build your local community!
                </p>
              </div>
              <p className="text-gray-600 text-sm">
                ✨ More people are joining every day. Check back soon!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Discover</h1>
          <Button 
            onClick={() => navigate("/matches")}
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/20 bg-white/10"
          >
            View Matches
          </Button>
        </div>

        {currentProfile ? (
          <Card className="bg-white/90 backdrop-blur border-white/20 overflow-hidden shadow-lg">
            <div className="h-96 bg-gradient-to-b from-pink-400/30 to-purple-600/30 flex items-center justify-center">
              <div className="text-6xl">👤</div>
            </div>
            <CardContent className="p-6">
              <div className="text-gray-800">
                <h2 className="text-2xl font-bold mb-1 text-gray-900">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                
                <div className="flex items-center gap-2 mb-3 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{currentProfile.currentCity}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-blue-100 rounded-lg p-2 text-center border border-blue-200">
                    <div className="font-medium text-blue-800">Orientation</div>
                    <div className="text-blue-600 capitalize">{currentProfile.sexualOrientation}</div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 text-center border border-green-200">
                    <div className="font-medium text-green-800">Looking for</div>
                    <div className="text-green-600 capitalize">{currentProfile.datingPreference}</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{currentProfile.bio}</p>
                
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <div>
                      <span className="text-gray-900 font-bold text-lg">
                        Compatibility: {currentProfile.compatibilityScore}/100
                      </span>
                      <div className="text-xs text-purple-600">Astrological Analysis</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentProfile.compatibilityScore}%` }}
                    />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {currentProfile.compatibilityDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur border-white/20 h-96 flex items-center justify-center shadow-lg">
            <div className="text-gray-800 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-900 font-semibold">No more profiles for now</p>
              <p className="text-gray-600 text-sm">Check back later for new cosmic matches!</p>
            </div>
          </Card>
        )}

        <div className="flex justify-center gap-6 mt-6">
          <Button
            onClick={onPass}
            size="lg"
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white"
            disabled={!currentProfile}
          >
            <X className="h-8 w-8" />
          </Button>
          <Button
            onClick={onLike}
            size="lg"
            className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-white"
            disabled={!currentProfile}
          >
            <Heart className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
