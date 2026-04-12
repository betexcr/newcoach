import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, useTheme, Card, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { demoAssignedWorkouts, today } from "../mock-data";

const statusColor = (status: string, theme: AppTheme) => {
  if (status === "completed") return theme.colors.secondary;
  if (status === "missed") return theme.custom.error;
  if (status === "partial") return theme.custom.partial;
  return theme.colors.primary;
};

export default function DemoCalendar() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

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

  const calendarWorkouts = demoAssignedWorkouts.filter((w) => w.scheduled_date === today);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
          <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introCalendar")}
          </Text>
        </Card.Content>
      </Card>

      <View style={s.calendarNav}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.onSurfaceVariant} />
        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "600" }}>{t("demo.thisWeek")}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
      </View>

      <View style={s.calendarRow}>
        {weekDays.map((d) => (
          <Pressable key={d.dateStr} style={[s.calendarCell, { backgroundColor: d.isToday ? theme.colors.primary : theme.colors.surface }]}>
            <Text variant="labelSmall" style={{ color: d.isToday ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{d.label}</Text>
            <Text variant="titleMedium" style={{ color: d.isToday ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: "700" }}>{d.date}</Text>
            {d.status && <View style={[s.calendarDot, { backgroundColor: d.isToday ? theme.colors.onPrimary : statusColor(d.status, theme) }]} />}
          </Pressable>
        ))}
      </View>

      {calendarWorkouts.length === 0 && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginVertical: 24 }}>
          {t("calendar.noWorkouts")}
        </Text>
      )}

      {calendarWorkouts.map((w) => (
        <View key={w.id} style={[s.calWorkoutCard, { backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{w.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {w.exercises.length} {t("demo.exercises")} &middot; {w.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
            </Text>
          </View>
          <Chip mode="flat" style={{ backgroundColor: `${statusColor(w.status, theme)}15` }} textStyle={{ fontSize: 11, color: statusColor(w.status, theme), textTransform: "capitalize" }}>
            {w.status}
          </Chip>
        </View>
      ))}

      {(() => {
        const w = demoAssignedWorkouts[0];
        const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
        return (
          <View style={{ marginTop: 20 }}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>{t("demo.workoutDetail")}</Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{w.name}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 12 }}>
              <Chip mode="flat" icon="dumbbell" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>{w.exercises.length} {t("demo.exercises")}</Chip>
              <Chip mode="flat" icon="repeat" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>{totalSets} sets</Chip>
              <Chip mode="flat" icon="clock-outline" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>~{Math.round(totalSets * 2.5)} min</Chip>
            </View>
            {w.exercises.slice(0, 3).map((ex) => (
              <Card key={ex.exercise_id + ex.order} style={[s.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{ex.exercise_name}</Text>
                  <View style={[s.setHeader, { borderBottomColor: theme.colors.outline }]}>
                    <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.set")}</Text>
                    <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.reps")}</Text>
                    <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.weight")}</Text>
                    <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.rest")}</Text>
                  </View>
                  {ex.sets.map((set) => (
                    <View key={set.set_number} style={s.setRow}>
                      <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.set_number}</Text>
                      <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.reps ?? "—"}</Text>
                      <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.weight ? `${set.weight} kg` : "—"}</Text>
                      <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{set.rest_seconds ? `${set.rest_seconds}s` : "—"}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))}
            <View style={[s.startBtnLarge, { backgroundColor: theme.colors.primary }]}>
              <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>{t("demo.startWorkout")}</Text>
            </View>
          </View>
        );
      })()}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  calendarNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  calendarRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  calendarCell: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, gap: 4 },
  calendarDot: { width: 6, height: 6, borderRadius: 3 },
  calWorkoutCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  exerciseBlock: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  setHeader: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 8, marginTop: 10 },
  setRow: { flexDirection: "row", paddingVertical: 6 },
  setCol: { flex: 1, textAlign: "center" },
  startBtnLarge: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12 },
});
