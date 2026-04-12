import { useState, useMemo } from "react";
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
  Animated,
} from "react-native";
import {
  Text,
  useTheme,
  TextInput,
  Card,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getDemoExercises } from "./mock-data";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";
import { DemoPress } from "./DemoTooltip";
import type { WorkoutExercise, ExerciseSet, Exercise } from "@/types/database";

function createDefaultSet(setNumber: number): ExerciseSet {
  return { set_number: setNumber, set_type: "standard", reps: 10, weight: null, duration_seconds: null, rest_seconds: 60, rpe: null };
}

export default function DemoWorkoutBuilder() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const demoExercises = useMemo(() => getDemoExercises(t), [t]);
  const { introOpacity, introTranslateY, contentOpacity } = useDemoFadeIn("new-workout");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  function goBack() {
    router.navigate({ pathname: "/demo/coach/library" } as any);
  }

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [
      ...prev,
      { exercise_id: exercise.id, exercise_name: exercise.name, order: prev.length, sets: [createDefaultSet(1), createDefaultSet(2), createDefaultSet(3)], notes: null, superset_group: null },
    ]);
    setShowExercisePicker(false);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i })));
  }

  function moveExercise(from: number, to: number) {
    setExercises((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr.map((ex, i) => ({ ...ex, order: i }));
    });
  }

  function addSet(exerciseIndex: number) {
    setExercises((prev) => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: [...ex.sets, createDefaultSet(ex.sets.length + 1)] } : ex));
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setExercises((prev) => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex).map((s, si) => ({ ...s, set_number: si + 1 })) } : ex));
  }

  function updateSet(exerciseIndex: number, setIndex: number, updates: Partial<ExerciseSet>) {
    setExercises((prev) => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets.map((s, si) => si === setIndex ? { ...s, ...updates } : s) } : ex));
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          hitSlop={10} accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.workoutBuilder")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[styles.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
            <Card.Content style={styles.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introNewWorkout")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>
        <TextInput mode="outlined" label={t("library.workoutNameLabel")} value={name} onChangeText={setName} style={styles.input} outlineStyle={styles.outline} />
        <TextInput mode="outlined" label={t("library.descriptionLabel")} value={description} onChangeText={setDescription} multiline style={styles.input} outlineStyle={styles.outline} />

        <View style={styles.exercisesHeader}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.exercisesLabel")} ({exercises.length})</Text>
        </View>

        {exercises.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginVertical: 16 }}>{t("clients.noExercisesAdded")}</Text>
        ) : (
          exercises.map((exercise, exerciseIndex) => (
            <Card key={`${exercise.exercise_id}-${exerciseIndex}`} style={[styles.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleRow}>
                    <View style={[styles.orderBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={{ fontWeight: "700", fontSize: 13, color: theme.colors.onPrimary }}>{exerciseIndex + 1}</Text>
                    </View>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }} numberOfLines={1}>{exercise.exercise_name}</Text>
                  </View>
                  <View style={styles.exerciseActions}>
                    {exerciseIndex > 0 && <IconButton icon="arrow-up" size={18} onPress={() => moveExercise(exerciseIndex, exerciseIndex - 1)} />}
                    {exerciseIndex < exercises.length - 1 && <IconButton icon="arrow-down" size={18} onPress={() => moveExercise(exerciseIndex, exerciseIndex + 1)} />}
                    <IconButton icon="delete-outline" size={18} iconColor={theme.colors.error} onPress={() => removeExercise(exerciseIndex)} />
                  </View>
                </View>

                <View style={styles.setsContainer}>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <View style={[styles.setNumber, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>{set.set_number}</Text>
                      </View>
                      <View style={styles.setField}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.repsLabel")}</Text>
                        <RNTextInput value={set.reps?.toString() ?? ""} onChangeText={(v) => updateSet(exerciseIndex, setIndex, { reps: v === "" ? null : Number.isNaN(parseInt(v, 10)) ? set.reps : parseInt(v, 10) })} keyboardType="numeric" style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]} placeholder="—" placeholderTextColor={theme.colors.onSurfaceVariant} />
                      </View>
                      <View style={styles.setField}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.weightLabel")}</Text>
                        <RNTextInput value={set.weight?.toString() ?? ""} onChangeText={(v) => updateSet(exerciseIndex, setIndex, { weight: v === "" ? null : Number.isNaN(parseFloat(v)) ? set.weight : parseFloat(v) })} keyboardType="decimal-pad" style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]} placeholder="—" placeholderTextColor={theme.colors.onSurfaceVariant} />
                      </View>
                      <View style={styles.setField}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.restLabel")}</Text>
                        <RNTextInput value={set.rest_seconds?.toString() ?? ""} onChangeText={(v) => updateSet(exerciseIndex, setIndex, { rest_seconds: v === "" ? null : Number.isNaN(parseInt(v, 10)) ? set.rest_seconds : parseInt(v, 10) })} keyboardType="numeric" style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]} placeholder="60" placeholderTextColor={theme.colors.onSurfaceVariant} />
                      </View>
                      <IconButton icon="close" size={16} onPress={() => removeSet(exerciseIndex, setIndex)} iconColor={theme.colors.error} />
                    </View>
                  ))}
                </View>

                <Pressable style={[styles.addSetButton, { borderColor: theme.colors.outline }]} onPress={() => addSet(exerciseIndex)}>
                  <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
                  <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4 }}>{t("library.addSet")}</Text>
                </Pressable>
              </Card.Content>
            </Card>
          ))
        )}

        <Pressable style={[styles.addExerciseButton, { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` }]} onPress={() => setShowExercisePicker(true)}>
          <MaterialCommunityIcons name="plus-circle" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 8, fontWeight: "600" }}>{t("library.addExercise")}</Text>
        </Pressable>

        <View style={styles.actions}>
          <DemoPress style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} accessibilityRole="button">
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>{t("library.assignToClient")}</Text>
          </DemoPress>
          <DemoPress style={[styles.secondaryBtn, { borderColor: theme.colors.primary }]} accessibilityRole="button">
            <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "700" }}>{t("library.saveAsTemplate")}</Text>
          </DemoPress>
        </View>
        </Animated.View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide" transparent onRequestClose={() => setShowExercisePicker(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.addExercise")}</Text>
              <IconButton icon="close" size={24} onPress={() => setShowExercisePicker(false)} />
            </View>
            <FlatList
              data={demoExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={[styles.pickerRow, { borderBottomColor: theme.colors.outline }]} onPress={() => addExercise(item)}>
                  <View style={[styles.pickerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{item.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}>{item.muscle_group} · {item.equipment}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 12 },
  outline: { borderRadius: 12 },
  exercisesHeader: { marginTop: 8, marginBottom: 12 },
  exerciseBlock: { borderRadius: 16, marginBottom: 12, elevation: 0 },
  exerciseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  exerciseTitleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  orderBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
  exerciseActions: { flexDirection: "row", alignItems: "center" },
  setsContainer: { gap: 6 },
  setRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  setNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  setField: { flex: 1, gap: 2 },
  setInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, textAlign: "center" },
  addSetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderWidth: 1, borderStyle: "dashed", borderRadius: 10, marginTop: 10 },
  addExerciseButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderWidth: 2, borderStyle: "dashed", borderRadius: 16, marginBottom: 16 },
  actions: { gap: 8 },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  secondaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { maxHeight: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  pickerIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});
