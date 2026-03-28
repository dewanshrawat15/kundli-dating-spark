import { create } from "zustand";
import * as authApi from "@/api/auth";

interface AuthUser {
  id: string;
  email: string;
  is_onboarding_complete: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setOnboardingComplete: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  isInitialized: false,

  signUp: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register(email, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch { /* ignore */ }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    if (get().isInitialized) return;
    if (!localStorage.getItem("access_token")) {
      set({ isInitialized: true });
      return;
    }
    try {
      const { data } = await authApi.getMe();
      set({ user: data, isAuthenticated: true, isInitialized: true });
    } catch {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  setOnboardingComplete: () => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, is_onboarding_complete: true } });
    }
  },
}));
