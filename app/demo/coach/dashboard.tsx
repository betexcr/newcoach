import { View, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { Text, useTheme, Card, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import {
  coachProfile,
  demoClients,
  demoAssignedWorkouts,
  demoConversations,
  demoActivityFeed,
  demoBilling,
} from "../mock-data";

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function DemoDashboard() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("coach-dashboard");

  const activeClients = demoClients.filter((c) => c.status === "active");
  const todayWorkouts = demoAssignedWorkouts.filter((w) => {
    const d = new Date().toISOString().split("T")[0];
    return w.scheduled_date === d;
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      {!introCollapsed && (
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained" onPress={dismissIntro}>
            <Card.Content style={s.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introDashboard")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: contentOpacity }}>
      <View style={s.greeting}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("demo.welcomeBack")}
          </Text>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
            {coachProfile.full_name}
          </Text>
        </View>
        <Avatar.Text size={48} label={initials(coachProfile.full_name)} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{ color: theme.colors.primary }} />
      </View>

      <View style={s.statsRow}>
        {[
          { label: t("dashboard.activeClients"), value: String(activeClients.length), icon: "account-group" },
          { label: t("dashboard.todaysWorkouts"), value: String(todayWorkouts.length), icon: "dumbbell" },
          { label: t("dashboard.messages"), value: String(demoConversations.length), icon: "message" },
          { label: t("demo.revenue"), value: `$${demoBilling.monthlyRevenue}`, icon: "cash-multiple" },
        ].map((st) => (
          <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.statContent}>
              <MaterialCommunityIcons name={st.icon as any} size={24} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 8 }}>
                {st.value}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {st.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
        {t("demo.quickActions")}
      </Text>
      <View style={s.actionsGrid}>
        {[
          { label: t("demo.newWorkout"), icon: "plus-circle", color: theme.colors.primary, route: "/demo/new-workout" },
          { label: t("demo.addClient"), icon: "account-plus", color: theme.colors.secondary, route: "/demo/add-client" },
          { label: t("demo.newProgram"), icon: "clipboard-list", color: theme.custom.warning, route: "/demo/new-program" },
          { label: t("demo.broadcast"), icon: "bullhorn", color: theme.custom.purple, route: "/demo/broadcast" },
        ].map((a) => (
          <Pressable key={a.label} style={[s.actionCard, { backgroundColor: theme.colors.surface }]} onPress={() => router.push({ pathname: a.route } as any)} accessibilityRole="button">
            <View style={[s.actionIcon, { backgroundColor: `${a.color}15` }]}>
              <MaterialCommunityIcons name={a.icon as any} size={28} color={a.color} />
            </View>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginTop: 8, fontWeight: "600" }}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
        {t("demo.recentActivity")}
      </Text>
      <View style={s.activityList}>
        {demoActivityFeed.map((item, idx) => (
          <DemoPress
            key={item.id}
            style={[
              s.activityRow,
              { backgroundColor: theme.colors.surface },
              idx === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
              idx === demoActivityFeed.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
            ]}
          >
            <View style={[s.activityIcon, { backgroundColor: `${item.type === "workout_completed" ? theme.colors.secondary : theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={item.type === "workout_completed" ? theme.colors.secondary : theme.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.subtitle}
                </Text>
                <View style={[s.clientTag, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="account" size={12} color={theme.colors.primary} />
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 3 }} numberOfLines={1}>
                    {item.clientName}
                  </Text>
                </View>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </DemoPress>
        ))}
      </View>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  greeting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  actionCard: { width: "47%", borderRadius: 16, padding: 20, alignItems: "center" },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  activityList: { gap: 1, marginBottom: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  clientTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
});
