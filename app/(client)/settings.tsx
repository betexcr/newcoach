import { View, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { Text, useTheme, Avatar, Divider, SegmentedButtons } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { ThemePreference, LanguagePreference } from "@/stores/settings-store";

export default function ClientSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const themePref = useSettingsStore((s) => s.theme);
  const languagePref = useSettingsStore((s) => s.language);
  const setThemePref = useSettingsStore((s) => s.setTheme);
  const setLanguagePref = useSettingsStore((s) => s.setLanguage);

  async function doLogout() {
    try {
      if (profile?.id) {
        await supabase.from("profiles").update({ push_token: null }).eq("id", profile.id);
      }
      await supabase.auth.signOut();
    } catch (err: unknown) {
      if (__DEV__) console.warn("Sign out failed:", err);
      Alert.alert(t("common.error"), t("common.errorGeneric"));
      return;
    }
    queryClient.clear();
    useWorkoutBuilderStore.getState().reset();
    useChatNavStore.getState().clear();
    reset();
    router.replace("/(auth)/login");
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm(t("settings.signOutConfirm"))) {
        doLogout();
      }
      return;
    }
    Alert.alert(t("settings.signOut"), t("settings.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.signOut"), style: "destructive", onPress: doLogout },
    ]);
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const menuItems = [
    { icon: "account-circle-outline", label: t("settings.editProfile"), route: "/(auth)/edit-profile" },
    { icon: "chart-line", label: t("settings.progressStats"), route: "/(client)/progress" },
    { icon: "trophy-outline", label: t("settings.milestones"), route: "/(client)/milestones" },
    { icon: "food-apple-outline", label: t("settings.nutritionTracker"), route: "/(client)/nutrition" },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {t("settings.title")}
        </Text>

        <Pressable
          style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push("/(auth)/edit-profile" as any)}
        >
          <Avatar.Text
            size={56}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
          <View style={styles.profileInfo}>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {profile?.full_name ?? t("settings.yourName")}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {profile?.email ?? t("settings.emailPlaceholder")}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.secondary, fontWeight: "700" }}>
                {t("settings.roleClient")}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>

        <View
          style={[styles.menuSection, { backgroundColor: theme.colors.surface }]}
        >
          {menuItems.map((item, index) => (
            <View key={item.label}>
              <Pressable
                style={styles.menuItem}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyLarge"
                  style={{
                    flex: 1,
                    color: theme.colors.onSurface,
                    marginLeft: 16,
                  }}
                >
                  {item.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
              {index < menuItems.length - 1 && (
                <Divider style={{ marginLeft: 56 }} />
              )}
            </View>
          ))}
        </View>

        <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, fontWeight: "700" }}
          >
            {t("settings.appearance")}
          </Text>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            {t("settings.theme")}
          </Text>
          <SegmentedButtons
            value={themePref}
            onValueChange={(v) => setThemePref(v as ThemePreference)}
            buttons={[
              { value: "auto", label: t("settings.themeAuto") },
              { value: "light", label: t("settings.themeLight") },
              { value: "dark", label: t("settings.themeDark") },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            {t("settings.language")}
          </Text>
          <SegmentedButtons
            value={languagePref}
            onValueChange={(v) => setLanguagePref(v as LanguagePreference)}
            buttons={[
              { value: "auto", label: t("settings.langAuto") },
              { value: "en", label: t("settings.langEnglish") },
              { value: "es", label: t("settings.langSpanish") },
            ]}
          />
        </View>

        <Pressable
          style={[styles.logoutButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={theme.colors.error}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.error, marginLeft: 16, fontWeight: "600" }}
          >
            {t("settings.signOut")}
          </Text>
        </Pressable>

        <Text
          variant="bodySmall"
          style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("common.version")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontWeight: "700",
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  menuSection: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  version: {
    textAlign: "center",
    marginTop: 24,
  },
});
