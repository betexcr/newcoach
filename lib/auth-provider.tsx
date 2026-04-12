import React, { useEffect } from "react";
import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { queryClient } from "@/lib/query-client";
import { registerForPushNotifications } from "./notifications";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setProfileError, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
          registerForPushNotifications(session.user.id).catch(() => {});
        }
      } catch (err) {
        console.warn("Auth init failed:", err);
        setSession(null);
        setProfile(null);
        setProfileError(false);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
        if (_event === "SIGNED_IN") {
          registerForPushNotifications(session.user.id).catch(() => {});
        }
      } else {
        setProfile(null);
        setProfileError(false);
        queryClient.clear();
        useWorkoutBuilderStore.getState().reset();
        useChatNavStore.getState().clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.warn("Failed to fetch profile:", error.message);
      if (useAuthStore.getState().user?.id === userId) {
        setProfileError(true);
      }
      return;
    }
    if (useAuthStore.getState().user?.id !== userId) return;
    setProfile(data);
  }

  return <>{children}</>;
}
