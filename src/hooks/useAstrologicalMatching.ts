import { useState, useEffect, useCallback } from 'react';
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

  const currentProfile = profiles[currentIndex] || null;

  const fetchAndRankProfiles = useCallback(async () => {
    if (!user?.id || !profile) return;

    // Check if user has complete birth data
    if (!profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth) {
      setError("Complete your astrological profile (birth date, time, and place) to see matches");
      return;
    }

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
      );

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

      // Calculate compatibility for each profile
      const rankedProfiles: RankedProfile[] = [];
      
      for (const unseenProfile of unseenProfiles) {
        try {
          // Check if the profile has complete birth data
          if (!unseenProfile.date_of_birth || !unseenProfile.time_of_birth || !unseenProfile.place_of_birth) {
            console.log(`Skipping profile ${unseenProfile.name} - incomplete birth data`);
            continue;
          }

          console.log(`Calculating compatibility for ${unseenProfile.name}...`);
          
          const { data: compatibilityData, error: compatibilityError } = await supabase.functions.invoke(
            'astrological-compatibility',
            {
              body: {
                user1: {
                  name: profile.name,
                  dateOfBirth: profile.dateOfBirth,
                  timeOfBirth: profile.timeOfBirth,
                  placeOfBirth: profile.placeOfBirth
                },
                user2: {
                  name: unseenProfile.name,
                  dateOfBirth: unseenProfile.date_of_birth,
                  timeOfBirth: unseenProfile.time_of_birth,
                  placeOfBirth: unseenProfile.place_of_birth
                }
              }
            }
          );

          if (compatibilityError) {
            console.error(`Compatibility error for ${unseenProfile.name}:`, compatibilityError);
            // Add with default score if API fails
            rankedProfiles.push({
              ...unseenProfile,
              currentCity: unseenProfile.current_city,
              sexualOrientation: unseenProfile.sexual_orientation,
              datingPreference: unseenProfile.dating_preference,
              compatibilityScore: 50,
              compatibilityDescription: "Unable to calculate astrological compatibility at the moment."
            });
            continue;
          }

          const compatibility: CompatibilityResponse = compatibilityData;
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
    if (user?.id && profile) {
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
