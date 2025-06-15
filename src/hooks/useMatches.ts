
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

interface Match {
  id: string;
  name: string;
  age: number;
  matchScore: number;
  bio: string;
  lastMessage?: string;
  timeAgo?: string;
  profileImages?: string[];
}

export const useMatches = () => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch users that the current user has liked
      const { data: likedInteractions, error: likedError } = await supabase
        .from('profile_interactions')
        .select('target_user_id')
        .eq('user_id', user.id)
        .eq('interaction_type', 'liked');

      if (likedError) throw likedError;

      if (!likedInteractions || likedInteractions.length === 0) {
        setMatches([]);
        return;
      }

      const likedUserIds = likedInteractions.map(interaction => interaction.target_user_id);

      // Fetch users who have also liked the current user back (mutual likes)
      const { data: mutualLikes, error: mutualError } = await supabase
        .from('profile_interactions')
        .select('user_id')
        .in('user_id', likedUserIds)
        .eq('target_user_id', user.id)
        .eq('interaction_type', 'liked');

      if (mutualError) throw mutualError;

      const mutualLikeUserIds = mutualLikes?.map(like => like.user_id) || [];

      if (mutualLikeUserIds.length === 0) {
        setMatches([]);
        return;
      }

      // Fetch profile data for mutual matches
      const { data: matchProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, date_of_birth, bio, profile_images')
        .in('id', mutualLikeUserIds);

      if (profileError) throw profileError;

      // Transform the data to match our interface
      const transformedMatches: Match[] = matchProfiles?.map(profile => ({
        id: profile.id,
        name: profile.name,
        age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 0,
        matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100 for now
        bio: profile.bio || "No bio available",
        profileImages: profile.profile_images || [],
        lastMessage: "You matched! Start a conversation 💫",
        timeAgo: "New match"
      })) || [];

      setMatches(transformedMatches);

    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user?.id]);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches
  };
};
