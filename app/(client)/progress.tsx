import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, useTheme, Card, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { useClientResults } from "@/lib/queries/results";
import { ErrorState } from "@/components/ErrorState";
import { computeStreak } from "@/lib/streak";
import { formatDate } from "@/lib/date-utils";
import type { AssignedWorkout, WorkoutResult, LoggedExercise } from "@/types/database";

function calculateCompliance(
  workouts: AssignedWorkout[],
  days: number
): { rate: number; completed: number; total: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = formatDate(cutoff);
  const todayStr = formatDate(new Date());

  const relevant = workouts.filter(
    (w) => w.scheduled_date >= cutoffStr && w.scheduled_date <= todayStr
  );
  const completed = relevant.filter((w) => w.status === "completed").length;
  const total = relevant.length;

  return {
    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed,
    total,
  };
}

function getTopExercises(
  results: WorkoutResult[]
): { name: string; maxWeight: number; count: number }[] {
  const exerciseMap: Record<
    string,
    { maxWeight: number; count: number }
  > = {};

  for (const result of results) {
    const logged = result.logged_sets as LoggedExercise[];
    if (!Array.isArray(logged)) continue;

    for (const ex of logged) {
      if (!exerciseMap[ex.exercise_name]) {
        exerciseMap[ex.exercise_name] = { maxWeight: 0, count: 0 };
      }
      exerciseMap[ex.exercise_name].count++;
      for (const set of ex.sets ?? []) {
        if (set.weight && set.weight > exerciseMap[ex.exercise_name].maxWeight) {
          exerciseMap[ex.exercise_name].maxWeight = set.weight;
        }
      }
    }
  }

  return Object.entries(exerciseMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function ComplianceRing({
  rate,
  label,
  completed,
  total,
  color,
  size = 90,
}: {
  rate: number;
  label: string;
  completed: number;
  total: number;
  color: string;
  size?: number;
}) {
  const theme = useTheme();

  return (
    <View style={styles.ringContainer}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.surfaceVariant,
            borderWidth: 6,
          },
        ]}
      >
        {rate > 0 && (
          <View
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 6,
              borderColor: "transparent",
              borderTopColor: color,
              borderRightColor: rate > 25 ? color : "transparent",
              borderBottomColor: rate > 50 ? color : "transparent",
              borderLeftColor: rate > 75 ? color : "transparent",
              transform: [{ rotate: "-90deg" }],
            }}
          />
        )}
        <View
          style={[
            styles.ringInner,
            {
              width: size - 12,
              height: size - 12,
              borderRadius: (size - 12) / 2,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text
            variant="titleLarge"
            style={{ color, fontWeight: "800" }}
          >
            {rate}%
          </Text>
        </View>
      </View>
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 8 }}
      >
        {label}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {completed}/{total}
      </Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id);

  const {
    data: workouts = [],
    isLoading: workoutsLoading,
    isError: workoutsError,
    refetch: refetchWorkouts,
    isRefetching: isRefetchingWorkouts,
  } = useClientWorkouts(userId ?? "");
  const {
    data: results = [],
    isLoading: resultsLoading,
    isError: resultsError,
    refetch: refetchResults,
    isRefetching: isRefetchingResults,
  } = useClientResults(userId ?? "");

  const compliance7 = useMemo(
    () => calculateCompliance(workouts, 7),
    [workouts]
  );
  const compliance30 = useMemo(
    () => calculateCompliance(workouts, 30),
    [workouts]
  );
  const compliance90 = useMemo(
    () => calculateCompliance(workouts, 90),
    [workouts]
  );

  const topExercises = useMemo(() => getTopExercises(results), [results]);

  const totalWorkoutsCompleted = workouts.filter(
    (w) => w.status === "completed"
  ).length;

  const streak = useMemo(() => computeStreak(workouts), [workouts]);

  if (workoutsLoading || resultsLoading) {
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

  if (workoutsError || resultsError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => { refetchWorkouts(); refetchResults(); }} />
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
            refreshing={isRefetchingWorkouts || isRefetchingResults}
            onRefresh={() => {
              refetchWorkouts();
              refetchResults();
            }}
          />
        }
      >
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("progress.title")}
        </Text>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="fire"
                size={24}
                color="#F59E0B"
              />
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, fontWeight: "800" }}
              >
                {streak}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("progress.dayStreak")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#22C55E"
              />
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, fontWeight: "800" }}
              >
                {totalWorkoutsCompleted}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("progress.completed")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={24}
                color={theme.colors.primary}
              />
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, fontWeight: "800" }}
              >
                {workouts.length}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("progress.total")}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          {t("progress.compliance")}
        </Text>

        <Card style={[styles.complianceCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.complianceContent}>
            <ComplianceRing
              rate={compliance7.rate}
              label={t("progress.days7")}
              completed={compliance7.completed}
              total={compliance7.total}
              color="#22C55E"
            />
            <ComplianceRing
              rate={compliance30.rate}
              label={t("progress.days30")}
              completed={compliance30.completed}
              total={compliance30.total}
              color="#4F46E5"
            />
            <ComplianceRing
              rate={compliance90.rate}
              label={t("progress.days90")}
              completed={compliance90.completed}
              total={compliance90.total}
              color="#F59E0B"
            />
          </Card.Content>
        </Card>

        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          {t("progress.topExercises")}
        </Text>

        {topExercises.length === 0 ? (
          <Card style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content style={styles.emptyState}>
              <MaterialCommunityIcons
                name="chart-line"
                size={32}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                {t("progress.emptyMessage")}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          topExercises.map((ex) => (
            <Card
              key={ex.name}
              style={[styles.exerciseRow, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.exerciseRowContent}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                  >
                    {ex.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                  >
                    {t(ex.count === 1 ? "progress.sessions_one" : "progress.sessions_other", { count: ex.count })}
                  </Text>
                </View>
                {ex.maxWeight > 0 && (
                  <View style={styles.prBadge}>
                    <Text
                      variant="labelLarge"
                      style={{ color: theme.colors.primary, fontWeight: "800" }}
                    >
                      {ex.maxWeight}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {t("progress.prLbs")}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 16 },
  complianceCard: { borderRadius: 16, elevation: 0 },
  complianceContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  ringContainer: { alignItems: "center" },
  ring: { justifyContent: "center", alignItems: "center" },
  ringInner: { justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  exerciseRow: { borderRadius: 14, elevation: 0, marginBottom: 8 },
  exerciseRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  prBadge: { alignItems: "center" },
});
