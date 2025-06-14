
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

      // Map camelCase fields to snake_case for database
      const dbData: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Map the fields to database column names, ensuring no null values for required fields
      if (data.name !== undefined && data.name !== null) dbData.name = data.name;
      if (data.email !== undefined && data.email !== null) dbData.email = data.email;
      if (data.dateOfBirth !== undefined && data.dateOfBirth !== null) dbData.date_of_birth = data.dateOfBirth;
      if (data.timeOfBirth !== undefined && data.timeOfBirth !== null) dbData.time_of_birth = data.timeOfBirth;
      if (data.placeOfBirth !== undefined && data.placeOfBirth !== null) dbData.place_of_birth = data.placeOfBirth;
      if (data.latitude !== undefined) dbData.latitude = data.latitude;
      if (data.longitude !== undefined) dbData.longitude = data.longitude;
      if (data.currentLocationLat !== undefined) dbData.current_location_lat = data.currentLocationLat;
      if (data.currentLocationLng !== undefined) dbData.current_location_lng = data.currentLocationLng;
      if (data.sexualOrientation !== undefined && data.sexualOrientation !== null) dbData.sexual_orientation = data.sexualOrientation;
      if (data.datingPreference !== undefined && data.datingPreference !== null) dbData.dating_preference = data.datingPreference;
      if (data.bio !== undefined) dbData.bio = data.bio;
      if (data.profileImages !== undefined) dbData.profile_images = data.profileImages;
      if (data.isOnboardingComplete !== undefined) dbData.is_onboarding_complete = data.isOnboardingComplete;

      const { error } = await supabase
        .from('profiles')
        .upsert(dbData);

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

      // Map snake_case fields from database to camelCase for the app
      const mappedProfile: Profile = data ? {
        id: data.id,
        name: data.name,
        email: data.email,
        dateOfBirth: data.date_of_birth,
        timeOfBirth: data.time_of_birth,
        placeOfBirth: data.place_of_birth,
        latitude: data.latitude,
        longitude: data.longitude,
        currentLocationLat: data.current_location_lat,
        currentLocationLng: data.current_location_lng,
        sexualOrientation: data.sexual_orientation,
        datingPreference: data.dating_preference,
        bio: data.bio,
        profileImages: data.profile_images,
        isOnboardingComplete: data.is_onboarding_complete,
      } : { id: userId };

      set({ 
        profile: mappedProfile,
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
