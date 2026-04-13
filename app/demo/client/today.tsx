import { View, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import { clientProfile, demoAssignedWorkouts, demoProgressStats, demoPendingInvites, today } from "../mock-data";

const statusColor = (status: string, theme: AppTheme) => {
  if (status === "completed") return theme.colors.secondary;
  if (status === "missed") return theme.custom.error;
  if (status === "partial") return theme.custom.partial;
  return theme.colors.primary;
};

export default function DemoToday() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("client-today");

  const todayWorkouts = demoAssignedWorkouts.filter((w) => w.scheduled_date === today);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split("T")[0];
    const workout = demoAssignedWorkouts.find((w) => w.scheduled_date === dateStr);
    return {
      label: [t("today.mon"), t("today.tue"), t("today.wed"), t("today.thu"), t("today.fri"), t("today.sat"), t("today.sun")][i],
      date: d.getDate(),
      dateStr,
      isToday: dateStr === today,
      status: workout?.status ?? null,
    };
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      {!introCollapsed && (
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained" onPress={dismissIntro}>
            <Card.Content style={s.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
              <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introToday")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: contentOpacity }}>
      <View style={{ marginBottom: 16 }}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
          {t("today.greeting", { name: clientProfile.full_name?.split(" ")[0] ?? "" })}
        </Text>
      </View>

      {demoPendingInvites.length > 0 && (
        <Card style={[s.inviteCard, { backgroundColor: `${theme.colors.secondary}12` }]}>
          <Card.Content style={s.inviteContent}>
            <MaterialCommunityIcons name="email-open-outline" size={24} color={theme.colors.secondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {demoPendingInvites[0].coach.full_name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("demo.inviteBanner")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <DemoPress style={[s.inviteBtn, { backgroundColor: theme.colors.secondary }]} accessibilityRole="button">
                <Text variant="labelSmall" style={{ color: theme.colors.onSecondary, fontWeight: "700" }}>{t("demo.acceptInvite")}</Text>
              </DemoPress>
              <DemoPress style={[s.inviteBtn, { backgroundColor: theme.colors.surfaceVariant }]} accessibilityRole="button">
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: "600" }}>{t("demo.declineInvite")}</Text>
              </DemoPress>
            </View>
          </Card.Content>
        </Card>
      )}

      {todayWorkouts.length > 0 ? (
        todayWorkouts.map((w) => (
          <Card key={w.id} style={[s.todayCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={[s.workoutIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <MaterialCommunityIcons name="dumbbell" size={22} color={theme.colors.primary} />
                </View>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 10, flex: 1 }}>{w.name}</Text>
              </View>
              {w.exercises.slice(0, 3).map((ex) => (
                <Text key={ex.exercise_id + ex.order} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 46, marginBottom: 2 }}>
                  {ex.exercise_name} &middot; {ex.sets.length} sets
                </Text>
              ))}
              {w.exercises.length > 3 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 46 }}>+{w.exercises.length - 3} more</Text>
              )}
              <Pressable
                style={[s.startBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push({ pathname: "/demo/workout", params: { id: w.id } } as any)}
                accessibilityRole="button"
              >
                <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>{t("demo.startWorkout")}</Text>
              </Pressable>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card style={[s.todayCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={{ alignItems: "center", paddingVertical: 24 }}>
            <MaterialCommunityIcons name="yoga" size={36} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>{t("demo.restDayMessage")}</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={[s.weekCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>{t("demo.thisWeek")}</Text>
          <View style={s.weekRow}>
            {weekDays.map((d) => (
              <View key={d.dateStr} style={s.dayColumn}>
                <Text variant="labelSmall" style={{ color: d.isToday ? theme.colors.primary : theme.colors.onSurfaceVariant, fontWeight: d.isToday ? "700" : "400" }}>{d.label}</Text>
                <View style={[s.dayDot, { backgroundColor: d.status ? statusColor(d.status, theme) : theme.colors.surfaceVariant, borderWidth: d.isToday ? 2 : 0, borderColor: theme.colors.primary }]} />
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <View style={s.statsRow}>
        {[
          { label: t("demo.streak"), value: `${demoProgressStats.streak} days`, icon: "fire" },
          { label: t("demo.thisWeek"), value: `${weekDays.filter((d) => d.status === "completed").length}/7`, icon: "calendar-check" },
          { label: t("demo.compliance"), value: `${demoProgressStats.compliance30}%`, icon: "chart-arc" },
        ].map((st) => (
          <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.statContent}>
              <MaterialCommunityIcons name={st.icon as any} size={22} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>{st.value}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{st.label}</Text>
            </Card.Content>
          </Card>
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
  todayCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  workoutIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  startBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 14 },
  weekCard: { borderRadius: 16, elevation: 0, marginBottom: 16 },
  weekRow: { flexDirection: "row", justifyContent: "space-around" },
  dayColumn: { alignItems: "center", gap: 6 },
  dayDot: { width: 10, height: 10, borderRadius: 5 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  inviteCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  inviteContent: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  inviteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});
