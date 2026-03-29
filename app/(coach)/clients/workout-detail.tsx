import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text, useTheme, Card, Chip, Avatar, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWorkoutById } from "@/lib/queries/workouts";
import { useWorkoutResult } from "@/lib/queries/results";
import { useExercisesByIds } from "@/lib/queries/exercises";
import { ErrorState } from "@/components/ErrorState";
import { safeDateTimeString } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { WorkoutExercise, LoggedExercise } from "@/types/database";

export default function CoachWorkoutDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { workoutId, clientName } = useLocalSearchParams<{
    workoutId: string;
    clientName: string;
  }>();

  const { data: workout, isLoading: loadingWorkout, isError: workoutError, refetch: refetchWorkout, isRefetching } = useWorkoutById(workoutId ?? "");
  const { data: result, isError: resultError, refetch: refetchResult } = useWorkoutResult(workoutId ?? "");

  const exerciseIds = useMemo(
    () => (workout?.exercises ?? []).map((e) => e.exercise_id),
    [workout]
  );
  const { data: exerciseDetails = [], isError: exercisesError, refetch: refetchExercises } = useExercisesByIds(exerciseIds);

  const isError = workoutError || resultError || exercisesError;
  const refetch = () => { refetchWorkout(); refetchResult(); refetchExercises(); };
  const exerciseMap = useMemo(() => {
    const map: Record<string, (typeof exerciseDetails)[0]> = {};
    for (const e of exerciseDetails) map[e.id] = e;
    return map;
  }, [exerciseDetails]);

  const loggedMap = useMemo(() => {
    if (!result?.logged_sets || !Array.isArray(result.logged_sets)) return {};
    const map: Record<string, LoggedExercise> = {};
    for (const le of result.logged_sets as LoggedExercise[]) {
      map[le.exercise_id] = le;
    }
    return map;
  }, [result]);

  const status = useMemo(() => {
    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
      completed: { label: t("clients.statusCompleted"), color: theme.colors.secondary, icon: "check-circle" },
      pending: { label: t("clients.statusPending"), color: theme.custom.warning, icon: "clock-outline" },
      missed: { label: t("clients.statusMissed"), color: theme.colors.error, icon: "close-circle-outline" },
      partial: { label: t("clients.statusPartial"), color: theme.custom.info, icon: "circle-half-full" },
    };
    return statusConfig[workout?.status ?? "pending"] ?? statusConfig.pending;
  }, [t, theme, workout?.status]);

  if (loadingWorkout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
          </Pressable>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
            {t("clients.workoutDetail")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
          </Pressable>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
            {t("clients.workoutDetail")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1, marginLeft: 12 }}
          numberOfLines={1}
        >
          {workout.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {clientName && (
          <Pressable
            style={[styles.clientChip, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() =>
              router.push({
                pathname: "/(coach)/clients/client-profile",
                params: {
                  clientId: workout.client_id,
                  clientName,
                  clientEmail: "",
                  clientStatus: "active",
                  relationshipId: "",
                },
              } as any)
            }
          >
            <MaterialCommunityIcons name="account" size={18} color={theme.colors.primary} />
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}
            >
              {clientName}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </Pressable>
        )}

        <View style={styles.summaryRow}>
          <Chip
            icon={() => (
              <MaterialCommunityIcons name={status.icon as any} size={16} color={status.color} />
            )}
            style={[styles.statusChip, { backgroundColor: `${status.color}15` }]}
            textStyle={{ color: status.color, fontWeight: "700" }}
          >
            {status.label}
          </Chip>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {workout.scheduled_date}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("clients.exerciseCount", { count: workout.exercises.length })}
          </Text>
        </View>

        {result && (
          <Card style={[styles.resultSummary, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={theme.colors.primary} />
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 8 }}
                >
                  {t("clients.clientResults")}
                </Text>
              </View>
              {result.notes && (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, fontStyle: "italic" }}
                >
                  "{result.notes}"
                </Text>
              )}
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                {t("clients.completedAt")} {safeDateTimeString(result.completed_at, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </Card.Content>
          </Card>
        )}

        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16, marginBottom: 12 }}
        >
          {t("clients.exercises")}
        </Text>

        {workout.exercises.map((exercise, idx) => {
          const detail = exerciseMap[exercise.exercise_id];
          const logged = loggedMap[exercise.exercise_id];

          return (
            <ExerciseResultCard
              key={`ex-${idx}`}
              exercise={exercise}
              detail={detail}
              logged={logged}
              index={idx}
              theme={theme}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseResultCard({
  exercise,
  detail,
  logged,
  index,
  theme,
}: {
  exercise: WorkoutExercise;
  detail: any;
  logged?: LoggedExercise;
  index: number;
  theme: any;
}) {
  const { t } = useTranslation();
  return (
    <Card style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <View style={[styles.orderBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.orderText, { color: theme.colors.onPrimary }]}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
              numberOfLines={1}
            >
              {exercise.exercise_name}
            </Text>
            {detail?.muscle_group && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}
              >
                {detail.muscle_group}{detail.equipment ? ` · ${detail.equipment}` : ""}
              </Text>
            )}
          </View>
          {logged && (
            <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.secondary} />
          )}
        </View>

        <View style={styles.setsTable}>
          <View style={[styles.setsHeaderRow, { borderBottomColor: theme.colors.outline }]}>
            <Text variant="labelSmall" style={[styles.setCol, { color: theme.colors.onSurfaceVariant }]}>
              {t("clients.setColumn")}
            </Text>
            <Text variant="labelSmall" style={[styles.setCol, { color: theme.colors.onSurfaceVariant }]}>
              {t("clients.prescribed")}
            </Text>
            {logged && (
              <Text variant="labelSmall" style={[styles.setCol, { color: theme.colors.onSurfaceVariant }]}>
                {t("clients.logged")}
              </Text>
            )}
          </View>

          {exercise.sets.map((set, si) => {
            const loggedSet = logged?.sets?.[si];
            return (
              <View key={si} style={styles.setsDataRow}>
                <Text variant="bodySmall" style={[styles.setCol, { color: theme.colors.onSurface, fontWeight: "600" }]}>
                  {set.set_number}
                </Text>
                <Text variant="bodySmall" style={[styles.setCol, { color: theme.colors.onSurface }]}>
                  {set.reps ?? "—"} {t("clients.reps")}{set.weight ? ` × ${set.weight} ${t("clients.lbs")}` : ""}
                </Text>
                {logged && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.setCol,
                      {
                        color: loggedSet?.completed ? theme.colors.secondary : theme.colors.onSurfaceVariant,
                        fontWeight: loggedSet?.completed ? "700" : "400",
                      },
                    ]}
                  >
                    {loggedSet
                      ? `${loggedSet.reps ?? "—"} × ${loggedSet.weight ?? "—"}`
                      : "—"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {exercise.notes && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, fontStyle: "italic" }}
          >
            {t("clients.notePrefix")} {exercise.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: { padding: 16, paddingBottom: 32 },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  clientChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  statusChip: { borderRadius: 16 },
  resultSummary: { borderRadius: 16, elevation: 0 },
  resultHeader: { flexDirection: "row", alignItems: "center" },
  exerciseCard: { borderRadius: 14, elevation: 0, marginBottom: 10 },
  exerciseHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  orderText: { fontWeight: "700", fontSize: 13 },
  setsTable: { gap: 4 },
  setsHeaderRow: { flexDirection: "row", paddingBottom: 4, borderBottomWidth: 0.5 },
  setsDataRow: { flexDirection: "row", paddingVertical: 4 },
  setCol: { flex: 1 },
});
