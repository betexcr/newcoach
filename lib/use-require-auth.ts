import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";

/**
 * Redirects to login when auth resolves to unauthenticated.
 * Returns `true` while auth is still initializing (caller should
 * render a loading indicator).
 */
export function useRequireAuth(): boolean {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  return !isInitialized;
}
