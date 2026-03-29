import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput as RNTextInput,
  Modal,
  FlatList,
} from "react-native";
import {
  Text,
  useTheme,
  TextInput,
  Card,
  IconButton,
  Avatar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { useCreateTemplate, useAssignWorkout } from "@/lib/queries/workouts";
import { useCoachClients } from "@/lib/queries/clients";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";
import { formatDate } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { ExerciseSet } from "@/types/database";

function SetRow({
  exerciseIndex,
  setIndex,
  set,
}: {
  exerciseIndex: number;
  setIndex: number;
  set: ExerciseSet;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { updateSet, removeSet } = useWorkoutBuilderStore();

  return (
    <View style={styles.setRow}>
      <View
        style={[
          styles.setNumber,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary, fontWeight: "700" }}
        >
          {set.set_number}
        </Text>
      </View>

      <View style={styles.setField}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("library.repsLabel")}
        </Text>
        <RNTextInput
          value={set.reps?.toString() ?? ""}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            updateSet(exerciseIndex, setIndex, {
              reps: v === "" ? null : Number.isNaN(n) ? set.reps : n,
            });
          }}
          keyboardType="numeric"
          style={[
            styles.setInput,
            {
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.background,
            },
          ]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          placeholder="—"
        />
      </View>

      <View style={styles.setField}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("library.weightLabel")}
        </Text>
        <RNTextInput
          value={set.weight?.toString() ?? ""}
          onChangeText={(v) => {
            const n = parseFloat(v);
            updateSet(exerciseIndex, setIndex, {
              weight: v === "" ? null : Number.isNaN(n) ? set.weight : n,
            });
          }}
          keyboardType="decimal-pad"
          style={[
            styles.setInput,
            {
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.background,
            },
          ]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          placeholder="—"
        />
      </View>

      <View style={styles.setField}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("library.restLabel")}
        </Text>
        <RNTextInput
          value={set.rest_seconds?.toString() ?? ""}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            updateSet(exerciseIndex, setIndex, {
              rest_seconds: v === "" ? null : Number.isNaN(n) ? set.rest_seconds : n,
            });
          }}
          keyboardType="numeric"
          style={[
            styles.setInput,
            {
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.background,
            },
          ]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          placeholder="60"
        />
      </View>

      <IconButton
        icon="close"
        size={16}
        onPress={() => removeSet(exerciseIndex, setIndex)}
        iconColor={theme.colors.error}
      />
    </View>
  );
}

function ExerciseBlock({ exerciseIndex }: { exerciseIndex: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const exercise = useWorkoutBuilderStore((s) => s.exercises[exerciseIndex]);
  const { removeExercise, addSet, updateExerciseNotes, moveExercise } =
    useWorkoutBuilderStore();
  const totalExercises = useWorkoutBuilderStore((s) => s.exercises.length);

  if (!exercise) return null;

  return (
    <Card
      style={[styles.exerciseBlock, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseTitleRow}>
            <View
              style={[
                styles.orderBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.orderText, { color: theme.colors.onPrimary }]}>
                {exerciseIndex + 1}
              </Text>
            </View>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}
              numberOfLines={1}
            >
              {exercise.exercise_name}
            </Text>
          </View>
          <View style={styles.exerciseActions}>
            {exerciseIndex > 0 && (
              <IconButton
                icon="arrow-up"
                size={18}
                onPress={() => moveExercise(exerciseIndex, exerciseIndex - 1)}
              />
            )}
            {exerciseIndex < totalExercises - 1 && (
              <IconButton
                icon="arrow-down"
                size={18}
                onPress={() => moveExercise(exerciseIndex, exerciseIndex + 1)}
              />
            )}
            <IconButton
              icon="delete-outline"
              size={18}
              iconColor={theme.colors.error}
              onPress={() => removeExercise(exerciseIndex)}
            />
          </View>
        </View>

        <View style={styles.setsContainer}>
          {exercise.sets.map((set, setIdx) => (
            <SetRow
              key={setIdx}
              exerciseIndex={exerciseIndex}
              setIndex={setIdx}
              set={set}
            />
          ))}
        </View>

        <Pressable
          style={[styles.addSetButton, { borderColor: theme.colors.outline }]}
          onPress={() => addSet(exerciseIndex)}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary, marginLeft: 4 }}
          >
            {t("library.addSet")}
          </Text>
        </Pressable>

        <TextInput
          mode="flat"
          placeholder={t("library.notesPlaceholder")}
          value={exercise.notes ?? ""}
          onChangeText={(v) => updateExerciseNotes(exerciseIndex, v)}
          style={[styles.notesInput, { backgroundColor: theme.colors.background }]}
          dense
          multiline
        />
      </Card.Content>
    </Card>
  );
}

