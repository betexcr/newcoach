import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    }),
}));

export const selectRole = (state: AuthState): UserRole | null =>
  state.profile?.role ?? null;

export const selectIsAuthenticated = (state: AuthState): boolean =>
  !!state.session;

export const selectNeedsRole = (state: AuthState): boolean =>
  !!state.session && !state.profile?.role;
