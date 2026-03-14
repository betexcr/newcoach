import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  FAB,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProgramWorkouts, useCreateProgramWorkout } from "@/lib/queries/programs";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { AuthButton } from "@/components/AuthButton";
import type { ProgramWorkout } from "@/types/database";

export default function ProgramDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { programId, programName } = useLocalSearchParams<{
    programId: string;
    programName: string;
  }>();

  const { data: workouts = [], isLoading } = useProgramWorkouts(programId ?? "");
  const createWorkout = useCreateProgramWorkout();

  const [addingWorkout, setAddingWorkout] = useState(false);
  const [newName, setNewName] = useState("");
  const [weekNum, setWeekNum] = useState("1");
  const [dayNum, setDayNum] = useState("1");

  const byWeek = useMemo(() => {
    const map: Record<number, ProgramWorkout[]> = {};
    for (const w of workouts) {
      if (!map[w.week_number]) map[w.week_number] = [];
      map[w.week_number].push(w);
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([week, items]) => ({
        week: Number(week),
        items: items.sort((a, b) => a.day_number - b.day_number),
      }));
  }, [workouts]);

  async function handleAddWorkout() {
    if (!newName.trim()) {
      Alert.alert(t("common.required"), t("programs.enterWorkoutName"));
      return;
    }
    if (!programId) return;

    const builderExercises = useWorkoutBuilderStore.getState().exercises;

    try {
      await createWorkout.mutateAsync({
        program_id: programId,
        week_number: parseInt(weekNum, 10) || 1,
        day_number: parseInt(dayNum, 10) || 1,
        name: newName.trim(),
        exercises: builderExercises,
      });
      setNewName("");
      setAddingWorkout(false);
      useWorkoutBuilderStore.getState().reset();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }} numberOfLines={1}>
            {programName ?? t("programs.title")}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {workouts.length} {t("programs.workoutsCount")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : byWeek.length === 0 && !addingWorkout ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}>
              {t("programs.noWorkoutsInProgram")}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8 }}>
              {t("programs.addWorkoutsMessage")}
            </Text>
          </View>
        ) : (
          byWeek.map(({ week, items }) => (
            <View key={week} style={styles.weekSection}>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "700", marginBottom: 8 }}>
                {t("programs.weekLabel", { week })}
              </Text>
              {items.map((w) => (
                <Card key={w.id} style={[styles.workoutCard, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content style={styles.workoutContent}>
                    <View style={[styles.dayBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                      <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 12 }}>
                        {t("programs.dayLabel", { day: w.day_number })}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                        {w.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {w.exercises?.length ?? 0} {t("clients.exercises").toLowerCase()}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))
        )}

        {addingWorkout && (
          <View style={[styles.addForm, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
              {t("programs.addWorkout")}
            </Text>
            <TextInput
              mode="outlined"
              label={t("programs.workoutName")}
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
              outlineStyle={{ borderRadius: 12 }}
            />
            <View style={styles.rowInputs}>
              <TextInput
                mode="outlined"
                label={t("programs.week")}
                value={weekNum}
                onChangeText={setWeekNum}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                outlineStyle={{ borderRadius: 12 }}
              />
              <TextInput
                mode="outlined"
                label={t("programs.day")}
                value={dayNum}
                onChangeText={setDayNum}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                outlineStyle={{ borderRadius: 12 }}
              />
            </View>

            <Pressable
              style={[styles.addExerciseBtn, { borderColor: theme.colors.primary }]}
              onPress={() => router.push("/(coach)/library/pick-exercise" as any)}
            >
              <MaterialCommunityIcons name="plus-circle" size={20} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}>
                {t("programs.addExercises")}
              </Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <AuthButton
                onPress={() => {
                  setAddingWorkout(false);
                  useWorkoutBuilderStore.getState().reset();
                }}
                style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
              >
                {t("common.cancel")}
              </AuthButton>
              <AuthButton
                onPress={handleAddWorkout}
                loading={createWorkout.isPending}
                disabled={createWorkout.isPending || !newName.trim()}
                style={{ flex: 1 }}
              >
                {t("common.save")}
              </AuthButton>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!addingWorkout && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="#FFFFFF"
          onPress={() => {
            useWorkoutBuilderStore.getState().reset();
            setAddingWorkout(true);
          }}
          label={t("programs.addWorkout")}
        />
      )}
    </SafeAreaView>
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
  loadingContainer: { paddingVertical: 40, alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 64 },
  weekSection: { marginBottom: 20 },
  workoutCard: { borderRadius: 14, elevation: 0, marginBottom: 8 },
  workoutContent: { flexDirection: "row", alignItems: "center" },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addForm: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  input: { marginBottom: 12 },
  rowInputs: { flexDirection: "row", gap: 12 },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
