import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Modal, ScrollView, Image, Alert } from "react-native";
import {
  Text,
  useTheme,
  Searchbar,
  FAB,
  Chip,
  Card,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useExercises,
  MUSCLE_GROUPS,
  type ExerciseFilters,
} from "@/lib/queries/exercises";
import { useWorkoutTemplates, useDeleteTemplate } from "@/lib/queries/workouts";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import type { Exercise, WorkoutTemplate } from "@/types/database";

const muscleGroupIcons: Record<string, string> = {
  chest: "human-handsup",
  back: "human",
  shoulders: "human-greeting-variant",
  legs: "walk",
  arms: "arm-flex",
  core: "human-queue",
  cardio: "run-fast",
};

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress}>
    <Card
      style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content style={styles.exerciseContent}>
        <View
          style={[
            styles.exerciseIconBox,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={(muscleGroupIcons[exercise.muscle_group] ?? "dumbbell") as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.exerciseInfo}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          <View style={styles.exerciseMeta}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}
            >
              {exercise.muscle_group}
            </Text>
            {exercise.equipment && (
              <>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline }}
                >
                  {" · "}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}
                >
                  {exercise.equipment}
                </Text>
              </>
            )}
            {exercise.is_custom && (
              <View
                style={[
                  styles.customBadge,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.secondary, fontSize: 10 }}
                >
                  {t("library.customBadge")}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.onSurfaceVariant}
        />
      </Card.Content>
    </Card>
    </Pressable>
  );
}

function ExerciseDetailModal({
  exercise,
  visible,
  onClose,
}: {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}>
              {exercise.name}
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {exercise.thumbnail_url ? (
              <Image
                source={{ uri: exercise.thumbnail_url }}
                style={styles.detailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.detailImagePlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name={(muscleGroupIcons[exercise.muscle_group] ?? "dumbbell") as any}
                  size={48}
                  color={theme.colors.primary}
                />
              </View>
            )}

            <View style={styles.detailChips}>
              <Chip style={styles.detailChip} textStyle={{ textTransform: "capitalize" }}>
                {exercise.muscle_group}
              </Chip>
              {exercise.equipment && (
                <Chip style={styles.detailChip} textStyle={{ textTransform: "capitalize" }}>
                  {exercise.equipment}
                </Chip>
              )}
              {exercise.is_custom && (
                <Chip style={[styles.detailChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                  {t("library.customBadge")}
                </Chip>
              )}
            </View>

            {exercise.description ? (
              <View style={{ marginTop: 16 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 8 }}>
                  {t("library.description")}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
                  {exercise.description}
                </Text>
              </View>
            ) : null}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type LibraryTab = "exercises" | "templates";

export default function LibraryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("exercises");
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  const { data: templates = [] } = useWorkoutTemplates(userId);
  const deleteTemplate = useDeleteTemplate();

  const filters: ExerciseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      muscleGroup: selectedMuscle,
    }),
    [search, selectedMuscle]
  );

  const { data: exercises = [], isLoading } = useExercises(filters);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("library.title")}
        </Text>
        <Pressable
          style={[styles.programsLink, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={() => router.push("/(coach)/library/programs" as any)}
        >
          <MaterialCommunityIcons name="clipboard-list" size={16} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 4 }}>
            {t("programs.title")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[
            styles.tabButton,
            libraryTab === "exercises" && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setLibraryTab("exercises")}
        >
          <Text style={{
            color: libraryTab === "exercises" ? "#FFF" : theme.colors.onSurface,
            fontWeight: "600", fontSize: 13,
          }}>
            {t("library.exercisesTab")} ({exercises.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            libraryTab === "templates" && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setLibraryTab("templates")}
        >
          <Text style={{
            color: libraryTab === "templates" ? "#FFF" : theme.colors.onSurface,
            fontWeight: "600", fontSize: 13,
          }}>
            {t("library.templatesTab")} ({templates.length})
          </Text>
        </Pressable>
      </View>

      {libraryTab === "templates" ? (
        <TemplatesListView
          templates={templates}
          theme={theme}
          t={t}
          router={router}
          onDelete={(id) => {
            Alert.alert(t("common.delete"), t("library.deleteTemplateConfirm"), [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("common.delete"), style: "destructive", onPress: () => deleteTemplate.mutate(id) },
            ]);
          }}
        />
      ) : (
      <>
      <Searchbar
        placeholder={t("library.searchPlaceholder")}
        onChangeText={setSearch}
        value={search}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ fontSize: 15 }}
      />

      <FlatList
        data={MUSCLE_GROUPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Chip
            mode={selectedMuscle === item ? "flat" : "outlined"}
            selected={selectedMuscle === item}
            onPress={() => setSelectedMuscle(item)}
            style={[
              styles.chip,
              selectedMuscle === item && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            textStyle={[
              { textTransform: "capitalize", fontSize: 13 },
              selectedMuscle === item && { color: "#FFFFFF" },
            ]}
          >
            {item === "all" ? t("library.filterAll") : item}
          </Chip>
        )}
      />

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ExerciseCard exercise={item} onPress={() => setSelectedExercise(item)} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="magnify"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 12,
              }}
            >
              {isLoading ? t("library.loadingExercises") : t("library.noExercises")}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => router.push("/(coach)/library/create-exercise")}
        label={t("library.newExercise")}
      />
      </>
      )}

      <ExerciseDetailModal
        exercise={selectedExercise}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}

function TemplatesListView({
  templates,
  theme,
  t,
  router,
  onDelete,
}: {
  templates: WorkoutTemplate[];
  theme: any;
  t: any;
  router: any;
  onDelete: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="file-document-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 12, fontWeight: "700" }}>
          {t("library.noTemplates")}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8 }}>
          {t("library.noTemplatesMessage")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={templates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.templateCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            useWorkoutBuilderStore.getState().loadTemplate(
              item.name,
              item.description ?? "",
              item.exercises
            );
            router.push("/(coach)/library/workout-builder");
          }}
        >
          <View style={[styles.exerciseIconBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="file-document" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.exercises?.length ?? 0} {t("library.exerciseCount")} ·{" "}
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
            {item.description && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <Pressable onPress={() => onDelete(item.id)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  programsLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    elevation: 0,
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 8,
  },
  exerciseCard: {
    borderRadius: 14,
    elevation: 0,
  },
  exerciseContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  exerciseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  customBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  detailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailChip: {
    borderRadius: 16,
  },
});
