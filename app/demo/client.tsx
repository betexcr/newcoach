import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import {
  Text,
  useTheme,
  Card,
  Avatar,
  Chip,
  ProgressBar,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import {
  clientProfile,
  coachProfile,
  demoAssignedWorkouts,
  demoResults,
  demoHabits,
  demoHabitLogs,
  demoNutritionLogs,
  demoMacroGoals,
  demoMilestones,
  demoProgressStats,
  demoChatMessages,
  demoConversations,
  COACH_ID,
  CLIENT_1_ID,
  today,
} from "./mock-data";

function SectionHeader({
  icon,
  title,
  theme,
}: {
  icon: string;
  title: string;
  theme: AppTheme;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.secondary} />
      </View>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
        {title}
      </Text>
    </View>
  );
}

const statusColor = (status: string, theme: AppTheme) => {
  if (status === "completed") return theme.colors.secondary;
  if (status === "missed") return theme.custom.error;
  if (status === "partial") return theme.custom.partial;
  return theme.colors.primary;
};

function ComplianceRing({ label, value, theme }: { label: string; value: number; theme: AppTheme }) {
  return (
    <View style={s.ringContainer}>
      <View style={[s.ringOuter, { borderColor: theme.colors.surfaceVariant }]}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
          {value}%
        </Text>
      </View>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
        {label}
      </Text>
    </View>
  );
}

