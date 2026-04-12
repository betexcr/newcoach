import { useEffect, useState } from "react";
import { useColorScheme, Platform, AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { Stack, useRouter } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/lib/auth-provider";
import { lightTheme, darkTheme } from "@/lib/theme";
import { useSettingsStore } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";


SplashScreen.preventAutoHideAsync();


function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const themePref = useSettingsStore((s) => s.theme);
  const initSettings = useSettingsStore((s) => s.initSettings);
  const [ready, setReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    initSettings();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.setBadgeCountAsync(0);

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const role = useAuthStore.getState().profile?.role;
      const prefix = role === "coach" ? "/(coach)" : "/(client)";

      if (data?.screen === "chat" && data?.conversationId) {
        useChatNavStore.getState().set(data.conversationId as string, (data.name as string) ?? "");
        router.push({
          pathname: `${prefix}/messages/chat`,
          params: { conversationId: data.conversationId as string, name: (data.name as string) ?? "" },
        } as any);
      } else if (data?.screen === "workout" && data?.workoutId) {
        if (role === "coach") {
          router.push({
            pathname: "/(coach)/clients/workout-detail",
            params: { workoutId: data.workoutId as string },
          } as any);
        } else {
          router.push(`/workout/${data.workoutId}` as any);
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setReady(true);
      return;
    }
    if (Platform.OS === "web") {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
        setReady(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError]);

  if (!ready) return null;

  const resolvedScheme =
    themePref === "auto" ? colorScheme : themePref;
  const theme = resolvedScheme === "dark" ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <ErrorBoundary>
          <AuthProvider>
            <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(coach)" />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="demo" />
              <Stack.Screen name="workout/[id]" />
            </Stack>
          </AuthProvider>
        </ErrorBoundary>
      </PaperProvider>
    </QueryClientProvider>
  );
}
