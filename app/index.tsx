import { useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuthStore, selectIsAuthenticated, selectNeedsRole } from "@/stores/auth-store";

const INIT_TIMEOUT_MS = 8000;

export default function Index() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const needsRole = useAuthStore(selectNeedsRole);
  const profileError = useAuthStore((s) => s.profileError);
  const role = useAuthStore((s) => s.profile?.role);

  const retryProfile = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    useAuthStore.getState().setProfileError(false);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        useAuthStore.getState().setProfileError(true);
      } else {
        useAuthStore.getState().setProfile(data);
      }
    } catch {
      useAuthStore.getState().setProfileError(true);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        console.warn("Auth init timed out — redirecting to login");
        useAuthStore.getState().setLoading(false);
        useAuthStore.getState().setInitialized(true);
      }
    }, INIT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (profileError) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    if (needsRole) {
      router.replace("/(auth)/select-role");
      return;
    }

    if (role === "coach") {
      router.replace("/(coach)/dashboard");
    } else {
      router.replace("/(client)/today");
    }
  }, [isInitialized, isAuthenticated, needsRole, role, profileError]);

  if (isInitialized && profileError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurface, marginBottom: 16, textAlign: "center" }}
        >
          {t("auth.profileLoadFailed")}
        </Text>
        <Button mode="contained" onPress={retryProfile}>
          {t("common.retry")}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
