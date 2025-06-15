
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
  chatRoomId?: string;
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

      // Fetch matches from the new profiles_match table
      const { data: matchesData, error: matchesError } = await supabase
        .from('profiles_match')
        .select('user_a_id, user_b_id, match_score, compatibility_description, created_at')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'active');

      if (matchesError) throw matchesError;

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        return;
      }

      // Get the other user's ID from each match
      const matchedUserIds = matchesData.map(match => 
        match.user_a_id === user.id ? match.user_b_id : match.user_a_id
      );

      // Fetch profile data for matched users
      const { data: matchProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, date_of_birth, bio, profile_images')
        .in('id', matchedUserIds);

      if (profileError) throw profileError;

      // Fetch chat rooms for these matches
      const { data: chatRooms, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .select('id, user1_id, user2_id')
        .or(`and(user1_id.eq.${user.id},user2_id.in.(${matchedUserIds.join(',')})),and(user2_id.eq.${user.id},user1_id.in.(${matchedUserIds.join(',')}))`);

      if (chatRoomError) {
        console.error('Error fetching chat rooms:', chatRoomError);
      }

      // Transform the data to match our interface
      const transformedMatches: Match[] = matchProfiles?.map(profile => {
        // Find the corresponding match data
        const matchData = matchesData.find(match => 
          match.user_a_id === profile.id || match.user_b_id === profile.id
        );

        // Find the corresponding chat room
        const chatRoom = chatRooms?.find(room => 
          (room.user1_id === user.id && room.user2_id === profile.id) ||
          (room.user2_id === user.id && room.user1_id === profile.id)
        );

        return {
          id: profile.id,
          name: profile.name,
          age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 0,
          matchScore: matchData?.match_score || 85,
          bio: profile.bio || "No bio available",
          profileImages: profile.profile_images || [],
          lastMessage: "You matched! Start a conversation 💫",
          timeAgo: "New match",
          chatRoomId: chatRoom?.id
        };
      }) || [];

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
