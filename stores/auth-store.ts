import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setProfileError: (error: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  profileError: false,
  isLoading: true,
  isInitialized: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile, profileError: false }),

  setProfileError: (profileError) => set({ profileError }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      profileError: false,
      isLoading: false,
      isInitialized: true,
    }),
}));

export const selectRole = (state: AuthState): UserRole | null =>
  state.profile?.role ?? null;

export const selectIsAuthenticated = (state: AuthState): boolean =>
  !!state.session;

export const selectNeedsRole = (state: AuthState): boolean =>
  !!state.session && !state.profile?.role && !state.profileError;
