import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Animated, Modal } from "react-native";
import { Text, useTheme, Card, Avatar, SegmentedButtons, ProgressBar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import { useSettingsStore, type ThemePreference, type LanguagePreference } from "@/stores/settings-store";
import { clientProfile, demoProgressStats, demoMilestones, demoNutritionLogs, demoMacroGoals, demoBodyMetrics, demoMeasurements, demoProgressPhotos, type DemoMilestone } from "../mock-data";

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
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro } = useDemoFadeIn("client-settings");
  const themePref = useSettingsStore((s) => s.theme);
  const langPref = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const [selectedMilestone, setSelectedMilestone] = useState<DemoMilestone | null>(null);
  const openMilestone = useCallback((m: DemoMilestone) => setSelectedMilestone(m), []);
  const closeMilestone = useCallback(() => setSelectedMilestone(null), []);

  const earnedMilestones = demoMilestones.filter((m) => m.earned);
  const totals = demoNutritionLogs.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const weightMin = Math.min(...demoBodyMetrics.map((p) => p.weight));
  const weightMax = Math.max(...demoBodyMetrics.map((p) => p.weight));
  const weightRange = weightMax - weightMin || 1;

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
        <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained" onPress={dismissIntro}>
          <Card.Content style={s.introContent}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
            <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
              {t("demo.introClientSettings")}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity }}>
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

      {/* Documents link */}
      <Pressable
        onPress={() => router.push({ pathname: "/demo/client-documents" } as any)}
        style={[s.docsLink, { backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.secondary} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1, marginLeft: 16, fontWeight: "600" }}>
          {t("library.documents")}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </Pressable>

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
          <Pressable key={m.id} onPress={() => openMilestone(m)} style={({ pressed }) => [s.badge, { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : m.earned ? 1 : 0.5 }]}>
            <View style={[s.badgeIcon, { backgroundColor: m.earned ? `${theme.colors.secondary}15` : theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name={m.icon as any} size={28} color={m.earned ? theme.colors.secondary : theme.colors.onSurfaceVariant} />
            </View>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: "600", marginTop: 8, textAlign: "center" }} numberOfLines={1}>{m.title}</Text>
            {m.earned && (
              <View style={[s.earnedBadge, { backgroundColor: theme.colors.secondary }]}>
                <MaterialCommunityIcons name="check" size={10} color={theme.colors.onSecondary} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Progress Photos */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.progressPhotosSection")}
      </Text>
      <Card style={[s.photosCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          {[demoProgressPhotos.slice(0, 3), demoProgressPhotos.slice(3, 6)].map((row, rowIdx) => (
            <View key={rowIdx}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, marginTop: rowIdx > 0 ? 14 : 0 }}>
                {rowIdx === 0 ? t("demo.twoWeeksAgo") : t("demo.weekAgo")}
              </Text>
              <View style={s.photoRow}>
                {row.map((photo) => (
                  <View key={photo.id} style={[s.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <MaterialCommunityIcons name="account-outline" size={32} color={theme.colors.onSurfaceVariant} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      {t(`demo.${photo.pose}Pose`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <DemoPress style={[s.addPhotoBtn, { borderColor: theme.colors.outline }]} accessibilityRole="button">
            <MaterialCommunityIcons name="camera-plus" size={20} color={theme.colors.secondary} />
            <Text variant="labelLarge" style={{ color: theme.colors.secondary, marginLeft: 6 }}>{t("demo.addPhoto")}</Text>
          </DemoPress>
        </Card.Content>
      </Card>

      {/* Body Metrics */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.bodyMetricsSection")}
      </Text>
      <View style={s.metricsStatsRow}>
        {[
          { label: t("demo.currentWeight"), value: `${demoBodyMetrics[demoBodyMetrics.length - 1].weight} kg`, icon: "scale-bathroom" },
          { label: t("demo.goalWeight"), value: `${demoMeasurements.goalWeight} kg`, icon: "flag-checkered" },
          { label: t("demo.bodyFat"), value: `${demoMeasurements.bodyFat}%`, icon: "percent" },
        ].map((m) => (
          <Card key={m.label} style={[s.metricStatCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.metricStatContent}>
              <MaterialCommunityIcons name={m.icon as any} size={22} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>{m.value}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{m.label}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={[s.weightTrendCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("demo.weightTrend")}</Text>
            <View style={[s.trendBadge, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <MaterialCommunityIcons name="trending-down" size={16} color={theme.colors.secondary} />
              <Text variant="labelSmall" style={{ color: theme.colors.secondary, fontWeight: "700", marginLeft: 4 }}>
                -{(demoBodyMetrics[0].weight - demoBodyMetrics[demoBodyMetrics.length - 1].weight).toFixed(1)} kg
              </Text>
            </View>
          </View>
          <View style={s.chartContainer}>
            {demoBodyMetrics.map((point, i) => {
              const barHeight = 20 + ((point.weight - weightMin) / weightRange) * 80;
              return (
                <View key={i} style={s.chartBarWrapper}>
                  <View
                    style={[
                      s.chartBar,
                      {
                        height: barHeight,
                        backgroundColor: i === demoBodyMetrics.length - 1 ? theme.colors.secondary : `${theme.colors.secondary}40`,
                      },
                    ]}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 9 }}>
                    {point.weight}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Card style={[s.measurementsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>{t("demo.measurements")}</Text>
          {[
            { label: t("demo.chest"), value: demoMeasurements.chest },
            { label: t("demo.waist"), value: demoMeasurements.waist },
            { label: t("demo.hips"), value: demoMeasurements.hips },
            { label: t("demo.biceps"), value: demoMeasurements.biceps },
            { label: t("demo.thighs"), value: demoMeasurements.thighs },
          ].map((m) => (
            <View key={m.label} style={s.measurementRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>{m.label}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{m.value} cm</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

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
          <View style={{ height: 8, marginBottom: 16 }}>
            <ProgressBar progress={Math.min(totals.calories / demoMacroGoals.calories, 1)} color={theme.colors.primary} style={{ height: 8, borderRadius: 4 }} />
          </View>
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
              <View style={{ height: 6 }}>
                <ProgressBar progress={Math.min(macro.current / macro.goal, 1)} color={macro.color} style={{ height: 6, borderRadius: 3 }} />
              </View>
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

      <Pressable style={[s.signOutRow, { backgroundColor: theme.colors.surface }]} onPress={() => router.replace({ pathname: "/demo" } as any)} accessibilityRole="button">
        <MaterialCommunityIcons name="logout" size={22} color={theme.custom.error} />
        <Text variant="bodyLarge" style={{ color: theme.custom.error, marginLeft: 12 }}>{t("settings.signOut")}</Text>
      </Pressable>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>{t("common.version")}</Text>
      </Animated.View>
    </ScrollView>

    <Modal visible={selectedMilestone !== null} transparent animationType="fade" onRequestClose={closeMilestone}>
      <Pressable style={s.tooltipOverlay} onPress={closeMilestone}>
        <Pressable style={[s.tooltipCard, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
          {selectedMilestone && (
            <>
              <View style={[s.tooltipIcon, { backgroundColor: selectedMilestone.earned ? `${theme.colors.secondary}15` : theme.colors.surfaceVariant }]}>
                <MaterialCommunityIcons name={selectedMilestone.icon as any} size={40} color={selectedMilestone.earned ? theme.colors.secondary : theme.colors.onSurfaceVariant} />
              </View>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "800", textAlign: "center", marginTop: 12 }}>{selectedMilestone.title}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.secondary, fontStyle: "italic", textAlign: "center", marginTop: 8, lineHeight: 20, paddingHorizontal: 8 }}>"{selectedMilestone.flavor}"</Text>
              <View style={[s.tooltipHowTo, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("milestones.howToEarn")}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4, lineHeight: 20 }}>{selectedMilestone.howTo}</Text>
              </View>
              {selectedMilestone.earned && (
                <View style={s.tooltipUnlocked}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.custom.success} />
                  <Text variant="labelLarge" style={{ color: theme.custom.success, fontWeight: "700", marginLeft: 6 }}>{t("milestones.unlocked")}</Text>
                </View>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
    </>
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
  photosCard: { borderRadius: 16, elevation: 0 },
  photoRow: { flexDirection: "row", gap: 8 },
  photoPlaceholder: { flex: 1, aspectRatio: 0.75, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, marginTop: 14 },
  metricsStatsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  metricStatCard: { flex: 1, borderRadius: 16, elevation: 0 },
  metricStatContent: { alignItems: "center", paddingVertical: 14 },
  weightTrendCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  trendBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chartContainer: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 120 },
  chartBarWrapper: { alignItems: "center", flex: 1 },
  chartBar: { width: 20, borderRadius: 6 },
  measurementsCard: { borderRadius: 16, elevation: 0 },
  measurementRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)" },
  signOutRow: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginTop: 16 },
  docsLink: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginTop: 16 },
  tooltipOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
  tooltipCard: { width: "100%", maxWidth: 320, borderRadius: 24, padding: 24, alignItems: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  tooltipIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  tooltipHowTo: { width: "100%", borderRadius: 12, padding: 12, marginTop: 16 },
  tooltipUnlocked: { flexDirection: "row", alignItems: "center", marginTop: 16 },
});
