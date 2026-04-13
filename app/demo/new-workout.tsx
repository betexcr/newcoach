import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput as RNTextInput,
  Modal,
  FlatList,
  Animated,
  ScrollView,
} from "react-native";
import {
  Text,
  useTheme,
  TextInput,
  Card,
  IconButton,
  Avatar,
  Chip,
  Searchbar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { getDemoExercises, demoClients } from "./mock-data";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";
import { DemoPress } from "./DemoTooltip";
import { translateMuscle, translateEquipment } from "@/lib/translate-exercise";
import type { WorkoutExercise, ExerciseSet, Exercise } from "@/types/database";

function createDefaultSet(setNumber: number): ExerciseSet {
  return { set_number: setNumber, set_type: "standard", reps: 10, weight: null, duration_seconds: null, rest_seconds: 60, rpe: null };
}

type IndexedExercise = WorkoutExercise & { _index: number };

function ExerciseBlock({
  exercise,
  exerciseIndex,
  drag,
  theme,
  t,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  drag?: () => void;
  theme: AppTheme;
  t: (k: string) => string;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, updates: Partial<ExerciseSet>) => void;
}) {
  return (
    <Card style={[styles.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseTitleRow}>
            {drag && (
              <Pressable onLongPress={drag} delayLongPress={100} style={styles.dragHandle}>
                <MaterialCommunityIcons name="drag" size={22} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            )}
            <View style={[styles.orderBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ fontWeight: "700", fontSize: 13, color: theme.colors.onPrimary }}>{exerciseIndex + 1}</Text>
            </View>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }} numberOfLines={1}>{exercise.exercise_name}</Text>
          </View>
          <IconButton icon="delete-outline" size={18} iconColor={theme.colors.error} onPress={onRemove} />
        </View>

        <View style={styles.setsContainer}>
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <View style={[styles.setNumber, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>{set.set_number}</Text>
              </View>
              <View style={styles.setField}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.repsLabel")}</Text>
                <RNTextInput
                  value={set.reps?.toString() ?? ""}
                  onChangeText={(v) => onUpdateSet(setIndex, { reps: v === "" ? null : Number.isNaN(parseInt(v, 10)) ? set.reps : parseInt(v, 10) })}
                  keyboardType="numeric"
                  style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]}
                  placeholder="—"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.setField}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.weightLabel")}</Text>
                <RNTextInput
                  value={set.weight?.toString() ?? ""}
                  onChangeText={(v) => onUpdateSet(setIndex, { weight: v === "" ? null : Number.isNaN(parseFloat(v)) ? set.weight : parseFloat(v) })}
                  keyboardType="decimal-pad"
                  style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]}
                  placeholder="—"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.setField}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t("library.restLabel")}</Text>
                <RNTextInput
                  value={set.rest_seconds?.toString() ?? ""}
                  onChangeText={(v) => onUpdateSet(setIndex, { rest_seconds: v === "" ? null : Number.isNaN(parseInt(v, 10)) ? set.rest_seconds : parseInt(v, 10) })}
                  keyboardType="numeric"
                  style={[styles.setInput, { color: theme.colors.onSurface, borderColor: theme.colors.outline, backgroundColor: theme.colors.background }]}
                  placeholder="60"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              </View>
              <IconButton icon="close" size={16} onPress={() => onRemoveSet(setIndex)} iconColor={theme.colors.error} />
            </View>
          ))}
        </View>

        <Pressable style={[styles.addSetButton, { borderColor: theme.colors.outline }]} onPress={onAddSet}>
          <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4 }}>{t("library.addSet")}</Text>
        </Pressable>
      </Card.Content>
    </Card>
  );
}

