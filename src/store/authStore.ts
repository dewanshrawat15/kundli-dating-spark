
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },

      signUp: async (email: string, password: string) => {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) throw error;
      },

      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, isAuthenticated: false });
      },

      initialize: async () => {
        if (get().isInitialized) {
          return;
        }

        try {
          // Set up auth state listener first
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            set({ 
              user: session?.user || null, 
              isAuthenticated: !!session?.user,
              isLoading: false,
              isInitialized: true
            });
          });

          // Then check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          set({ 
            user: session?.user || null, 
            isAuthenticated: !!session?.user,
            isLoading: false,
            isInitialized: true
          });

        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            isLoading: false, 
            isInitialized: true 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
