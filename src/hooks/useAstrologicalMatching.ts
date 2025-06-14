
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

interface RankedProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  currentCity: string;
  sexualOrientation: string;
  datingPreference: string;
  profileImages: string[];
  compatibilityScore: number;
  compatibilityDescription: string;
  isProcessing?: boolean;
}

interface AstrologicalMatchingState {
  rankedProfiles: RankedProfile[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  hasEnoughUsers: boolean;
  processingCount: number;
}

export const useAstrologicalMatching = () => {
  const [state, setState] = useState<AstrologicalMatchingState>({
    rankedProfiles: [],
    currentIndex: 0,
    loading: true,
    error: null,
    hasEnoughUsers: false,
    processingCount: 0,
  });

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

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

  const calculateCompatibility = async (userProfile: any, targetProfile: any): Promise<{ score: number; description: string }> => {
    try {
      const response = await supabase.functions.invoke('astrological-compatibility', {
        body: {
          userProfile: {
            name: userProfile.name,
            dateOfBirth: userProfile.dateOfBirth,
            timeOfBirth: userProfile.timeOfBirth,
            placeOfBirth: userProfile.placeOfBirth,
          },
          targetProfile: {
            name: targetProfile.name,
            dateOfBirth: targetProfile.date_of_birth,
            timeOfBirth: targetProfile.time_of_birth,
            placeOfBirth: targetProfile.place_of_birth,
          }
        }
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        return { score: 0, description: 'Unable to calculate compatibility' };
      }

      return response.data;
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return { score: 0, description: 'Unable to calculate compatibility' };
    }
  };

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

  const hasCompleteBirthData = (profile: any) => {
    return profile.name && 
           profile.dateOfBirth && 
           profile.timeOfBirth && 
           profile.placeOfBirth &&
           profile.dateOfBirth !== '1990-01-01' &&
           profile.timeOfBirth !== '12:00:00' &&
           profile.placeOfBirth !== 'Unknown';
  };

  const fetchAndRankProfiles = async (offset: number = 0) => {
    if (!user || !profile || !profile.current_city) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Check if current user has complete birth data
    if (!hasCompleteBirthData(profile)) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Please complete your birth details (date, time, and place) in your profile to see astrological matches.' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check total users in city
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
        setState(prev => ({ ...prev, hasEnoughUsers: false, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, hasEnoughUsers: true }));

      // Get 10 unseen profiles
      const { data: unseenProfiles, error } = await supabase
        .rpc('get_unseen_profiles', {
          requesting_user_id: user.id,
          city_filter: profile.current_city,
          limit_count: 10
        });

      if (error) throw error;

      // Filter for compatible orientation and complete birth data
      const compatibleProfiles = unseenProfiles?.filter(match => {
        const hasCompleteData = match.date_of_birth && 
                               match.time_of_birth && 
                               match.place_of_birth &&
                               match.date_of_birth !== '1990-01-01' &&
                               match.time_of_birth !== '12:00:00' &&
                               match.place_of_birth !== 'Unknown';
        
        const isCompatible = isCompatibleOrientation(
          profile.sexualOrientation || '',
          profile.datingPreference || '',
          match.sexual_orientation,
          match.dating_preference
        );

        return hasCompleteData && isCompatible;
      }) || [];

      if (compatibleProfiles.length === 0) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: 'No compatible profiles with complete birth data found. More users are joining daily!'
        }));
        return;
      }

      console.log(`Processing ${compatibleProfiles.length} compatible profiles for astrological ranking`);
      
      // Process profiles for compatibility scoring
      setState(prev => ({ ...prev, processingCount: compatibleProfiles.length }));

      const rankedProfiles: RankedProfile[] = [];

      for (let i = 0; i < compatibleProfiles.length; i++) {
        const match = compatibleProfiles[i];
        
        setState(prev => ({ ...prev, processingCount: compatibleProfiles.length - i }));

        const compatibility = await calculateCompatibility(profile, match);

        const rankedProfile: RankedProfile = {
          id: match.id,
          name: match.name,
          age: match.age,
          bio: match.bio || "No bio available",
          currentCity: match.current_city || "City not specified",
          sexualOrientation: match.sexual_orientation,
          datingPreference: match.dating_preference,
          profileImages: match.profile_images || [],
          compatibilityScore: compatibility.score,
          compatibilityDescription: compatibility.description,
        };

        rankedProfiles.push(rankedProfile);
      }

      // Sort by compatibility score (highest first)
      rankedProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      setState(prev => ({
        ...prev,
        rankedProfiles,
        currentIndex: 0,
        loading: false,
        processingCount: 0,
      }));

      // Record that we've viewed the first profile
      if (rankedProfiles.length > 0) {
        await recordInteraction(rankedProfiles[0].id, 'viewed');
      }

    } catch (error) {
      console.error('Error fetching and ranking profiles:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load astrological matches. Please try again.',
        processingCount: 0,
      }));
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
    const totalProfiles = state.rankedProfiles.length;
    const swipedCount = state.currentIndex + 1;
    const swipedPercentage = (swipedCount / totalProfiles) * 100;

    if (state.currentIndex < totalProfiles - 1) {
      const nextIndex = state.currentIndex + 1;
      setState(prev => ({ ...prev, currentIndex: nextIndex }));
      
      // Record that we've viewed the next profile
      if (state.rankedProfiles[nextIndex]) {
        await recordInteraction(state.rankedProfiles[nextIndex].id, 'viewed');
      }

      // If 70% have been swiped, fetch next batch
      if (swipedPercentage >= 70) {
        console.log('70% swiped, fetching next batch...');
        fetchAndRankProfiles();
      }
    } else {
      // No more profiles, fetch next batch
      setState(prev => ({ ...prev, currentIndex: totalProfiles }));
      fetchAndRankProfiles();
    }
  };

  const getCurrentProfile = () => {
    if (state.currentIndex < state.rankedProfiles.length) {
      return state.rankedProfiles[state.currentIndex];
    }
    return null;
  };

  useEffect(() => {
    fetchAndRankProfiles();
  }, [user, profile]);

  return {
    currentProfile: getCurrentProfile(),
    loading: state.loading,
    error: state.error,
    hasEnoughUsers: state.hasEnoughUsers,
    processingCount: state.processingCount,
    handleLike,
    handlePass,
    refetch: () => fetchAndRankProfiles(),
  };
};
