import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput as RNTextInput,
  Image,
  useWindowDimensions,
} from "react-native";
import { Text, useTheme, Card, Button, ProgressBar, Chip, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { useWorkoutById, useUpdateWorkoutStatus } from "@/lib/queries/workouts";
import { useSaveResult, useWorkoutResult } from "@/lib/queries/results";
import { useExercisesByIds } from "@/lib/queries/exercises";
import { ErrorState } from "@/components/ErrorState";
import { AuthButton } from "@/components/AuthButton";
import type {
  LoggedExercise,
  LoggedSet,
  AssignedWorkout,
  WorkoutExercise,
  Exercise,
} from "@/types/database";
import type { AppTheme } from "@/lib/theme";

type ScreenMode = "detail" | "execution" | "results";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  const { data: workout, isLoading: workoutsLoading, isError, refetch } = useWorkoutById(id ?? "", !!userId);

  const exerciseIds = useMemo(
    () => (workout?.exercises ?? []).map((ex) => ex.exercise_id),
    [workout]
  );
  const { data: exerciseDetails = [], isLoading: exercisesLoading, isError: exercisesError, refetch: refetchExercises } = useExercisesByIds(exerciseIds);

  const exerciseMap = useMemo(() => {
    const map: Record<string, Exercise> = {};
    for (const ex of exerciseDetails) map[ex.id] = ex;
    return map;
  }, [exerciseDetails]);

  const { data: savedResult, isLoading: resultLoading, isError: resultError, refetch: refetchResult } = useWorkoutResult(id ?? "", !!userId);
  const [mode, setMode] = useState<ScreenMode>("detail");
  const [currentStep, setCurrentStep] = useState(0);

  const saveResult = useSaveResult();
  const updateStatus = useUpdateWorkoutStatus();

  const { width: screenWidth } = useWindowDimensions();
  const [loggedData, setLoggedData] = useState<Record<string, LoggedSet[]>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMode("detail");
    setCurrentStep(0);
    setLoggedData({});
    setNotes("");
  }, [id]);

  function initializeSets(exercise: WorkoutExercise): LoggedSet[] {
    return (exercise.sets ?? []).map((s) => ({
      set_number: s.set_number,
      reps: s.reps,
      weight: s.weight,
      duration_seconds: s.duration_seconds,
      rpe: null,
      completed: false,
    }));
  }

  function getExerciseSets(exercise: WorkoutExercise): LoggedSet[] {
    return loggedData[exercise.exercise_id] ?? initializeSets(exercise);
  }

  function updateSetLog(
    exerciseId: string,
    setIndex: number,
    updates: Partial<LoggedSet>,
    exercise: WorkoutExercise
  ) {
    setLoggedData((prev) => {
      const current = prev[exerciseId] ?? initializeSets(exercise);
      const updated = current.map((s, i) =>
        i === setIndex ? { ...s, ...updates } : s
      );
      return { ...prev, [exerciseId]: updated };
    });
  }

  async function handleFinish() {
    if (!workout || !userId) return;

    const logged: LoggedExercise[] = workout.exercises.map((ex) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      sets: getExerciseSets(ex),
    }));

    try {
      const result = await saveResult.mutateAsync({
        assigned_workout_id: workout.id,
        client_id: userId,
        logged_sets: logged,
        notes: notes.trim() || undefined,
      });
      try {
        await updateStatus.mutateAsync({ id: workout.id, status: "completed" });
      } catch (statusErr) {
        await supabase.from("workout_results").delete().eq("id", result.id);
        throw statusErr;
      }
      Alert.alert(t("workout.completeTitle"), t("workout.completeMessage"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("workout.failedSave"));
    }
  }

  if (!isInitialized || workoutsLoading || exercisesLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || exercisesError || !workout) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ErrorState
          message={isError || exercisesError ? undefined : t("workout.notFound")}
          onRetry={() => { refetch(); refetchExercises(); }}
        />
      </SafeAreaView>
    );
  }

  if (mode === "results") {
    if (resultLoading) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      );
    }
    if (resultError || !savedResult) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ErrorState onRetry={() => { refetchResult(); }} />
        </SafeAreaView>
      );
    }
    return (
      <ResultsView
        workout={workout}
        result={savedResult}
        exerciseMap={exerciseMap}
        onBack={() => setMode("detail")}
        onRedo={() => {
          setCurrentStep(0);
          setMode("execution");
        }}
        theme={theme}
        t={t}
      />
    );
  }

  if (mode === "execution") {
    return (
      <ExecutionView
        workout={workout}
        exerciseMap={exerciseMap}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        loggedData={loggedData}
        getExerciseSets={getExerciseSets}
        updateSetLog={updateSetLog}
        notes={notes}
        setNotes={setNotes}
        onFinish={handleFinish}
        onBack={() => setMode("detail")}
        saving={saveResult.isPending || updateStatus.isPending}
        screenWidth={screenWidth}
        theme={theme}
        t={t}
      />
    );
  }

  return (
    <DetailView
      workout={workout}
      exerciseMap={exerciseMap}
      hasResult={!!savedResult}
      onStartWorkout={() => {
        setCurrentStep(0);
        setMode("execution");
      }}
      onViewResults={() => setMode("results")}
      onBack={() => router.back()}
      theme={theme}
      t={t}
    />
  );
}

