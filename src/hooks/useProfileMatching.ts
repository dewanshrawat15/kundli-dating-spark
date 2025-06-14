
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

  const isCompatibleOrientation = (userOrientation: string, userPreference: string, targetOrientation: string, targetPreference: string) => {
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

  const recordInteraction = async (targetUserId: string, interactionType: 'viewed' | 'liked' | 'passed') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profile_interactions')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType
        });

      if (error) {
        console.error('Error recording interaction:', error);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const fetchPotentialMatches = async () => {
    if (!user || !profile || !profile.current_city) {
      setLoading(false);
      return;
    }

    try {
      // First, check how many users are in the same city
      const { data: cityUsers, error: cityError } = await supabase
        .from('profiles')
        .select('id')
        .eq('current_city', profile.current_city)
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

      // Use the database function to get unseen profiles
      const { data: unseenProfiles, error } = await supabase
        .rpc('get_unseen_profiles', {
          requesting_user_id: user.id,
          city_filter: profile.current_city,
          limit_count: 20
        });

      if (error) throw error;

      // Filter matches based on sexual orientation and dating preferences
      const compatibleMatches = unseenProfiles?.filter(match => {
        return isCompatibleOrientation(
          profile.sexualOrientation || '',
          profile.datingPreference || '',
          match.sexual_orientation,
          match.dating_preference
        );
      }) || [];

      // Transform the data to match our interface
      const transformedMatches: MatchProfile[] = compatibleMatches.map(match => ({
        id: match.id,
        name: match.name,
        age: match.age,
        bio: match.bio || "No bio available",
        currentCity: match.current_city || "City not specified",
        sexualOrientation: match.sexual_orientation,
        datingPreference: match.dating_preference,
        profileImages: match.profile_images || [],
      }));

      setPotentialMatches(transformedMatches);
      setCurrentIndex(0);

      // Record that we've viewed the first profile
      if (transformedMatches.length > 0) {
        await recordInteraction(transformedMatches[0].id, 'viewed');
      }
    } catch (error) {
      console.error('Error fetching potential matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) return;

    await recordInteraction(currentProfile.id, 'liked');
    getNextProfile();
  };

  const handlePass = async () => {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) return;

    await recordInteraction(currentProfile.id, 'passed');
    getNextProfile();
  };

  const getNextProfile = async () => {
    if (currentIndex < potentialMatches.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Record that we've viewed the next profile
      if (potentialMatches[nextIndex]) {
        await recordInteraction(potentialMatches[nextIndex].id, 'viewed');
      }
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
    handleLike,
    handlePass,
    refetch: fetchPotentialMatches
  };
};
