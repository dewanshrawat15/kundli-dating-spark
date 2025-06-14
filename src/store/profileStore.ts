
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id?: string;
  name?: string;
  email?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  latitude?: number;
  longitude?: number;
  currentLocationLat?: number;
  currentLocationLng?: number;
  sexualOrientation?: string;
  datingPreference?: string;
  bio?: string;
  profileImages?: string[];
  isOnboardingComplete?: boolean;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  updateProfile: async (data: Partial<Profile>) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      set(state => ({
        profile: { ...state.profile, ...data },
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ 
        profile: data || { id: userId },
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  completeOnboarding: async () => {
    const { profile } = get();
    if (!profile?.id) throw new Error('No profile found');

    await get().updateProfile({ isOnboardingComplete: true });
  },
}));
