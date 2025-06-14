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
      
      // Fetch unseen profiles - cast the result to our expected type
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

      console.log(`Found ${unseenProfiles.length} profiles, calculating compatibility...`);
      setProcessingCount(unseenProfiles.length);

      // Validate current user profile before processing
      try {
        validateProfileData(profile, 'Current user profile');
      } catch (validationError) {
        console.error('Current user profile validation failed:', validationError);
        setError(`Profile validation error: ${validationError.message}`);
        return;
      }

      // Calculate compatibility for each profile
      const rankedProfiles: RankedProfile[] = [];
      
      for (const unseenProfile of unseenProfiles) {
        try {
          // Check if the profile has complete birth data
          if (!unseenProfile.date_of_birth || !unseenProfile.time_of_birth || !unseenProfile.place_of_birth) {
            console.log(`Skipping profile ${unseenProfile.name} - incomplete birth data`);
            continue;
          }

          // Validate target profile data
          try {
            validateProfileData(unseenProfile, `Target profile ${unseenProfile.name}`);
          } catch (validationError) {
            console.error(`Validation failed for ${unseenProfile.name}:`, validationError);
            continue;
          }

          // Create cache key to avoid duplicate API calls
          const cacheKey = `${user.id}-${unseenProfile.id}`;
          let compatibility: CompatibilityResponse;

          if (compatibilityCache.current.has(cacheKey)) {
            console.log(`Using cached compatibility for ${unseenProfile.name}`);
            compatibility = compatibilityCache.current.get(cacheKey)!;
          } else {
            console.log(`Calculating compatibility for ${unseenProfile.name}...`);
            
            const requestPayload = {
              userProfile: {
                name: profile.name,
                dateOfBirth: profile.dateOfBirth,
                timeOfBirth: profile.timeOfBirth,
                placeOfBirth: profile.placeOfBirth
              },
              targetProfile: {
                name: unseenProfile.name,
                dateOfBirth: unseenProfile.date_of_birth,
                timeOfBirth: unseenProfile.time_of_birth,
                placeOfBirth: unseenProfile.place_of_birth
              }
            };

            console.log(`API payload for ${unseenProfile.name}:`, JSON.stringify(requestPayload, null, 2));

            const { data: compatibilityData, error: compatibilityError } = await supabase.functions.invoke(
              'astrological-compatibility',
              {
                body: requestPayload
              }
            );

            if (compatibilityError) {
              console.error(`Compatibility error for ${unseenProfile.name}:`, compatibilityError);
              // Add with default score if API fails
              compatibility = {
                score: 50,
                description: "Unable to calculate astrological compatibility at the moment."
              };
            } else {
              compatibility = compatibilityData as CompatibilityResponse;
              // Cache the result
              compatibilityCache.current.set(cacheKey, compatibility);
            }
          }

          rankedProfiles.push({
            ...unseenProfile,
            currentCity: unseenProfile.current_city,
            sexualOrientation: unseenProfile.sexual_orientation,
            datingPreference: unseenProfile.dating_preference,
            compatibilityScore: compatibility.score,
            compatibilityDescription: compatibility.description
          });

        } catch (profileError) {
          console.error(`Error processing profile ${unseenProfile.name}:`, profileError);
          // Add with default score if processing fails
          rankedProfiles.push({
            ...unseenProfile,
            currentCity: unseenProfile.current_city,
            sexualOrientation: unseenProfile.sexual_orientation,
            datingPreference: unseenProfile.dating_preference,
            compatibilityScore: 50,
            compatibilityDescription: "Unable to calculate astrological compatibility at the moment."
          });
        }
      }

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