export default function DemoWorkoutBuilder() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const demoExercises = useMemo(() => getDemoExercises(t), [t]);
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("new-workout");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  const muscleGroups = ["all", "chest", "back", "shoulders", "legs", "arms", "core"] as const;

  const filteredExercises = useMemo(() => {
    let list = demoExercises;
    if (selectedMuscle !== "all") {
      list = list.filter((ex) => ex.muscle_group === selectedMuscle);
    }
    if (exerciseSearch.trim()) {
      const q = exerciseSearch.toLowerCase();
      list = list.filter((ex) => ex.name.toLowerCase().includes(q));
    }
    return list;
  }, [demoExercises, selectedMuscle, exerciseSearch]);

  const activeClients = useMemo(
    () => demoClients.filter((c) => c.status === "active"),
    []
  );

  function handleAssignToClient(clientName: string) {
    setShowClientPicker(false);
    Alert.alert(
      t("library.assignedTitle"),
      t("library.assignedMessage", { name: clientName }),
      [{ text: t("common.ok"), onPress: goBack }]
    );
  }

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
    if (from === to) return;
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

  const indexedExercises = useMemo(
    () => exercises.map((ex, i) => ({ ...ex, _index: i })),
    [exercises]
  );

  const renderItem = useCallback(
    ({ item, drag: dragFn }: RenderItemParams<IndexedExercise>) => (
      <ScaleDecorator>
        <ExerciseBlock
          exercise={item}
          exerciseIndex={item._index}
          drag={dragFn}
          theme={theme}
          t={t}
          onRemove={() => removeExercise(item._index)}
          onAddSet={() => addSet(item._index)}
          onRemoveSet={(si) => removeSet(item._index, si)}
          onUpdateSet={(si, u) => updateSet(item._index, si, u)}
        />
      </ScaleDecorator>
    ),
    [theme, t, exercises.length]
  );

  const header = useMemo(
    () => (
      <View>
        {!introCollapsed && (
          <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
            <Card style={[styles.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained" onPress={dismissIntro}>
              <Card.Content style={styles.introContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                  {t("demo.introNewWorkout")}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        <Animated.View style={{ opacity: contentOpacity }}>
          <TextInput mode="outlined" label={t("library.workoutNameLabel")} value={name} onChangeText={setName} style={styles.input} outlineStyle={styles.outline} />
          <TextInput mode="outlined" label={t("library.descriptionLabel")} value={description} onChangeText={setDescription} multiline style={styles.input} outlineStyle={styles.outline} />

          <View style={styles.exercisesHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.exercisesLabel")} ({exercises.length})</Text>
            {exercises.length > 1 && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("library.dragToReorder")}
              </Text>
            )}
          </View>

          {exercises.length === 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginVertical: 16 }}>{t("clients.noExercisesAdded")}</Text>
          )}
        </Animated.View>
      </View>
    ),
    [introCollapsed, introOpacity, introTranslateY, contentOpacity, dismissIntro, name, description, exercises.length, theme, t]
  );

  const footer = useMemo(
    () => (
      <Animated.View style={{ opacity: contentOpacity }}>
        <Pressable style={[styles.addExerciseButton, { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` }]} onPress={() => setShowExercisePicker(true)}>
          <MaterialCommunityIcons name="plus-circle" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 8, fontWeight: "600" }}>{t("library.addExercise")}</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            onPress={() => {
              if (!name.trim()) {
                Alert.alert(t("common.required"), t("library.enterWorkoutName"));
                return;
              }
              if (exercises.length === 0) {
                Alert.alert(t("common.required"), t("library.addAtLeastOneExercise"));
                return;
              }
              setShowClientPicker(true);
            }}
          >
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>{t("library.assignToClient")}</Text>
          </Pressable>
          <DemoPress style={[styles.secondaryBtn, { borderColor: theme.colors.primary }]} accessibilityRole="button">
            <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "700" }}>{t("library.saveAsTemplate")}</Text>
          </DemoPress>
        </View>
      </Animated.View>
    ),
    [contentOpacity, theme, t, name, exercises]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={10} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.workoutBuilder")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <DraggableFlatList
        data={indexedExercises}
        keyExtractor={(item, index) => `${item.exercise_id}-${index}`}
        onDragEnd={({ from, to }) => moveExercise(from, to)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
        containerStyle={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={showExercisePicker} animationType="slide" transparent onRequestClose={() => { setShowExercisePicker(false); setExerciseSearch(""); setSelectedMuscle("all"); }}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.addExercise")}</Text>
              <IconButton icon="close" size={24} onPress={() => { setShowExercisePicker(false); setExerciseSearch(""); setSelectedMuscle("all"); }} />
            </View>
            <Searchbar
              placeholder={t("pickExercise.searchPlaceholder")}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 12, backgroundColor: theme.colors.surfaceVariant }}
              inputStyle={{ fontSize: 14 }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {muscleGroups.map((mg) => (
                <Chip
                  key={mg}
                  selected={selectedMuscle === mg}
                  onPress={() => setSelectedMuscle(mg)}
                  style={{ backgroundColor: selectedMuscle === mg ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
                  textStyle={{ color: selectedMuscle === mg ? theme.colors.primary : theme.colors.onSurfaceVariant, textTransform: "capitalize" }}
                >
                  {mg === "all" ? t("pickExercise.all") : translateMuscle(mg, t)}
                </Chip>
              ))}
            </ScrollView>
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={[styles.pickerRow, { borderBottomColor: theme.colors.outline }]} onPress={() => addExercise(item)}>
                  <View style={[styles.pickerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{item.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}>{translateMuscle(item.muscle_group, t)} · {translateEquipment(item.equipment, t)}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: "center" }}>
                  <MaterialCommunityIcons name="dumbbell" size={40} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("pickExercise.noResults")}</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showClientPicker} animationType="slide" transparent onRequestClose={() => setShowClientPicker(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.selectClient")}</Text>
              <IconButton icon="close" size={24} onPress={() => setShowClientPicker(false)} />
            </View>
            <FlatList
              data={activeClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const initials = item.profile?.full_name
                  ? item.profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                  : "?";
                return (
                  <Pressable
                    style={[styles.pickerRow, { borderBottomColor: theme.colors.outline }]}
                    onPress={() => handleAssignToClient(item.profile?.full_name ?? t("dashboard.fallbackClient"))}
                  >
                    <Avatar.Text
                      size={40}
                      label={initials}
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      labelStyle={{ color: theme.colors.primary }}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                        {item.profile?.full_name ?? t("clients.unknown")}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.profile?.email ?? ""}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                );
              }}
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
  exercisesHeader: { marginTop: 8, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exerciseBlock: { borderRadius: 16, marginBottom: 12, elevation: 0 },
  exerciseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  exerciseTitleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  dragHandle: { paddingHorizontal: 4, paddingVertical: 8, marginRight: 4 },
  orderBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
  setsContainer: { gap: 6 },
  setRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  setNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  setField: { flex: 1, gap: 2 },
  setInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, textAlign: "center" },
  addSetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderWidth: 1, borderStyle: "dashed", borderRadius: 10, marginTop: 10 },
  addExerciseButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderWidth: 2, borderStyle: "dashed", borderRadius: 16, marginBottom: 16 },
  actions: { gap: 8 },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  secondaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, backgroundColor: "transparent" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { maxHeight: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  pickerIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});