export default function WorkoutBuilderScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const createTemplate = useCreateTemplate();
  const assignWorkout = useAssignWorkout();
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError, refetch: refetchClients } = useCoachClients(userId ?? "");
  const { name, description, exercises, setName, setDescription, reset } =
    useWorkoutBuilderStore();
  const [showClientPicker, setShowClientPicker] = useState(false);

  async function handleSaveTemplate() {
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("library.enterWorkoutName"));
      return;
    }
    if (exercises.length === 0) {
      Alert.alert(t("common.required"), t("library.addAtLeastOneExercise"));
      return;
    }
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    try {
      await createTemplate.mutateAsync({
        coach_id: userId,
        name: name.trim(),
        description: description.trim() || undefined,
        exercises,
      });
      reset();
      router.back();
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("library.failedSaveTemplate"));
    }
  }

  async function handleAssignToClient(clientId: string, clientName: string) {
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("library.enterWorkoutName"));
      return;
    }
    if (exercises.length === 0) {
      Alert.alert(t("common.required"), t("library.addAtLeastOneExercise"));
      return;
    }
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    try {
      await assignWorkout.mutateAsync({
        coach_id: userId,
        client_id: clientId,
        name: name.trim(),
        scheduled_date: formatDate(new Date()),
        exercises,
      });
      setShowClientPicker(false);
      reset();
      Alert.alert(t("library.assignedTitle"), t("library.assignedMessage", { name: clientName }), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      setShowClientPicker(false);
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("library.failedAssignWorkout"));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (exercises.length > 0) {
              Alert.alert(t("library.discardTitle"), t("library.discardMessage"), [
                { text: t("library.keepEditing"), style: "cancel" },
                {
                  text: t("library.discard"),
                  style: "destructive",
                  onPress: () => {
                    reset();
                    router.back();
                  },
                },
              ]);
            } else {
              router.back();
            }
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("library.workoutBuilder")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          mode="outlined"
          label={t("library.workoutNameLabel")}
          value={name}
          onChangeText={setName}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <TextInput
          mode="outlined"
          label={t("library.descriptionLabel")}
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <View style={styles.exercisesHeader}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("library.exercisesLabel")} ({exercises.length})
          </Text>
        </View>

        {exercises.map((ex, index) => (
          <ExerciseBlock key={`${ex.exercise_id}-${index}`} exerciseIndex={index} />
        ))}

        <Pressable
          style={[
            styles.addExerciseButton,
            {
              borderColor: theme.colors.primary,
              backgroundColor: `${theme.colors.primary}08`,
            },
          ]}
          onPress={() => router.push("/(coach)/library/pick-exercise")}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={24}
            color={theme.colors.primary}
          />
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.primary, marginLeft: 8, fontWeight: "600" }}
          >
            {t("library.addExercise")}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <AuthButton
            onPress={() => {
              if (!name.trim()) {
                Alert.alert(t("common.required"), t("library.enterWorkoutName"));
                return;
              }
              if (exercises.length === 0) {
                Alert.alert(t("common.required"), t("library.addAtLeastOneExercise"));
                return;
              }
              if (clientsError) {
                refetchClients();
                Alert.alert(t("common.error"), t("common.errorGeneric"));
                return;
              }
              if (!clientsLoading && clients.length === 0) {
                Alert.alert(t("library.noClientsTitle"), t("library.noClientsMessage"));
                return;
              }
              setShowClientPicker(true);
            }}
            loading={assignWorkout.isPending || clientsLoading}
            disabled={assignWorkout.isPending || clientsLoading}
          >
            {t("library.assignToClient")}
          </AuthButton>
          <AuthButton
            variant="secondary"
            onPress={handleSaveTemplate}
            loading={createTemplate.isPending}
            disabled={createTemplate.isPending}
          >
            {t("library.saveAsTemplate")}
          </AuthButton>
        </View>
      </ScrollView>

      <Modal
        visible={showClientPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowClientPicker(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: (theme as AppTheme).custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                {t("library.selectClient")}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowClientPicker(false)}
              />
            </View>
            <FlatList
              data={clients.filter((c) => c.status === "active")}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const profile = item.profile;
                const initials = profile?.full_name
                  ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                  : "?";
                return (
                  <Pressable
                    style={[styles.clientPickerRow, { borderBottomColor: theme.colors.outline }]}
                    onPress={() => handleAssignToClient(item.client_id, profile?.full_name ?? t("dashboard.fallbackClient"))}
                  >
                    <Avatar.Text
                      size={40}
                      label={initials}
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      labelStyle={{ color: theme.colors.primary }}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                        {profile?.full_name ?? t("clients.unknown")}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {profile?.email ?? ""}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t("library.noActiveClients")}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
  },
  outline: {
    borderRadius: 12,
  },
  exercisesHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  exerciseBlock: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 0,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  orderText: {
    fontWeight: "700",
    fontSize: 13,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  setsContainer: {
    gap: 6,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  setField: {
    flex: 1,
    gap: 2,
  },
  setInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: "center",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    marginTop: 10,
  },
  notesInput: {
    marginTop: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
});
