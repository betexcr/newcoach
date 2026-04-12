import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, Avatar, SegmentedButtons } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { useSettingsStore, type ThemePreference, type LanguagePreference } from "@/stores/settings-store";
import { coachProfile } from "../mock-data";

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function DemoSettings() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const themePref = useSettingsStore((s) => s.theme);
  const langPref = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introSettings")}
          </Text>
        </Card.Content>
      </Card>

      <View style={[s.profileCard, { backgroundColor: theme.colors.surface }]}>
        <Avatar.Text size={56} label={initials(coachProfile.full_name)} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{ color: theme.colors.primary }} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{coachProfile.full_name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{coachProfile.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "700" }}>{t("settings.roleCoach")}</Text>
          </View>
        </View>
      </View>

      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 10 }}>
        {t("settings.appearance")}
      </Text>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{t("settings.theme")}</Text>
      <SegmentedButtons
        value={themePref}
        onValueChange={(v) => setTheme(v as ThemePreference)}
        buttons={[
          { value: "auto", label: t("settings.themeAuto") },
          { value: "light", label: t("settings.themeLight") },
          { value: "dark", label: t("settings.themeDark") },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{t("settings.language")}</Text>
      <SegmentedButtons
        value={langPref}
        onValueChange={(v) => setLanguage(v as LanguagePreference)}
        buttons={[
          { value: "auto", label: t("settings.langAuto") },
          { value: "en", label: t("settings.langEnglish") },
          { value: "es", label: t("settings.langSpanish") },
        ]}
        style={{ marginBottom: 16 }}
      />

      <View style={[s.signOutRow, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons name="logout" size={22} color={theme.custom.error} />
        <Text variant="bodyLarge" style={{ color: theme.custom.error, marginLeft: 12 }}>{t("settings.signOut")}</Text>
      </View>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>
        {t("common.version")}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  signOutRow: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginTop: 8 },
});
