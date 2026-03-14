import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth-provider";
import { lightTheme, darkTheme } from "@/lib/theme";
import { useSettingsStore } from "@/stores/settings-store";
import "@/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themePref = useSettingsStore((s) => s.theme);
  const initSettings = useSettingsStore((s) => s.initSettings);

  useEffect(() => {
    initSettings();
  }, []);

  const resolvedScheme =
    themePref === "auto" ? colorScheme : themePref;
  const theme = resolvedScheme === "dark" ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(coach)" />
            <Stack.Screen name="(client)" />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