export default function ClientDemoScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { t } = useTranslation();

  const todayWorkouts = demoAssignedWorkouts.filter((w) => w.scheduled_date === today);

  // Build week days for the week strip
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

  // Calendar selected day workouts (show today)
  const calendarWorkouts = demoAssignedWorkouts.filter((w) => w.scheduled_date === today);

  // Nutrition totals
  const totals = demoNutritionLogs.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const earnedMilestones = demoMilestones.filter((m) => m.earned);
  const remainingMilestones = demoMilestones.filter((m) => !m.earned);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Back to demo index */}
        <Pressable style={s.backRow} onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.secondary} />
          <Text variant="labelLarge" style={{ color: theme.colors.secondary, marginLeft: 6 }}>
            {t("demo.backToDemo")}
          </Text>
        </Pressable>

        <Text variant="displaySmall" style={{ color: theme.colors.secondary, fontWeight: "800", marginBottom: 4 }}>
          {t("demo.clientHeadline")}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
          {t("demo.clientSubtitle")}
        </Text>

        {/* ──────────────── TODAY ──────────────── */}
        <SectionHeader icon="lightning-bolt" title={t("demo.todaySection")} theme={theme} />

        <View style={{ marginBottom: 16 }}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
            Hey, {clientProfile.full_name?.split(" ")[0]}!
          </Text>
        </View>

        {todayWorkouts.length > 0 ? (
          todayWorkouts.map((w) => (
            <Card key={w.id} style={[s.todayCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={[s.workoutIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <MaterialCommunityIcons name="dumbbell" size={22} color={theme.colors.primary} />
                  </View>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 10, flex: 1 }}>
                    {w.name}
                  </Text>
                </View>
                {w.exercises.slice(0, 3).map((ex) => (
                  <Text key={ex.exercise_id + ex.order} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 46, marginBottom: 2 }}>
                    {ex.exercise_name} &middot; {ex.sets.length} sets
                  </Text>
                ))}
                {w.exercises.length > 3 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 46 }}>
                    +{w.exercises.length - 3} more
                  </Text>
                )}
                <View style={[s.startBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
                    {t("demo.startWorkout")}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={[s.todayCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={{ alignItems: "center", paddingVertical: 24 }}>
              <MaterialCommunityIcons name="yoga" size={36} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                {t("demo.restDayMessage")}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Week strip */}
        <Card style={[s.weekCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
              {t("demo.thisWeek")}
            </Text>
            <View style={s.weekRow}>
              {weekDays.map((d) => (
                <View key={d.dateStr} style={s.dayColumn}>
                  <Text variant="labelSmall" style={{ color: d.isToday ? theme.colors.primary : theme.colors.onSurfaceVariant, fontWeight: d.isToday ? "700" : "400" }}>
                    {d.label}
                  </Text>
                  <View
                    style={[
                      s.dayDot,
                      {
                        backgroundColor: d.status
                          ? statusColor(d.status, theme)
                          : theme.colors.surfaceVariant,
                        borderWidth: d.isToday ? 2 : 0,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: t("demo.streak"), value: `${demoProgressStats.streak} days`, icon: "fire" },
            { label: t("demo.thisWeek"), value: `${weekDays.filter((d) => d.status === "completed").length}/7`, icon: "calendar-check" },
            { label: t("demo.compliance"), value: `${demoProgressStats.compliance30}%`, icon: "chart-arc" },
          ].map((st) => (
            <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={s.statContent}>
                <MaterialCommunityIcons name={st.icon as any} size={22} color={theme.colors.secondary} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>
                  {st.value}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {st.label}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Divider style={s.divider} />

        {/* ──────────────── CALENDAR ──────────────── */}
        <SectionHeader icon="calendar" title={t("demo.calendarSection")} theme={theme} />

        <View style={s.calendarNav}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "600" }}>
            {t("demo.thisWeek")}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
        </View>

        <View style={s.calendarRow}>
          {weekDays.map((d) => (
            <Pressable
              key={d.dateStr}
              style={[
                s.calendarCell,
                { backgroundColor: d.isToday ? theme.colors.primary : theme.colors.surface },
              ]}
            >
              <Text variant="labelSmall" style={{ color: d.isToday ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                {d.label}
              </Text>
              <Text variant="titleMedium" style={{ color: d.isToday ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: "700" }}>
                {d.date}
              </Text>
              {d.status && (
                <View style={[s.calendarDot, { backgroundColor: d.isToday ? theme.colors.onPrimary : statusColor(d.status, theme) }]} />
              )}
            </Pressable>
          ))}
        </View>

        {calendarWorkouts.map((w) => (
          <View key={w.id} style={[s.calWorkoutCard, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {w.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {w.exercises.length} {t("demo.exercises")} &middot; {w.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
              </Text>
            </View>
            <Chip mode="flat" style={{ backgroundColor: `${statusColor(w.status, theme)}15` }} textStyle={{ fontSize: 11, color: statusColor(w.status, theme), textTransform: "capitalize" }}>
              {w.status}
            </Chip>
          </View>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── WORKOUT DETAIL ──────────────── */}
        <SectionHeader icon="dumbbell" title={t("demo.workoutDetail")} theme={theme} />

        {(() => {
          const w = demoAssignedWorkouts[0];
          const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
          return (
            <>
              <View style={{ marginBottom: 12 }}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                  {w.name}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <Chip mode="flat" icon="dumbbell" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>
                    {w.exercises.length} {t("demo.exercises")}
                  </Chip>
                  <Chip mode="flat" icon="repeat" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>
                    {totalSets} sets
                  </Chip>
                  <Chip mode="flat" icon="clock-outline" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>
                    ~{Math.round(totalSets * 2.5)} min
                  </Chip>
                </View>
              </View>

              {w.exercises.slice(0, 3).map((ex) => (
                <Card key={ex.exercise_id + ex.order} style={[s.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                      {ex.exercise_name}
                    </Text>
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
                    {ex.notes && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginTop: 8 }}>
                        Coach note: {ex.notes}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))}

              <View style={[s.startBtnLarge, { backgroundColor: theme.colors.primary }]}>
                <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>
                  {t("demo.startWorkout")}
                </Text>
              </View>
            </>
          );
        })()}

        <Divider style={s.divider} />

        {/* ──────────────── HABITS ──────────────── */}
        <SectionHeader icon="checkbox-marked-circle" title={t("demo.habitsSection")} theme={theme} />

        {demoHabits.map((habit) => {
          const log = demoHabitLogs.find((l) => l.habit_id === habit.id);
          const completed = log?.completed ?? false;
          return (
            <Card key={habit.id} style={[s.habitCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[s.habitCheck, { borderColor: completed ? theme.colors.secondary : theme.colors.outline, backgroundColor: completed ? theme.colors.secondary : "transparent" }]}>
                  {completed && <MaterialCommunityIcons name="check" size={16} color={theme.colors.onSecondary} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                    {habit.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {habit.frequency}{habit.description ? ` \u00B7 ${habit.description}` : ""}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        <Divider style={s.divider} />

        {/* ──────────────── PROGRESS ──────────────── */}
        <SectionHeader icon="chart-line" title={t("demo.progressSection")} theme={theme} />

        <View style={s.statsRow}>
          {[
            { label: t("demo.streak"), value: `${demoProgressStats.streak}`, icon: "fire" },
            { label: t("demo.completed"), value: `${demoProgressStats.completedCount}`, icon: "check-circle" },
            { label: t("demo.total"), value: `${demoProgressStats.totalAssigned}`, icon: "clipboard-list" },
          ].map((st) => (
            <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={s.statContent}>
                <MaterialCommunityIcons name={st.icon as any} size={22} color={theme.colors.secondary} />
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>
                  {st.value}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {st.label}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Card style={[s.complianceCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 16 }}>
              {t("demo.complianceTitle")}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <ComplianceRing label={t("demo.days7")} value={demoProgressStats.compliance7} theme={theme} />
              <ComplianceRing label={t("demo.days30")} value={demoProgressStats.compliance30} theme={theme} />
              <ComplianceRing label={t("demo.days90")} value={demoProgressStats.compliance90} theme={theme} />
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16, marginBottom: 8 }}>
          {t("demo.topExercises")}
        </Text>
        {demoProgressStats.topExercises.map((ex) => (
          <Card key={ex.name} style={[s.topExCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                  {ex.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {ex.sessions} {t("demo.sessions")}
                </Text>
              </View>
              <Chip mode="flat" icon="trophy" style={{ backgroundColor: `${theme.custom.warning}20` }} textStyle={{ fontSize: 11, color: theme.custom.warning }}>
                PR: {ex.prWeight} kg
              </Chip>
            </Card.Content>
          </Card>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── MILESTONES ──────────────── */}
        <SectionHeader icon="trophy" title={t("demo.milestonesSection")} theme={theme} />

        <View style={s.statsRow}>
          <Card style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.statContent}>
              <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.secondary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>
                {earnedMilestones.length}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {t("demo.earned")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={s.statContent}>
              <MaterialCommunityIcons name="lock-outline" size={22} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>
                {remainingMilestones.length}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {t("demo.remaining")}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={s.badgeGrid}>
          {demoMilestones.map((m) => (
            <View key={m.id} style={[s.badge, { backgroundColor: theme.colors.surface, opacity: m.earned ? 1 : 0.5 }]}>
              <View style={[s.badgeIcon, { backgroundColor: m.earned ? `${theme.colors.secondary}15` : theme.colors.surfaceVariant }]}>
                <MaterialCommunityIcons name={m.icon as any} size={28} color={m.earned ? theme.colors.secondary : theme.colors.onSurfaceVariant} />
              </View>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: "600", marginTop: 8, textAlign: "center" }} numberOfLines={1}>
                {m.title}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 2 }} numberOfLines={2}>
                {m.description}
              </Text>
              {m.earned && (
                <View style={[s.earnedBadge, { backgroundColor: theme.colors.secondary }]}>
                  <MaterialCommunityIcons name="check" size={10} color={theme.colors.onSecondary} />
                </View>
              )}
            </View>
          ))}
        </View>

        <Divider style={s.divider} />

        {/* ──────────────── NUTRITION ──────────────── */}
        <SectionHeader icon="food-apple" title={t("demo.nutritionSection")} theme={theme} />

        <Card style={[s.nutritionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                {t("demo.todaySummary")}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {totals.calories} / {demoMacroGoals.calories} kcal
              </Text>
            </View>

            <ProgressBar progress={Math.min(totals.calories / demoMacroGoals.calories, 1)} color={theme.colors.primary} style={{ height: 8, borderRadius: 4, marginBottom: 16 }} />

            {[
              { label: t("demo.protein"), current: totals.protein, goal: demoMacroGoals.protein, color: theme.custom.info },
              { label: t("demo.carbs"), current: totals.carbs, goal: demoMacroGoals.carbs, color: theme.custom.warning },
              { label: t("demo.fat"), current: totals.fat, goal: demoMacroGoals.fat, color: theme.custom.error },
            ].map((macro) => (
              <View key={macro.label} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                    {macro.label}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {macro.current}g / {macro.goal}g
                  </Text>
                </View>
                <ProgressBar progress={Math.min(macro.current / macro.goal, 1)} color={macro.color} style={{ height: 6, borderRadius: 3 }} />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, marginBottom: 8 }}>
          {t("demo.foodLog")}
        </Text>
        {demoNutritionLogs.map((entry) => (
          <View key={entry.id} style={[s.nutritionEntry, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {entry.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {entry.meal} &middot; {entry.protein}g P &middot; {entry.carbs}g C &middot; {entry.fat}g F
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
              {entry.calories}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
              kcal
            </Text>
          </View>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── MESSAGING ──────────────── */}
        <SectionHeader icon="message" title={t("demo.messaging")} theme={theme} />

        <View style={[s.convRow, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Icon size={44} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
              {coachProfile.full_name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {demoConversations[0].last_message?.body ?? ""}
            </Text>
          </View>
        </View>

        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
          {t("demo.chatPreview")}
        </Text>
        <View style={[s.chatContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          {demoChatMessages.map((msg) => {
            const isOwn = msg.sender_id === CLIENT_1_ID;
            return (
              <View
                key={msg.id}
                style={[
                  s.bubble,
                  isOwn ? s.ownBubble : s.otherBubble,
                  { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface },
                ]}
              >
                <Text variant="bodyMedium" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface, lineHeight: 20 }}>
                  {msg.body}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{
                    color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                    opacity: isOwn ? 0.6 : 1,
                    marginTop: 4,
                    alignSelf: isOwn ? "flex-end" : "flex-start",
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  divider: { marginVertical: 28 },
  todayCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  workoutIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  startBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 14 },
  startBtnLarge: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  weekCard: { borderRadius: 16, elevation: 0, marginBottom: 16 },
  weekRow: { flexDirection: "row", justifyContent: "space-around" },
  dayColumn: { alignItems: "center", gap: 6 },
  dayDot: { width: 10, height: 10, borderRadius: 5 },
  calendarNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  calendarRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  calendarCell: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, gap: 4 },
  calendarDot: { width: 6, height: 6, borderRadius: 3 },
  calWorkoutCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  exerciseBlock: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  setHeader: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 8, marginTop: 10 },
  setRow: { flexDirection: "row", paddingVertical: 6 },
  setCol: { flex: 1, textAlign: "center" },
  habitCard: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  habitCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  complianceCard: { borderRadius: 16, elevation: 0, marginBottom: 4 },
  ringContainer: { alignItems: "center" },
  ringOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, justifyContent: "center", alignItems: "center" },
  topExCard: { borderRadius: 14, elevation: 0, marginBottom: 6 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", borderRadius: 16, padding: 14, alignItems: "center", position: "relative" },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  earnedBadge: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  nutritionCard: { borderRadius: 16, elevation: 0 },
  nutritionEntry: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  convRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  chatContainer: { borderRadius: 16, padding: 12 },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 6 },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
});
