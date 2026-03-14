import React, { useEffect } from "react";
import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/auth-store";
import { registerForPushNotifications } from "./notifications";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    async function init() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id);
        registerForPushNotifications(session.user.id).catch(() => {});
      }

      setLoading(false);
      setInitialized(true);
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  }

  return <>{children}</>;
}
