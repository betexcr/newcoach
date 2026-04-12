import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, Avatar, SegmentedButtons, ProgressBar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { useSettingsStore, type ThemePreference, type LanguagePreference } from "@/stores/settings-store";
import { clientProfile, demoProgressStats, demoMilestones, demoNutritionLogs, demoMacroGoals } from "../mock-data";

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function ComplianceRing({ label, value, theme }: { label: string; value: number; theme: AppTheme }) {
  return (
    <View style={s.ringContainer}>
      <View style={[s.ringOuter, { borderColor: theme.colors.surfaceVariant }]}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{value}%</Text>
      </View>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>{label}</Text>
    </View>
  );
}

export default function DemoClientSettings() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const themePref = useSettingsStore((s) => s.theme);
  const langPref = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const earnedMilestones = demoMilestones.filter((m) => m.earned);
  const totals = demoNutritionLogs.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
          <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introClientSettings")}
          </Text>
        </Card.Content>
      </Card>

      <View style={[s.profileCard, { backgroundColor: theme.colors.surface }]}>
        <Avatar.Text size={56} label={initials(clientProfile.full_name)} style={{ backgroundColor: theme.colors.secondaryContainer }} labelStyle={{ color: theme.colors.secondary }} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{clientProfile.full_name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{clientProfile.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.secondary, fontWeight: "700" }}>{t("settings.roleClient")}</Text>
          </View>
        </View>
      </View>

      {/* Progress preview */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.progressSection")}
      </Text>
      <View style={s.statsRow}>
        {[
          { label: t("demo.streak"), value: `${demoProgressStats.streak}`, icon: "fire" },
          { label: t("demo.completed"), value: `${demoProgressStats.completedCount}`, icon: "check-circle" },
          { label: t("demo.total"), value: `${demoProgressStats.totalAssigned}`, icon: "clipboard-list" },
        ].map((st) => (
          <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.statContent}>
              <MaterialCommunityIcons name={st.icon as any} size={22} color={theme.colors.secondary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>{st.value}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{st.label}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={[s.complianceCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 16 }}>{t("demo.complianceTitle")}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <ComplianceRing label={t("demo.days7")} value={demoProgressStats.compliance7} theme={theme} />
            <ComplianceRing label={t("demo.days30")} value={demoProgressStats.compliance30} theme={theme} />
            <ComplianceRing label={t("demo.days90")} value={demoProgressStats.compliance90} theme={theme} />
          </View>
        </Card.Content>
      </Card>

      {/* Milestones preview */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.milestonesSection")}
      </Text>
      <View style={s.badgeGrid}>
        {demoMilestones.map((m) => (
          <View key={m.id} style={[s.badge, { backgroundColor: theme.colors.surface, opacity: m.earned ? 1 : 0.5 }]}>
            <View style={[s.badgeIcon, { backgroundColor: m.earned ? `${theme.colors.secondary}15` : theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name={m.icon as any} size={28} color={m.earned ? theme.colors.secondary : theme.colors.onSurfaceVariant} />
            </View>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: "600", marginTop: 8, textAlign: "center" }} numberOfLines={1}>{m.title}</Text>
            {m.earned && (
              <View style={[s.earnedBadge, { backgroundColor: theme.colors.secondary }]}>
                <MaterialCommunityIcons name="check" size={10} color={theme.colors.onSecondary} />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Nutrition preview */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.nutritionSection")}
      </Text>
      <Card style={[s.nutritionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("demo.todaySummary")}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{totals.calories} / {demoMacroGoals.calories} kcal</Text>
          </View>
          <ProgressBar progress={Math.min(totals.calories / demoMacroGoals.calories, 1)} color={theme.colors.primary} style={{ height: 8, borderRadius: 4, marginBottom: 16 }} />
          {[
            { label: t("demo.protein"), current: totals.protein, goal: demoMacroGoals.protein, color: theme.custom.info },
            { label: t("demo.carbs"), current: totals.carbs, goal: demoMacroGoals.carbs, color: theme.custom.warning },
            { label: t("demo.fat"), current: totals.fat, goal: demoMacroGoals.fat, color: theme.custom.error },
          ].map((macro) => (
            <View key={macro.label} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{macro.label}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{macro.current}g / {macro.goal}g</Text>
              </View>
              <ProgressBar progress={Math.min(macro.current / macro.goal, 1)} color={macro.color} style={{ height: 6, borderRadius: 3 }} />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Theme / Language */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 24, marginBottom: 10 }}>
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

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>{t("common.version")}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  complianceCard: { borderRadius: 16, elevation: 0 },
  ringContainer: { alignItems: "center" },
  ringOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, justifyContent: "center", alignItems: "center" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", borderRadius: 16, padding: 14, alignItems: "center", position: "relative" },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  earnedBadge: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  nutritionCard: { borderRadius: 16, elevation: 0 },
});
