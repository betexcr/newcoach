import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore, selectIsAuthenticated, selectNeedsRole } from "@/stores/auth-store";

const INIT_TIMEOUT_MS = 8000;

export default function Index() {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const needsRole = useAuthStore(selectNeedsRole);
  const role = useAuthStore((s) => s.profile?.role);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        console.warn("Auth init timed out — redirecting to login");
        useAuthStore.getState().setInitialized(true);
      }
    }, INIT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

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
  }, [isInitialized, isAuthenticated, needsRole, role]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
});
