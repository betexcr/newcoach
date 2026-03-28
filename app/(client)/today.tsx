import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text, useTheme, Card, Button, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { usePendingInvites } from "@/lib/queries/clients";
import { ErrorState } from "@/components/ErrorState";
import { computeStreak } from "@/lib/streak";
import { formatDate } from "@/lib/date-utils";
import type { AssignedWorkout } from "@/types/database";

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(now.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const statusColors = useMemo(
    () => ({
      completed: theme.colors.secondary,
      pending: "#F59E0B",
      missed: theme.colors.error,
      partial: "#F97316",
    }),
    [theme]
  );
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id);

  const todayStr = formatDate(new Date());
  const week = useMemo(() => getWeekRange(), []);

  const {
    data: weekWorkouts = [],
    isLoading: weekWorkoutsLoading,
    isError: weekError,
    refetch: refetchWeek,
    isRefetching: isRefetchingWeek,
  } = useClientWorkouts(userId ?? "", week.start, week.end);

  const {
    data: allWorkouts = [],
    isLoading: allWorkoutsLoading,
    isError: allError,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useClientWorkouts(userId ?? "");
  const { data: pendingInvites = [] } = usePendingInvites(userId ?? "");

  const todayWorkouts = useMemo(
    () => weekWorkouts.filter((w) => w.scheduled_date === todayStr),
    [weekWorkouts, todayStr]
  );

  const weekCompleted = useMemo(
    () => weekWorkouts.filter((w) => w.status === "completed").length,
    [weekWorkouts]
  );

  const streak = useMemo(() => computeStreak(allWorkouts), [allWorkouts]);

  const last30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = formatDate(cutoff);
    const relevant = allWorkouts.filter(
      (w) => w.scheduled_date >= cutoffStr && w.scheduled_date <= todayStr
    );
    const done = relevant.filter((w) => w.status === "completed").length;
    return relevant.length > 0
      ? Math.round((done / relevant.length) * 100)
      : 0;
  }, [allWorkouts, todayStr]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const weekDays = useMemo(() => {
    const start = new Date();
    const d = start.getDay();
    start.setDate(start.getDate() + (d === 0 ? -6 : 1 - d));
    const dayKeys = ["today.mon", "today.tue", "today.wed", "today.thu", "today.fri", "today.sat", "today.sun"];
    return dayKeys.map((key, i) => {
      const label = t(key);
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = formatDate(d);
      const workout = weekWorkouts.find((w) => w.scheduled_date === dateStr);
      return { label, dateStr, isToday: dateStr === todayStr, workout };
    });
  }, [weekWorkouts, todayStr, t]);

  if (weekWorkoutsLoading || allWorkoutsLoading || !userId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (weekError || allError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => { refetchWeek(); refetchAll(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingWeek || isRefetchingAll}
            onRefresh={() => {
              refetchWeek();
              refetchAll();
            }}
          />
        }
      >
        <View style={styles.greeting}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {today}
          </Text>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {profile?.full_name?.split(" ")[0]
              ? t("today.greeting", { name: profile.full_name.split(" ")[0] })
              : t("today.greetingFallback")}
          </Text>
        </View>

        {pendingInvites.length > 0 && (
          <Pressable
            onPress={() => router.push("/(client)/invites" as any)}
            style={[styles.inviteBanner, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: "700" }}
              >
                {t("invites.bannerTitle")}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("invites.bannerMessage", { count: pendingInvites.length })}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>
        )}

        {todayWorkouts.length === 0 ? (
          <Card
            style={[styles.todayCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content style={styles.todayContent}>
              <View
                style={[
                  styles.workoutIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="sleep"
                  size={40}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                  marginTop: 16,
                }}
              >
                {t("today.restDay")}
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {t("today.restDayMessage")}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          todayWorkouts.map((workout) => (
            <TodayWorkoutCard
              key={workout.id}
              workout={workout}
              theme={theme}
              t={t}
              onPress={() =>
                router.push(`/(client)/workout/${workout.id}` as any)
              }
            />
          ))
        )}

        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("today.thisWeek")}
          </Text>
          <Card
            style={[styles.weekCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content style={styles.weekContent}>
              {weekDays.map((day) => {
                let dotColor = theme.colors.surfaceVariant;
                if (day.workout) {
                  dotColor =
                    statusColors[day.workout.status] ?? theme.colors.primary;
                }
                return (
                  <View key={day.label} style={styles.dayColumn}>
                    <Text
                      variant="labelSmall"
                      style={{
                        color: day.isToday
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                        fontWeight: day.isToday ? "700" : "400",
                      }}
                    >
                      {day.label}
                    </Text>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: dotColor,
                          width: day.workout ? 12 : 8,
                          height: day.workout ? 12 : 8,
                          borderRadius: day.workout ? 6 : 4,
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("today.yourStats")}
          </Text>
          <View style={styles.statsRow}>
            {[
              {
                label: t("today.streak"),
                value: t(streak === 1 ? "today.dayCount_one" : "today.dayCount_other", { count: streak }),
                icon: "fire",
                color: "#F59E0B",
              },
              {
                label: t("today.thisWeek"),
                value: `${weekCompleted}/${weekWorkouts.length}`,
                icon: "check-circle",
                color: theme.colors.secondary,
              },
              {
                label: t("today.compliance"),
                value: `${last30}%`,
                icon: "chart-arc",
                color: theme.colors.primary,
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                style={[
                  styles.statCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content style={styles.statContent}>
                  <MaterialCommunityIcons
                    name={stat.icon as any}
                    size={22}
                    color={stat.color}
                  />
                  <Text
                    variant="titleMedium"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "700",
                      marginTop: 6,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {stat.label}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayWorkoutCard({
  workout,
  theme,
  t,
  onPress,
}: {
  workout: AssignedWorkout;
  theme: any;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onPress: () => void;
}) {
  const exerciseCount = workout.exercises?.length ?? 0;
  const totalSets =
    workout.exercises?.reduce((s, ex) => s + (ex.sets?.length ?? 0), 0) ?? 0;
  const isCompleted = workout.status === "completed";

  return (
    <Card
      style={[styles.todayCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <Card.Content style={styles.workoutCardContent}>
        <View
          style={[
            styles.workoutIcon,
            {
              backgroundColor: isCompleted
                ? `${theme.colors.secondary}20`
                : theme.colors.primaryContainer,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isCompleted ? "check-circle" : "dumbbell"}
            size={40}
            color={isCompleted ? theme.colors.secondary : theme.colors.primary}
          />
        </View>
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginTop: 16,
          }}
        >
          {workout.name}
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            marginTop: 6,
          }}
        >
          {t("today.exerciseSets", { exercises: exerciseCount, sets: totalSets })}
        </Text>

        <View style={styles.exercisePreview}>
          {workout.exercises?.slice(0, 4).map((ex, i) => (
            <View key={i} style={styles.exerciseRow}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
              >
                {ex.exercise_name} {t("today.moreSets", { count: ex.sets?.length ?? 0 })}
              </Text>
            </View>
          ))}
          {(workout.exercises?.length ?? 0) > 4 && (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.primary,
                marginTop: 4,
                marginLeft: 20,
              }}
            >
              {t("today.moreExercises", { count: (workout.exercises?.length ?? 0) - 4 })}
            </Text>
          )}
        </View>

        <Button
          mode={isCompleted ? "outlined" : "contained"}
          style={{ marginTop: 16, borderRadius: 12 }}
          onPress={onPress}
        >
          {isCompleted ? t("today.viewResults") : t("today.startWorkout")}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { marginBottom: 20 },
  inviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  todayCard: { borderRadius: 20, elevation: 0, marginBottom: 16 },
  todayContent: { alignItems: "center", paddingVertical: 32 },
  workoutCardContent: { alignItems: "center", paddingVertical: 24 },
  workoutIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  exercisePreview: { marginTop: 16, alignSelf: "stretch" },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  section: { marginBottom: 24 },
  weekCard: { borderRadius: 16, elevation: 0, marginTop: 12 },
  weekContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  dayColumn: { alignItems: "center", gap: 8 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 16 },
});
