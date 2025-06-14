
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id: string;
  name: string;
  age: number;
  bio: string;
  current_city: string;
  sexual_orientation: string;
  dating_preference: string;
  profile_images: string[];
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
}

interface CompatibilityResponse {
  score: number;
  description: string;
}

interface BatchCompatibilityResponse {
  results: Array<{
    targetName: string;
    score: number;
    description: string;
  }>;
}

interface RankedProfile extends ProfileData {
  compatibilityScore: number;
  compatibilityDescription: string;
  currentCity: string;
  sexualOrientation: string;
  datingPreference: string;
}

export const useAstrologicalMatching = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughUsers, setHasEnoughUsers] = useState(true);
  const [processingCount, setProcessingCount] = useState(0);
  
  // Cache to prevent duplicate API calls
  const compatibilityCache = useRef<Map<string, CompatibilityResponse>>(new Map());
  const isProcessingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProfile = profiles[currentIndex] || null;

  const validateProfileData = (profile: any, profileName: string) => {
    if (!profile) {
      throw new Error(`${profileName} is missing`);
    }
    if (!profile.name || typeof profile.name !== 'string') {
      throw new Error(`${profileName} name is missing or invalid: ${JSON.stringify(profile)}`);
    }
    if (!profile.dateOfBirth && !profile.date_of_birth) {
      throw new Error(`${profileName} dateOfBirth is missing`);
    }
    if (!profile.timeOfBirth && !profile.time_of_birth) {
      throw new Error(`${profileName} timeOfBirth is missing`);
    }
    if (!profile.placeOfBirth && !profile.place_of_birth) {
      throw new Error(`${profileName} placeOfBirth is missing`);
    }
    return true;
  };

  const recordInteraction = async (targetUserId: string, interactionType: 'viewed' | 'liked' | 'passed') => {
    if (!user?.id) {
      console.error('No user ID available for recording interaction');
      return false;
    }

    try {
      console.log(`Recording ${interactionType} interaction for user ${targetUserId}`);
      
      const { data, error } = await supabase
        .from('profile_interactions')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType
        })
        .select();

      if (error) {
        console.error('Error recording interaction:', error);
        return false;
      }

      console.log(`Successfully recorded ${interactionType} interaction:`, data);
      return true;
    } catch (err) {
      console.error('Error recording interaction:', err);
      return false;
    }
  };

  const debugProfileInteractions = async () => {
    if (!user?.id) return;
    
    try {
      const { data: interactions, error } = await supabase
        .from('profile_interactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching interactions:', error);
      } else {
        console.log('Current interactions for user:', interactions);
      }
    } catch (err) {
      console.error('Error debugging interactions:', err);
    }
  };

  const debouncedFetchMore = useCallback(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a new timeout to prevent rapid successive calls
    fetchTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      
      // Only fetch if it's been at least 2 seconds since last fetch
      if (timeSinceLastFetch >= 2000 && !isProcessingRef.current && hasEnoughUsers) {
        console.log('Debounced fetch triggered - fetching more profiles...');
        fetchAndRankProfiles(false);
      }
    }, 1000); // 1 second debounce
  }, [hasEnoughUsers]);

  const fetchAndRankProfiles = useCallback(async (isRefetch = false) => {
    if (!user?.id || !profile || isProcessingRef.current) {
      console.log('Skipping fetch - missing requirements or already processing');
      return;
    }

    // Prevent rapid successive calls
    const now = Date.now();
    if (!isRefetch && (now - lastFetchTimeRef.current) < 2000) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }

    // Check if user has complete birth data
    if (!profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth) {
      setError("Complete your astrological profile (birth date, time, and place) to see matches");
      return;
    }

    console.log('Starting fetchAndRankProfiles for user:', user.id, 'isRefetch:', isRefetch);
    
    // Debug current interactions only on initial fetch
    if (isRefetch) {
      await debugProfileInteractions();
    }
    
    isProcessingRef.current = true;
    lastFetchTimeRef.current = now;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching unseen profiles...');
      
      // Fetch unseen profiles
      const { data: unseenProfiles, error: fetchError } = await supabase.rpc(
        'get_unseen_profiles', 
        { 
          requesting_user_id: user.id,
          city_filter: profile.current_city,
          limit_count: 10
        }
      ) as { data: ProfileData[] | null, error: any };

      if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        throw fetchError;
      }

      console.log('Unseen profiles response:', unseenProfiles);

      if (!unseenProfiles || unseenProfiles.length === 0) {
        console.log('No unseen profiles found');
        setHasEnoughUsers(false);
        if (isRefetch) {
          // If this is a refetch and no profiles found, we've reached the end
          setProfiles([]);
        }
        return;
      }

      if (unseenProfiles.length < 10 && profile.current_city) {
        setHasEnoughUsers(false);
      }

      console.log(`Found ${unseenProfiles.length} profiles, calculating compatibility in batch...`);
      setProcessingCount(unseenProfiles.length);

      // Validate current user profile before processing
      try {
        validateProfileData(profile, 'Current user profile');
      } catch (validationError) {
        console.error('Current user profile validation failed:', validationError);
        setError(`Profile validation error: ${validationError.message}`);
        return;
      }

      // Filter profiles with complete birth data
      const validProfiles = unseenProfiles.filter(unseenProfile => {
        if (!unseenProfile.date_of_birth || !unseenProfile.time_of_birth || !unseenProfile.place_of_birth) {
          console.log(`Skipping profile ${unseenProfile.name} - incomplete birth data`);
          return false;
        }

        try {
          validateProfileData(unseenProfile, `Target profile ${unseenProfile.name}`);
          return true;
        } catch (validationError) {
          console.error(`Validation failed for ${unseenProfile.name}:`, validationError);
          return false;
        }
      });

      if (validProfiles.length === 0) {
        console.log('No valid profiles with complete birth data found');
        if (isRefetch) {
          setProfiles([]);
        }
        setProcessingCount(0);
        return;
      }

      // Prepare batch compatibility request
      const userProfileData = {
        name: profile.name,
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.timeOfBirth,
        placeOfBirth: profile.placeOfBirth
      };

      const targetProfiles = validProfiles.map(unseenProfile => ({
        name: unseenProfile.name,
        dateOfBirth: unseenProfile.date_of_birth,
        timeOfBirth: unseenProfile.time_of_birth,
        placeOfBirth: unseenProfile.place_of_birth
      }));

      console.log('Sending batch compatibility request for', validProfiles.length, 'profiles');

      // Make batch compatibility request
      const { data: batchCompatibilityData, error: compatibilityError } = await supabase.functions.invoke(
        'astrological-compatibility',
        {
          body: {
            userProfile: userProfileData,
            targetProfiles: targetProfiles
          }
        }
      );

      if (compatibilityError) {
        console.error('Batch compatibility error:', compatibilityError);
        throw compatibilityError;
      }

      const batchResult = batchCompatibilityData as BatchCompatibilityResponse;
      console.log('Batch compatibility results:', batchResult);

      // Create ranked profiles with compatibility data
      const rankedProfiles: RankedProfile[] = validProfiles.map((unseenProfile) => {
        const compatibilityResult = batchResult.results?.find(
          result => result.targetName === unseenProfile.name
        );

        return {
          ...unseenProfile,
          currentCity: unseenProfile.current_city,
          sexualOrientation: unseenProfile.sexual_orientation,
          datingPreference: unseenProfile.dating_preference,
          compatibilityScore: compatibilityResult?.score || 50,
          compatibilityDescription: compatibilityResult?.description || "Compatibility analysis unavailable."
        };
      });

      // Sort by compatibility score (highest first)
      rankedProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      console.log(`Ranked ${rankedProfiles.length} profiles by compatibility`);
      
      if (isRefetch) {
        // Replace existing profiles with new ones
        setProfiles(rankedProfiles);
        setCurrentIndex(0);
      } else {
        // Append to existing profiles
        setProfiles(prev => [...prev, ...rankedProfiles]);
      }
      
      setProcessingCount(0);

    } catch (err) {
      console.error('Error in fetchAndRankProfiles:', err);
      setError("Failed to load profiles. Please try again.");
      setProcessingCount(0);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [user?.id, profile]);

  const handleLike = useCallback(async () => {
    if (!user?.id || !currentProfile) return;

    try {
      console.log('Handling like for profile:', currentProfile.id);
      
      // Record the interaction and wait for it to complete
      const success = await recordInteraction(currentProfile.id, 'liked');
      
      if (!success) {
        console.error('Failed to record like interaction');
        return;
      }

      // Move to next profile
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Check if we need to fetch more profiles (when 80% of profiles are consumed)
      const remainingProfiles = profiles.length - nextIndex;
      const totalProfiles = profiles.length;
      
      if (totalProfiles > 0) {
        const percentageRemaining = (remainingProfiles / totalProfiles) * 100;
        console.log(`Remaining profiles: ${remainingProfiles}/${totalProfiles} (${percentageRemaining.toFixed(1)}%)`);

        // Use debounced fetch to prevent rapid successive calls
        if (percentageRemaining <= 20 && hasEnoughUsers) {
          console.log('Reached 80% threshold, scheduling debounced fetch...');
          debouncedFetchMore();
        }
      }

    } catch (err) {
      console.error('Error handling like:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, debouncedFetchMore, hasEnoughUsers]);

  const handlePass = useCallback(async () => {
    if (!user?.id || !currentProfile) return;

    try {
      console.log('Handling pass for profile:', currentProfile.id);
      
      // Record the interaction and wait for it to complete
      const success = await recordInteraction(currentProfile.id, 'passed');
      
      if (!success) {
        console.error('Failed to record pass interaction');
        return;
      }

      // Move to next profile
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Check if we need to fetch more profiles (when 80% of profiles are consumed)
      const remainingProfiles = profiles.length - nextIndex;
      const totalProfiles = profiles.length;
      
      if (totalProfiles > 0) {
        const percentageRemaining = (remainingProfiles / totalProfiles) * 100;
        console.log(`Remaining profiles: ${remainingProfiles}/${totalProfiles} (${percentageRemaining.toFixed(1)}%)`);

        // Use debounced fetch to prevent rapid successive calls
        if (percentageRemaining <= 20 && hasEnoughUsers) {
          console.log('Reached 80% threshold, scheduling debounced fetch...');
          debouncedFetchMore();
        }
      }

    } catch (err) {
      console.error('Error handling pass:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, debouncedFetchMore, hasEnoughUsers]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.id && profile && !isProcessingRef.current && profiles.length === 0) {
      fetchAndRankProfiles(true); // Initial fetch, replace profiles
    }
  }, [user?.id, profile, fetchAndRankProfiles]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentProfile,
    loading,
    error,
    hasEnoughUsers,
    processingCount,
    handleLike,
    handlePass,
    refetch: () => fetchAndRankProfiles(true)
  };
};
