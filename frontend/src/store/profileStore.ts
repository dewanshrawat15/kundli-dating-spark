import { create } from "zustand";
import * as profileApi from "@/api/profile";
import type { Profile } from "@/api/profile";

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<profileApi.OnboardingPayload>) => Promise<void>;
  completeOnboarding: (data: profileApi.OnboardingPayload) => Promise<void>;
  setProfile: (profile: Profile) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await profileApi.getProfile();
      set({ profile: data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await profileApi.updateProfile(data);
      set({ profile: updated });
    } finally {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async (data) => {
    set({ isLoading: true });
    try {
      const { data: profile } = await profileApi.completeOnboarding(data);
      set({ profile });
    } finally {
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),
}));
