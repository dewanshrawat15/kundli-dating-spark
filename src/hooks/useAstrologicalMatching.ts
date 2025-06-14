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

  const fetchAndRankProfiles = useCallback(async () => {
    if (!user?.id || !profile || isProcessingRef.current) {
      console.log('Skipping fetch - missing requirements or already processing');
      return;
    }

    // Check if user has complete birth data
    if (!profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth) {
      setError("Complete your astrological profile (birth date, time, and place) to see matches");
      return;
    }

    console.log('Starting fetchAndRankProfiles for user:', user.id);
    isProcessingRef.current = true;
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

      if (!unseenProfiles || unseenProfiles.length === 0) {
        console.log('No unseen profiles found');
        setHasEnoughUsers(false);
        setProfiles([]);
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
        setProfiles([]);
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
      const rankedProfiles: RankedProfile[] = validProfiles.map((unseenProfile, index) => {
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
      setProfiles(rankedProfiles);
      setCurrentIndex(0);
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
      // Record the interaction
      const { error } = await supabase
        .from('profile_interactions')
        .insert({
          user_id: user.id,
          target_user_id: currentProfile.id,
          interaction_type: 'like'
        });

      if (error) {
        console.error('Error recording like:', error);
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Check if we need to fetch more profiles (70% threshold)
      const remainingProfiles = profiles.length - (currentIndex + 1);
      const totalProfiles = profiles.length;
      const percentageRemaining = (remainingProfiles / totalProfiles) * 100;

      if (percentageRemaining <= 30 && totalProfiles >= 10) {
        console.log('Reached 70% threshold, fetching more profiles...');
        fetchAndRankProfiles();
      }

    } catch (err) {
      console.error('Error handling like:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, fetchAndRankProfiles]);

  const handlePass = useCallback(async () => {
    if (!user?.id || !currentProfile) return;

    try {
      // Record the interaction
      const { error } = await supabase
        .from('profile_interactions')
        .insert({
          user_id: user.id,
          target_user_id: currentProfile.id,
          interaction_type: 'pass'
        });

      if (error) {
        console.error('Error recording pass:', error);
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Check if we need to fetch more profiles (70% threshold)
      const remainingProfiles = profiles.length - (currentIndex + 1);
      const totalProfiles = profiles.length;
      const percentageRemaining = (remainingProfiles / totalProfiles) * 100;

      if (percentageRemaining <= 30 && totalProfiles >= 10) {
        console.log('Reached 70% threshold, fetching more profiles...');
        fetchAndRankProfiles();
      }

    } catch (err) {
      console.error('Error handling pass:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, fetchAndRankProfiles]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.id && profile && !isProcessingRef.current) {
      fetchAndRankProfiles();
    }
  }, [user?.id, profile, fetchAndRankProfiles]);

  return {
    currentProfile,
    loading,
    error,
    hasEnoughUsers,
    processingCount,
    handleLike,
    handlePass,
    refetch: fetchAndRankProfiles
  };
};
