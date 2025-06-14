
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  currentCity: string;
  sexualOrientation: string;
  datingPreference: string;
  profileImages: string[];
}

export const useProfileMatching = () => {
  const [potentialMatches, setPotentialMatches] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasEnoughUsers, setHasEnoughUsers] = useState(false);
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const isCompatibleOrientation = (userOrientation: string, userPreference: string, targetOrientation: string, targetPreference: string) => {
    // Check if users are compatible based on sexual orientation and dating preferences
    if (userPreference === 'everyone' || targetPreference === 'everyone') {
      return true;
    }
    
    if (userPreference === 'men' && (targetOrientation === 'straight' || targetOrientation === 'gay' || targetOrientation === 'bisexual' || targetOrientation === 'pansexual')) {
      return targetPreference === 'men' || targetPreference === 'everyone';
    }
    
    if (userPreference === 'women' && (targetOrientation === 'straight' || targetOrientation === 'lesbian' || targetOrientation === 'bisexual' || targetOrientation === 'pansexual')) {
      return targetPreference === 'women' || targetPreference === 'everyone';
    }
    
    return false;
  };

  const fetchPotentialMatches = async () => {
    if (!user || !profile || !profile.currentLocationLat || !profile.currentLocationLng) {
      setLoading(false);
      return;
    }

    try {
      // First, check how many users are in the same city
      const { data: cityUsers, error: cityError } = await supabase
        .from('profiles')
        .select('id')
        .eq('current_city', profile.current_city || '')
        .eq('is_onboarding_complete', true)
        .neq('id', user.id);

      if (cityError) throw cityError;

      const cityUserCount = cityUsers?.length || 0;
      console.log(`Found ${cityUserCount} users in the same city`);

      if (cityUserCount < 10) {
        setHasEnoughUsers(false);
        setLoading(false);
        return;
      }

      setHasEnoughUsers(true);

      // Fetch potential matches from the same city
      const { data: matches, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('current_city', profile.current_city || '')
        .eq('is_onboarding_complete', true)
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;

      // Filter matches based on sexual orientation and dating preferences
      const compatibleMatches = matches?.filter(match => {
        return isCompatibleOrientation(
          profile.sexualOrientation,
          profile.datingPreference,
          match.sexual_orientation,
          match.dating_preference
        );
      }) || [];

      // Transform the data
      const transformedMatches: MatchProfile[] = compatibleMatches.map(match => ({
        id: match.id,
        name: match.name,
        age: calculateAge(match.date_of_birth),
        bio: match.bio || "No bio available",
        currentCity: match.current_city || "City not specified",
        sexualOrientation: match.sexual_orientation,
        datingPreference: match.dating_preference,
        profileImages: match.profile_images || [],
      }));

      setPotentialMatches(transformedMatches);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching potential matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextProfile = () => {
    if (currentIndex < potentialMatches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more profiles, could fetch more or show end state
      setCurrentIndex(potentialMatches.length);
    }
  };

  const getCurrentProfile = () => {
    if (currentIndex < potentialMatches.length) {
      return potentialMatches[currentIndex];
    }
    return null;
  };

  useEffect(() => {
    fetchPotentialMatches();
  }, [user, profile]);

  return {
    currentProfile: getCurrentProfile(),
    loading,
    hasEnoughUsers,
    getNextProfile,
    refetch: fetchPotentialMatches
  };
};
