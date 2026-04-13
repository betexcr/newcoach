import { View, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { Text, useTheme, Card, Avatar, SegmentedButtons, Chip, Divider, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import { useSettingsStore, type ThemePreference, type LanguagePreference } from "@/stores/settings-store";
import { coachProfile, demoBilling, demoWebhooks } from "../mock-data";

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function DemoSettings() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("coach-settings");
  const themePref = useSettingsStore((s) => s.theme);
  const langPref = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      {!introCollapsed && (
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained" onPress={dismissIntro}>
            <Card.Content style={s.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introSettings")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: contentOpacity }}>
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

      {/* Billing & Payments */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.billingSection")}
      </Text>
      <Card style={[s.billingCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("demo.activePlan")}</Text>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: "700" }}>{t("demo.planPro")}</Text>
            </View>
            <View style={[s.revenueBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "700", marginLeft: 6 }}>${demoBilling.monthlyRevenue}{t("demo.perMonth")}</Text>
            </View>
          </View>
          <View style={[s.billingRow, { borderTopColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="credit-card-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 10, flex: 1 }}>{t("demo.cardEnding")}</Text>
          </View>
          <View style={s.billingRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 10, flex: 1 }}>
              {t("demo.nextBilling")}: {new Date(demoBilling.nextBillingDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          </View>
        </Card.Content>
      </Card>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 8 }}>
        <DemoPress style={[s.billingBtn, { backgroundColor: theme.colors.primaryContainer }]} accessibilityRole="button">
          <MaterialCommunityIcons name="cog-outline" size={18} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}>{t("demo.manageSubscription")}</Text>
        </DemoPress>
        <DemoPress style={[s.billingBtn, { backgroundColor: theme.colors.surfaceVariant }]} accessibilityRole="button">
          <MaterialCommunityIcons name="receipt" size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: "600", marginLeft: 6 }}>{t("demo.viewInvoices")}</Text>
        </DemoPress>
      </View>

      {/* Public Profile */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.publicProfileSection")}
      </Text>
      <Card style={[s.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={s.fieldRow}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{t("settings.profileSlug")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{coachProfile.public_slug}</Text>
            </View>
          </View>
          <View style={s.fieldRow}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{t("settings.bio")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{coachProfile.bio}</Text>
            </View>
          </View>
          <View style={s.fieldRow}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{t("publicProfile.specialties")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {(coachProfile.specialties ?? []).map((sp) => (
                <Chip key={sp} compact style={{ backgroundColor: theme.colors.primaryContainer }} textStyle={{ fontSize: 12 }}>{sp}</Chip>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <DemoPress style={[s.profileBtn, { backgroundColor: theme.colors.primary }]} accessibilityRole="button">
              <MaterialCommunityIcons name="content-save" size={18} color={theme.colors.onPrimary} />
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimary, fontWeight: "600", marginLeft: 6 }}>{t("common.save")}</Text>
            </DemoPress>
            <Pressable
              style={[s.profileBtn, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => router.push({ pathname: "/demo/public-profile" } as any)}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}>{t("demo.publicProfileSection")}</Text>
            </Pressable>
          </View>
        </Card.Content>
      </Card>

      {/* Webhook Integrations */}
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.webhooksSection")}
      </Text>
      <Card style={[s.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          {demoWebhooks.map((wh, idx) => (
            <View key={wh.id}>
              <View style={s.webhookRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>
                    {wh.url}
                  </Text>
                  <Chip compact style={{ backgroundColor: theme.colors.surfaceVariant, alignSelf: "flex-start", marginTop: 4 }} textStyle={{ fontSize: 10 }}>
                    {wh.event_type.replace(".", " ")}
                  </Chip>
                </View>
                <Switch value={wh.active} disabled style={{ marginLeft: 8 }} />
              </View>
              {idx < demoWebhooks.length - 1 && <Divider style={{ marginVertical: 8 }} />}
            </View>
          ))}
          <DemoPress style={[s.addWebhookBtn, { borderColor: theme.colors.outline }]} accessibilityRole="button">
            <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}>{t("settings.addWebhook")}</Text>
          </DemoPress>
        </Card.Content>
      </Card>

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

      <Pressable style={[s.signOutRow, { backgroundColor: theme.colors.surface }]} onPress={() => router.replace({ pathname: "/demo" } as any)} accessibilityRole="button">
        <MaterialCommunityIcons name="logout" size={22} color={theme.custom.error} />
        <Text variant="bodyLarge" style={{ color: theme.custom.error, marginLeft: 12 }}>{t("settings.signOut")}</Text>
      </Pressable>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>
        {t("common.version")}
      </Text>
      </Animated.View>
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
  billingCard: { borderRadius: 16, elevation: 0 },
  revenueBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  billingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "transparent" },
  billingBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12 },
  card: { borderRadius: 16, elevation: 0 },
  fieldRow: { marginBottom: 12 },
  fakeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  profileBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12 },
  webhookRow: { flexDirection: "row", alignItems: "center" },
  addWebhookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, marginTop: 12 },
});
