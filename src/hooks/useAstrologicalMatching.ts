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
  // Temporarily disable hasEnoughUsers check - always true unless 0 profiles
  const hasEnoughUsers = profiles.length > 0;
  const [processingCount, setProcessingCount] = useState(0);
  
  // Critical: Single source of truth for preventing concurrent requests
  const activeRequestRef = useRef<Promise<any> | null>(null);
  const mountedRef = useRef(true);
  const lastFetchIdRef = useRef(0);

  const currentProfile = profiles[currentIndex] || null;

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRequestRef.current = null;
    };
  }, []);

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
    if (!user?.id || !mountedRef.current) {
      console.error('No user ID available or component unmounted');
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

      // If this is a 'liked' interaction, store compatibility data in matches table
      if (interactionType === 'liked' && currentProfile) {
        console.log('Storing compatibility data for liked interaction');
        
        // First check if a match record exists (created by the trigger)
        const { data: existingMatch, error: matchCheckError } = await supabase
          .from('matches')
          .select('id, match_score, compatibility_description')
          .eq('user_id', user.id)
          .eq('target_user_id', targetUserId)
          .single();

        if (matchCheckError && matchCheckError.code !== 'PGRST116') {
          console.error('Error checking for existing match:', matchCheckError);
          return true; // Still return true as the interaction was recorded
        }

        // If match exists and doesn't have compatibility data, update it
        if (existingMatch && (!existingMatch.match_score || !existingMatch.compatibility_description)) {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              match_score: currentProfile.compatibilityScore,
              compatibility_description: currentProfile.compatibilityDescription
            })
            .eq('id', existingMatch.id);

          if (updateError) {
            console.error('Error updating match with compatibility data:', updateError);
          } else {
            console.log('Successfully updated match with compatibility data');
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error recording interaction:', err);
      return false;
    }
  };

  const checkUserCount = async (): Promise<number> => {
    if (!user?.id || !profile || !mountedRef.current) {
      return 0;
    }

    try {
      console.log('🔍 Checking user count before fetching profiles');
      
      const { data: unseenProfiles, error } = await supabase.rpc(
        'get_unseen_profiles', 
        { 
          requesting_user_id: user.id,
          city_filter: profile.current_city,
          limit_count: 20
        }
      ) as { data: ProfileData[] | null, error: any };

      if (error) {
        console.error('Error checking user count:', error);
        return 0;
      }

      const userCount = unseenProfiles?.length || 0;
      console.log(`📊 Found ${userCount} unseen users`);
      
      return userCount;
    } catch (err) {
      console.error('Error in checkUserCount:', err);
      return 0;
    }
  };

  const fetchAndRankProfiles = useCallback(async (isRefetch = false): Promise<void> => {
    // CRITICAL: Only allow one active request at a time
    if (activeRequestRef.current) {
      console.log('⚠️ Request already in progress, skipping...');
      return activeRequestRef.current;
    }

    if (!user?.id || !profile || !mountedRef.current) {
      console.log('⚠️ Missing requirements for fetch');
      return;
    }

    // Check if user has complete birth data
    if (!profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth) {
      setError("Complete your astrological profile (birth date, time, and place) to see matches");
      return;
    }

    // Generate unique fetch ID for this request
    const fetchId = ++lastFetchIdRef.current;
    console.log(`🚀 Starting fetch #${fetchId} (isRefetch: ${isRefetch})`);

    setLoading(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        // First check if we have enough users
        const userCount = await checkUserCount();
        
        // Temporarily always proceed regardless of user count
        console.log(`📡 Fetching unseen profiles for fetch #${fetchId}`);
        
        // Fetch unseen profiles
        const { data: unseenProfiles, error: fetchError } = await supabase.rpc(
          'get_unseen_profiles', 
          { 
            requesting_user_id: user.id,
            city_filter: profile.current_city,
            limit_count: 10
          }
        ) as { data: ProfileData[] | null, error: any };

        // Check if this request is still the current one
        if (fetchId !== lastFetchIdRef.current || !mountedRef.current) {
          console.log(`⚠️ Fetch #${fetchId} cancelled (newer request or unmounted)`);
          return;
        }

        if (fetchError) {
          console.error(`❌ Error in fetch #${fetchId}:`, fetchError);
          throw fetchError;
        }

        console.log(`✅ Fetch #${fetchId} got ${unseenProfiles?.length || 0} profiles`);

        if (!unseenProfiles || unseenProfiles.length === 0) {
          console.log(`📭 No unseen profiles found in fetch #${fetchId}`);
          if (isRefetch && mountedRef.current) {
            setProfiles([]);
          }
          return;
        }

        console.log(`🧮 Processing ${unseenProfiles.length} profiles for compatibility in fetch #${fetchId}`);
        setProcessingCount(unseenProfiles.length);

        // Validate current user profile
        try {
          validateProfileData(profile, 'Current user profile');
        } catch (validationError) {
          console.error(`❌ Profile validation failed in fetch #${fetchId}:`, validationError);
          if (mountedRef.current) {
            setError(`Profile validation error: ${validationError.message}`);
          }
          return;
        }

        // Filter profiles with complete birth data
        const validProfiles = unseenProfiles.filter(unseenProfile => {
          if (!unseenProfile.date_of_birth || !unseenProfile.time_of_birth || !unseenProfile.place_of_birth) {
            console.log(`⚠️ Skipping profile ${unseenProfile.name} in fetch #${fetchId} - incomplete birth data`);
            return false;
          }

          try {
            validateProfileData(unseenProfile, `Target profile ${unseenProfile.name}`);
            return true;
          } catch (validationError) {
            console.error(`❌ Validation failed for ${unseenProfile.name} in fetch #${fetchId}:`, validationError);
            return false;
          }
        });

        if (validProfiles.length === 0) {
          console.log(`📭 No valid profiles with complete birth data in fetch #${fetchId}`);
          if (isRefetch && mountedRef.current) {
            setProfiles([]);
          }
          setProcessingCount(0);
          return;
        }

        // Check again if this is still the current request
        if (fetchId !== lastFetchIdRef.current || !mountedRef.current) {
          console.log(`⚠️ Fetch #${fetchId} cancelled before compatibility call`);
          return;
        }

        // Call astrological compatibility for all profiles regardless of count
        console.log(`🔮 Calling astrological compatibility for ${validProfiles.length} profiles`);

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

        console.log(`🔮 Making compatibility request for fetch #${fetchId} with ${validProfiles.length} profiles`);

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

        // Final check if this is still the current request
        if (fetchId !== lastFetchIdRef.current || !mountedRef.current) {
          console.log(`⚠️ Fetch #${fetchId} cancelled after compatibility call`);
          return;
        }

        if (compatibilityError) {
          console.error(`❌ Compatibility error in fetch #${fetchId}:`, compatibilityError);
          throw compatibilityError;
        }

        const batchResult = batchCompatibilityData as BatchCompatibilityResponse;
        console.log(`✅ Compatibility results for fetch #${fetchId}:`, batchResult);

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
        
        console.log(`📊 Ranked ${rankedProfiles.length} profiles for fetch #${fetchId}`);
        
        if (mountedRef.current) {
          if (isRefetch) {
            // Replace existing profiles with new ones
            setProfiles(rankedProfiles);
            setCurrentIndex(0);
          } else {
            // Append to existing profiles
            setProfiles(prev => [...prev, ...rankedProfiles]);
          }
        }
        
        setProcessingCount(0);

      } catch (err) {
        console.error(`❌ Error in fetch #${fetchId}:`, err);
        if (mountedRef.current) {
          setError("Failed to load profiles. Please try again.");
        }
        setProcessingCount(0);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        // Clear the active request reference
        if (activeRequestRef.current === fetchPromise) {
          activeRequestRef.current = null;
        }
      }
    })();

    // Store the promise to prevent concurrent requests
    activeRequestRef.current = fetchPromise;
    
    return fetchPromise;
  }, [user?.id, profile]);

  const handleLike = useCallback(async () => {
    if (!user?.id || !currentProfile || !mountedRef.current) return;

    try {
      console.log('👍 Handling like for profile:', currentProfile.id);
      
      // Record the interaction
      const success = await recordInteraction(currentProfile.id, 'liked');
      
      if (!success) {
        console.error('❌ Failed to record like interaction');
        return;
      }

      if (!mountedRef.current) return;

      // Move to next profile
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Only fetch more when we're very close to the end (3 profiles left)
      const remainingProfiles = profiles.length - nextIndex;
      
      if (remainingProfiles <= 3 && hasEnoughUsers && !activeRequestRef.current) {
        console.log(`🔄 Only ${remainingProfiles} profiles left, fetching more...`);
        fetchAndRankProfiles(false);
      }

    } catch (err) {
      console.error('❌ Error handling like:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, fetchAndRankProfiles, hasEnoughUsers]);

  const handlePass = useCallback(async () => {
    if (!user?.id || !currentProfile || !mountedRef.current) return;

    try {
      console.log('👎 Handling pass for profile:', currentProfile.id);
      
      // Record the interaction
      const success = await recordInteraction(currentProfile.id, 'passed');
      
      if (!success) {
        console.error('❌ Failed to record pass interaction');
        return;
      }

      if (!mountedRef.current) return;

      // Move to next profile
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Only fetch more when we're very close to the end (3 profiles left)
      const remainingProfiles = profiles.length - nextIndex;
      
      if (remainingProfiles <= 3 && hasEnoughUsers && !activeRequestRef.current) {
        console.log(`🔄 Only ${remainingProfiles} profiles left, fetching more...`);
        fetchAndRankProfiles(false);
      }

    } catch (err) {
      console.error('❌ Error handling pass:', err);
    }
  }, [user?.id, currentProfile, profiles.length, currentIndex, fetchAndRankProfiles, hasEnoughUsers]);

  // Initial fetch when component mounts - ONLY ONCE
  useEffect(() => {
    if (user?.id && profile && mountedRef.current && profiles.length === 0 && !activeRequestRef.current) {
      console.log('🎯 Initial fetch triggered');
      fetchAndRankProfiles(true);
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
    refetch: () => {
      if (!activeRequestRef.current && mountedRef.current) {
        console.log('🔄 Manual refetch triggered');
        fetchAndRankProfiles(true);
      } else {
        console.log('⚠️ Refetch skipped - request already in progress');
      }
    }
  };
};
