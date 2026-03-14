import { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, useTheme, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types/database";

const MOCK_COACH_PROFILE: Profile = {
  id: "test-coach-uuid-xxxx",
  email: "coach@demo.test",
  full_name: "Demo Coach",
  avatar_url: null,
  role: "coach",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_CLIENT_PROFILE: Profile = {
  id: "test-client-uuid-xxxx",
  email: "client@demo.test",
  full_name: "Demo Client",
  avatar_url: null,
  role: "client",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const routes = {
  auth: [
    { path: "/(auth)/login", label: "Login Screen" },
    { path: "/(auth)/signup", label: "Sign Up Screen" },
    { path: "/(auth)/forgot-password", label: "Forgot Password" },
    { path: "/(auth)/select-role", label: "Role Selection" },
    { path: "/(auth)/edit-profile", label: "Edit Profile" },
  ],
  coach: [
    { path: "/(coach)/dashboard", label: "Coach Dashboard" },
    { path: "/(coach)/clients", label: "Clients List" },
    { path: "/(coach)/clients/add-client", label: "Add Client" },
    { path: "/(coach)/library", label: "Exercise Library" },
    { path: "/(coach)/library/create-exercise", label: "Create Exercise" },
    { path: "/(coach)/library/workout-builder", label: "Workout Builder" },
    { path: "/(coach)/messages", label: "Coach Messages" },
    { path: "/(coach)/settings", label: "Coach Settings" },
  ],
  client: [
    { path: "/(client)/today", label: "Today Screen" },
    { path: "/(client)/calendar", label: "Calendar" },
    { path: "/(client)/progress", label: "Progress" },
    { path: "/(client)/nutrition", label: "Nutrition" },
    { path: "/(client)/habits", label: "Habits" },
    { path: "/(client)/milestones", label: "Milestones" },
    { path: "/(client)/messages", label: "Client Messages" },
    { path: "/(client)/settings", label: "Client Settings" },
  ],
};

export default function TestHarness() {
  const theme = useTheme();
  const router = useRouter();
  const { setProfile, setSession } = useAuthStore();

  function injectCoach() {
    setSession({ user: { id: MOCK_COACH_PROFILE.id } } as any);
    setProfile(MOCK_COACH_PROFILE);
  }

  function injectClient() {
    setSession({ user: { id: MOCK_CLIENT_PROFILE.id } } as any);
    setProfile(MOCK_CLIENT_PROFILE);
  }

  function navigateTo(path: string) {
    router.push(path as any);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.primary, fontWeight: "800", textAlign: "center" }}
        >
          NewCoach Test Harness
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 4 }}
        >
          Navigate to any screen to verify rendering
        </Text>

        <View style={styles.roleButtons}>
          <Button
            mode="contained"
            onPress={injectCoach}
            style={{ flex: 1 }}
            testID="set-coach-role"
          >
            Set Coach
          </Button>
          <Button
            mode="contained"
            onPress={injectClient}
            style={{ flex: 1 }}
            buttonColor={theme.colors.secondary}
            testID="set-client-role"
          >
            Set Client
          </Button>
        </View>

        {Object.entries(routes).map(([section, items]) => (
          <View key={section} style={styles.section}>
            <Text
              variant="titleLarge"
              style={{
                color: theme.colors.onSurface,
                fontWeight: "700",
                textTransform: "capitalize",
                marginBottom: 8,
              }}
            >
              {section} Screens
            </Text>
            {items.map((route) => (
              <Pressable
                key={route.path}
                style={[
                  styles.routeCard,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => navigateTo(route.path)}
                testID={`nav-${route.path.replace(/[/()]/g, "-")}`}
              >
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                >
                  {route.label}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, fontFamily: "monospace" }}
                >
                  {route.path}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  routeCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
});