function DetailView({
  workout,
  exerciseMap,
  hasResult,
  onStartWorkout,
  onViewResults,
  onBack,
  theme,
  t,
}: {
  workout: AssignedWorkout;
  exerciseMap: Record<string, Exercise>;
  hasResult: boolean;
  onStartWorkout: () => void;
  onViewResults: () => void;
  onBack: () => void;
  theme: AppTheme;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const exerciseCount = workout.exercises?.length ?? 0;
  const totalSets =
    workout.exercises?.reduce((s, ex) => s + (ex.sets?.length ?? 0), 0) ?? 0;
  const isCompleted = workout.status === "completed";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            numberOfLines={1}
          >
            {workout.name}
          </Text>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.secondary} />
            <Text style={{ color: theme.colors.secondary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>
              {t("workout.done")}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="dumbbell" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>
              {t("workout.exercisesCount", { count: exerciseCount })}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="repeat" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>
              {t("workout.setsCount", { count: totalSets })}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 4 }}>
              {t("workout.estimatedMinutes", { count: Math.max(20, exerciseCount * 8) })}
            </Text>
          </View>
        </View>

        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12, marginTop: 8 }}
        >
          {t("workout.exercises")}
        </Text>

        {workout.exercises.map((exercise, idx) => {
          const detail = exerciseMap[exercise.exercise_id];
          return (
            <ExerciseDetailCard
              key={`${exercise.exercise_id}-${idx}`}
              exercise={exercise}
              detail={detail}
              index={idx}
              theme={theme}
              t={t}
            />
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background }]}>
        {isCompleted && hasResult ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              mode="contained"
              onPress={onViewResults}
              style={[styles.startButton, { flex: 1 }]}
              contentStyle={{ paddingVertical: 8 }}
              labelStyle={{ fontSize: 15, fontWeight: "700" }}
              icon="chart-bar"
            >
              {t("workout.viewResults")}
            </Button>
            <Button
              mode="outlined"
              onPress={onStartWorkout}
              style={[styles.startButton, { flex: 1 }]}
              contentStyle={{ paddingVertical: 8 }}
              labelStyle={{ fontSize: 15, fontWeight: "700" }}
              icon="refresh"
            >
              {t("workout.redo")}
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={onStartWorkout}
            style={styles.startButton}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontSize: 16, fontWeight: "700" }}
            icon="play"
            disabled={exerciseCount === 0}
          >
            {t("workout.startWorkout")}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function ExerciseDetailCard({
  exercise,
  detail,
  index,
  theme,
  t,
}: {
  exercise: WorkoutExercise;
  detail?: Exercise;
  index: number;
  theme: AppTheme;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      style={[styles.exerciseDetailCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.exerciseCardRow}>
        {detail?.thumbnail_url ? (
          <Image
            source={{ uri: detail.thumbnail_url }}
            style={styles.exerciseThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.exerciseThumbnail,
              styles.placeholderThumb,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        )}

        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseNameRow}>
            <View
              style={[styles.orderBadge, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.orderText, { color: theme.colors.onPrimary }]}>{index + 1}</Text>
            </View>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}
              numberOfLines={2}
            >
              {exercise.exercise_name}
            </Text>
          </View>

          <View style={styles.exerciseMeta}>
            {detail?.muscle_group && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.primary, textTransform: "capitalize" }}
              >
                {detail.muscle_group}
              </Text>
            )}
            {detail?.equipment && (
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  · {detail.equipment}
              </Text>
            )}
          </View>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
          >
            {(exercise.sets ?? []).length} {t("workout.sets")} ·{" "}
            {(exercise.sets ?? [])[0]?.reps
              ? `${(exercise.sets ?? [])[0].reps} ${t("workout.repsUnit")}`
              : (exercise.sets ?? [])[0]?.duration_seconds
                ? `${(exercise.sets ?? [])[0].duration_seconds}s`
                : t("common.dash")}
            {(exercise.sets ?? [])[0]?.weight
              ? ` @ ${(exercise.sets ?? [])[0].weight} ${t("workout.lbs")}`
              : ""}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: theme.colors.outline }]}>
          {detail?.description ? (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface, lineHeight: 22, marginBottom: 12 }}
            >
              {detail.description}
            </Text>
          ) : (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginBottom: 12 }}
            >
              {t("workout.noDescription")}
            </Text>
          )}

          {exercise.notes && (
            <View style={[styles.coachNote, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={14}
                color={theme.colors.primary}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.primary, marginLeft: 6, flex: 1 }}
              >
                {t("workout.coachNote", { notes: exercise.notes })}
              </Text>
            </View>
          )}

          <View style={styles.setTable}>
            <View style={styles.setTableHeader}>
              <Text style={[styles.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("workout.set")}</Text>
              <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>{t("workout.reps")}</Text>
              <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>{t("workout.weight")}</Text>
              {(exercise.sets ?? [])[0]?.rest_seconds != null && (
                <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>{t("workout.rest")}</Text>
              )}
            </View>
            {(exercise.sets ?? []).map((set, sIdx) => (
              <View
                key={sIdx}
                style={[
                  styles.setTableRow,
                  { borderBottomColor: theme.colors.outlineVariant },
                ]}
              >
                <View style={[styles.setNumBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 12 }}>
                    {set.set_number}
                  </Text>
                </View>
                <Text style={[styles.setColWide, { color: theme.colors.onSurface }]}>
                  {set.reps ??
                    (set.duration_seconds ? `${set.duration_seconds}s` : t("common.dash"))}
                </Text>
                <Text style={[styles.setColWide, { color: theme.colors.onSurface }]}>
                  {set.weight
                    ? `${set.weight} ${t("workout.lbs")}`
                    : t("common.dash")}
                </Text>
                {set.rest_seconds != null && (
                  <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>
                    {set.rest_seconds}s
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function ExecutionView({
  workout,
  exerciseMap,
  currentStep,
  setCurrentStep,
  loggedData,
  getExerciseSets,
  updateSetLog,
  notes,
  setNotes,
  onFinish,
  onBack,
  saving,
  screenWidth,
  theme,
  t,
}: {
  workout: AssignedWorkout;
  exerciseMap: Record<string, Exercise>;
  currentStep: number;
  setCurrentStep: (n: number) => void;
  loggedData: Record<string, LoggedSet[]>;
  getExerciseSets: (ex: WorkoutExercise) => LoggedSet[];
  updateSetLog: (
    exerciseId: string,
    setIndex: number,
    updates: Partial<LoggedSet>,
    exercise: WorkoutExercise
  ) => void;
  notes: string;
  setNotes: (n: string) => void;
  onFinish: () => void;
  onBack: () => void;
  saving: boolean;
  screenWidth: number;
  theme: AppTheme;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const exercises = workout.exercises;
  const total = exercises.length;
  const isLastStep = currentStep >= total;
  const exercise = exercises[currentStep];
  const detail = exercise ? exerciseMap[exercise.exercise_id] : undefined;
  const sets = exercise ? getExerciseSets(exercise) : [];
  const completedSets = sets.filter((s) => s.completed).length;

  const denom = Math.max(sets.length, 1);
  const progress = total > 0
    ? Math.min(1, Math.max(0, (currentStep + (exercise ? completedSets / denom : 0)) / (total + 1)))
    : 0;

  if (total === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.execTopBar}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="dumbbell" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
            {t("workout.noExercisesInWorkout")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.execTopBar}>
        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
          onPress={() => {
            const hasLoggedSets = Object.keys(loggedData).length > 0;
            if (hasLoggedSets) {
              Alert.alert(
                t("workout.abandonTitle"),
                t("workout.abandonMessage"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("workout.abandonConfirm"),
                    style: "destructive",
                    onPress: onBack,
                  },
                ]
              );
            } else {
              onBack();
            }
          }}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={{ height: 6, borderRadius: 3 }}
          />
        </View>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {Math.min(currentStep + 1, total)}/{total}
        </Text>
      </View>

      {isLastStep ? (
        <ScrollView contentContainerStyle={styles.summaryContent} keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.finishIcon,
              { backgroundColor: theme.custom.warning + "20" },
            ]}
          >
            <MaterialCommunityIcons name="trophy" size={64} color={theme.custom.warning} />
          </View>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700", textAlign: "center", marginTop: 16 }}
          >
            {t("workout.greatWork")}
          </Text>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8 }}
          >
            {t("workout.completedAllMessage", { count: total })}
          </Text>

          <RNTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t("workout.notesPlaceholder")}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={4}
            style={[
              styles.notesInput,
              {
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              },
            ]}
          />

          <AuthButton onPress={onFinish} loading={saving} disabled={saving}>
            {t("workout.completeWorkout")}
          </AuthButton>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
          {detail?.thumbnail_url ? (
            <Image
              source={{ uri: detail.thumbnail_url }}
              style={[styles.exerciseHeroImage, { width: screenWidth }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.exerciseHeroImage,
                styles.heroPlaceholder,
                { width: screenWidth, backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={64}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          )}

          <View style={styles.stepBody}>
            <View style={styles.exerciseNameRow}>
              <View
                style={[styles.orderBadgeLarge, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 16 }}>
                  {currentStep + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="headlineSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                >
                  {exercise.exercise_name}
                </Text>
                {detail?.muscle_group && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text
                      variant="labelMedium"
                      style={{ color: theme.colors.primary, textTransform: "capitalize" }}
                    >
                      {detail.muscle_group}
                    </Text>
                    {detail?.equipment && (
                      <Text
                        variant="labelMedium"
                        style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
                      >
                        {detail.equipment}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {detail?.description && (
              <Card style={[styles.instructionCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary} />
                    <Text
                      variant="labelLarge"
                      style={{ color: theme.colors.primary, fontWeight: "700", marginLeft: 6 }}
                    >
                      {t("workout.howToPerform")}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, lineHeight: 22 }}
                  >
                    {detail.description}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {exercise.notes && (
              <View style={[styles.coachNote, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.primary, marginLeft: 6, flex: 1 }}
                >
                  {t("workout.coachNote", { notes: exercise.notes })}
                </Text>
              </View>
            )}

            <View style={styles.setsSection}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 8 }}
              >
                {t("workout.setsProgress", { completed: completedSets, total: sets.length })}
              </Text>

              <View style={styles.setHeaders}>
                <Text style={[styles.setHeaderLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {t("workout.set")}
                </Text>
                <Text
                  style={[
                    styles.setHeaderLabel,
                    { color: theme.colors.onSurfaceVariant, flex: 1, textAlign: "center" },
                  ]}
                >
                  {t("workout.reps")}
                </Text>
                <Text
                  style={[
                    styles.setHeaderLabel,
                    { color: theme.colors.onSurfaceVariant, flex: 1, textAlign: "center" },
                  ]}
                >
                  {t("workout.weight")}
                </Text>
                <Text
                  style={[
                    styles.setHeaderLabel,
                    { color: theme.colors.onSurfaceVariant, width: 40, textAlign: "center" },
                  ]}
                >
                  ✓
                </Text>
              </View>

              {sets.map((set, sIdx) => (
                <View
                  key={sIdx}
                  style={[
                    styles.setRow,
                    set.completed && { backgroundColor: theme.colors.primaryContainer + "40" },
                  ]}
                >
                  <View
                    style={[styles.setNum, { backgroundColor: theme.colors.primaryContainer }]}
                  >
                    <Text
                      style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 13 }}
                    >
                      {set.set_number}
                    </Text>
                  </View>
                  <RNTextInput
                    value={set.reps?.toString() ?? ""}
                    onChangeText={(v) =>
                      updateSetLog(
                        exercise.exercise_id,
                        sIdx,
                        { reps: v ? (Number.isNaN(parseInt(v, 10)) ? null : parseInt(v, 10)) : null },
                        exercise
                      )
                    }
                    keyboardType="numeric"
                    style={[
                      styles.logInput,
                      {
                        color: theme.colors.onSurface,
                        borderColor: set.completed
                          ? theme.colors.primary
                          : theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    placeholder="—"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <RNTextInput
                    value={set.weight?.toString() ?? ""}
                    onChangeText={(v) =>
                      updateSetLog(
                        exercise.exercise_id,
                        sIdx,
                        { weight: v ? (Number.isNaN(parseFloat(v)) ? null : parseFloat(v)) : null },
                        exercise
                      )
                    }
                    keyboardType="decimal-pad"
                    style={[
                      styles.logInput,
                      {
                        color: theme.colors.onSurface,
                        borderColor: set.completed
                          ? theme.colors.primary
                          : theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    placeholder="—"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <Pressable
                    style={[
                      styles.checkBox,
                      {
                        borderColor: set.completed
                          ? theme.colors.primary
                          : theme.colors.outline,
                        backgroundColor: set.completed
                          ? theme.colors.primary
                          : "transparent",
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: set.completed }}
                    accessibilityLabel={`${t("workout.set")} ${set.set_number}`}
                    onPress={() =>
                      updateSetLog(
                        exercise.exercise_id,
                        sIdx,
                        { completed: !set.completed },
                        exercise
                      )
                    }
                  >
                    {set.completed && (
                      <MaterialCommunityIcons name="check" size={16} color={theme.colors.onPrimary} />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {!isLastStep && (
        <View style={[styles.navBar, { backgroundColor: theme.colors.background }]}>
          <Pressable
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={[
              styles.navButton,
              {
                backgroundColor: theme.colors.surface,
                opacity: currentStep === 0 ? 0.4 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
              {t("workout.previous")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCurrentStep(currentStep + 1)}
            style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>
              {currentStep === total - 1 ? t("workout.finish") : t("workout.next")}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.onPrimary}
            />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function ResultsView({
  workout,
  result,
  exerciseMap,
  onBack,
  onRedo,
  theme,
  t,
}: {
  workout: AssignedWorkout;
  result: import("@/types/database").WorkoutResult;
  exerciseMap: Record<string, Exercise>;
  onBack: () => void;
  onRedo: () => void;
  theme: AppTheme;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const loggedExercises = Array.isArray(result.logged_sets) ? result.logged_sets : [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }} numberOfLines={1}>
            {t("workout.resultsTitle")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={[styles.resultsBanner, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.secondary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
              {workout.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {(() => {
                const d = new Date(result.completed_at);
                const dateStr = isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                });
                return t("workout.completedOn", { date: dateStr });
              })()}
            </Text>
          </View>
        </View>

        {result.notes && (
          <View style={[styles.coachNote, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="note-text" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8, flex: 1 }}>
              {result.notes}
            </Text>
          </View>
        )}

        {loggedExercises.map((ex, eIdx) => {
          const detail = exerciseMap[ex.exercise_id];
          return (
            <Card key={eIdx} style={[styles.exerciseDetailCard, { backgroundColor: theme.colors.surface }]}>
              <View style={{ padding: 14 }}>
                <View style={styles.exerciseNameRow}>
                  <View style={[styles.orderBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.orderText, { color: theme.colors.onPrimary }]}>{eIdx + 1}</Text>
                  </View>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}>
                    {ex.exercise_name}
                  </Text>
                </View>

                <View style={[styles.setTable, { marginTop: 10 }]}>
                  <View style={styles.setTableHeader}>
                    <Text style={[styles.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("workout.set")}</Text>
                    <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>{t("workout.reps")}</Text>
                    <Text style={[styles.setColWide, { color: theme.colors.onSurfaceVariant }]}>{t("workout.weight")}</Text>
                    <Text style={[{ width: 32, textAlign: "center", fontSize: 11 }, { color: theme.colors.onSurfaceVariant }]}>✓</Text>
                  </View>
                  {(ex.sets ?? []).map((set, sIdx) => (
                    <View
                      key={sIdx}
                      style={[
                        styles.setTableRow,
                        { borderBottomColor: theme.colors.outlineVariant },
                        set.completed && { backgroundColor: `${theme.colors.primary}10` },
                      ]}
                    >
                      <View style={[styles.setNumBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 12 }}>
                          {set.set_number}
                        </Text>
                      </View>
                      <Text style={[styles.setColWide, { color: theme.colors.onSurface, fontWeight: "600" }]}>
                        {set.reps ?? t("common.dash")}
                      </Text>
                      <Text style={[styles.setColWide, { color: theme.colors.onSurface, fontWeight: "600" }]}>
                        {set.weight
                          ? `${set.weight} ${t("workout.lbs")}`
                          : t("common.dash")}
                      </Text>
                      <View style={{ width: 32, alignItems: "center" }}>
                        <MaterialCommunityIcons
                          name={set.completed ? "check-circle" : "circle-outline"}
                          size={18}
                          color={set.completed ? theme.colors.secondary : theme.colors.onSurfaceVariant}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          );
        })}

        <Button
          mode="outlined"
          onPress={onRedo}
          style={{ borderRadius: 14, marginTop: 16 }}
          contentStyle={{ paddingVertical: 8 }}
          icon="refresh"
        >
          {t("workout.redo")}
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailContent: { padding: 16, paddingBottom: 100 },
  resultsBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseDetailCard: {
    borderRadius: 16,
    marginBottom: 10,
    elevation: 0,
    overflow: "hidden",
  },
  exerciseCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  exerciseThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  placeholderThumb: {
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBadgeLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  orderText: { fontWeight: "700", fontSize: 12 },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderTopWidth: 0.5,
    paddingTop: 12,
  },
  coachNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  setTable: { marginTop: 4 },
  setTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
    gap: 8,
  },
  setCol: { width: 32, fontSize: 11, fontWeight: "600", textAlign: "center" },
  setColWide: { flex: 1, fontSize: 13, textAlign: "center" },
  setTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  setNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  startButton: {
    borderRadius: 14,
  },

  // Execution view
  execTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stepContent: { paddingBottom: 100 },
  exerciseHeroImage: {
    height: 220,
  },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  stepBody: {
    padding: 16,
  },
  instructionCard: {
    borderRadius: 14,
    elevation: 0,
    marginTop: 16,
    marginBottom: 12,
  },
  setsSection: {
    marginTop: 16,
  },
  setHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
    gap: 6,
  },
  setHeaderLabel: { fontSize: 11, fontWeight: "600", width: 32, textAlign: "center" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  setNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 4,
  },
  summaryContent: {
    padding: 24,
    alignItems: "center",
  },
  finishIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  notesInput: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
});
