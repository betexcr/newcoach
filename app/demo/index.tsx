import { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { useSettingsStore, type ThemePreference, type LanguagePreference } from "@/stores/settings-store";
import { useDemoSeenStore } from "./use-demo-fade";

const THEME_OPTIONS: { value: ThemePreference; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { value: "auto", icon: "theme-light-dark" },
  { value: "light", icon: "white-balance-sunny" },
  { value: "dark", icon: "moon-waning-crescent" },
];

const LANG_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

export default function DemoIndex() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { t } = useTranslation();
  const themePref = useSettingsStore((s) => s.theme);
  const langPref = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  useEffect(() => {
    useDemoSeenStore.getState().reset();
  }, []);

  const options = [
    {
      label: t("demo.coachView"),
      description: t("demo.coachDescription"),
      icon: "clipboard-pulse" as const,
      color: theme.colors.primary,
      route: "/demo/coach" as const,
    },
    {
      label: t("demo.clientView"),
      description: t("demo.clientDescription"),
      icon: "account-heart" as const,
      color: theme.colors.secondary,
      route: "/demo/client" as const,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="displaySmall"
          style={{ color: theme.colors.primary, fontWeight: "800" }}
        >
          {t("common.appName")}
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: "center" }}
        >
          {t("demo.explore")}
        </Text>
      </View>

      <View style={styles.cards}>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push({ pathname: opt.route } as any)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: `${opt.color}15` }]}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={36}
                color={opt.color}
              />
            </View>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}
            >
              {opt.label}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 6, lineHeight: 20 }}
            >
              {opt.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.toggleRow}>
        <View style={[styles.toggleGroup, { backgroundColor: theme.colors.surface }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = themePref === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                style={[styles.toggleBtn, active && { backgroundColor: theme.colors.primaryContainer }]}
                accessibilityRole="button"
                accessibilityLabel={opt.value}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={18}
                  color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.toggleGroup, { backgroundColor: theme.colors.surface }]}>
          {LANG_OPTIONS.map((opt) => {
            const active = langPref === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setLanguage(opt.value)}
                style={[styles.toggleBtn, active && { backgroundColor: theme.colors.primaryContainer }]}
                accessibilityRole="button"
                accessibilityLabel={opt.value}
              >
                <Text
                  variant="labelMedium"
                  style={{ color: active ? theme.colors.primary : theme.colors.onSurfaceVariant, fontWeight: active ? "700" : "500" }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={styles.loginLink}
        onPress={() => router.replace({ pathname: "/(auth)/login" } as any)}
        accessibilityRole="link"
      >
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {t("demo.haveAccount")}{" "}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.primary, fontWeight: "600" }}
        >
          {t("demo.signIn")}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  cards: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 28,
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});
