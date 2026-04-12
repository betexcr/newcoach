import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Modal, ScrollView, Image, Alert, RefreshControl } from "react-native";
import {
  Text,
  useTheme,
  Searchbar,
  FAB,
  Chip,
  Card,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { safeDateString } from "@/lib/date-utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useExercises,
  useDeleteExercise,
  getExerciseThumbnail,
  MUSCLE_GROUPS,
  type ExerciseFilters,
} from "@/lib/queries/exercises";
import { useWorkoutTemplates, useDeleteTemplate } from "@/lib/queries/workouts";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { ErrorState } from "@/components/ErrorState";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { Exercise, WorkoutTemplate } from "@/types/database";
import type { AppTheme } from "@/lib/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

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
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress}>
    <Card
      style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content style={styles.exerciseContent}>
        {(() => {
          const thumb = getExerciseThumbnail(exercise);
          return thumb ? (
            <Image
              source={{ uri: thumb }}
              style={styles.exerciseIconBox}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.exerciseIconBox,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={(muscleGroupIcons[exercise.muscle_group] ?? "dumbbell") as IconName}
                size={24}
                color={theme.colors.primary}
              />
            </View>
          );
        })()}
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
        {exercise.video_url && (
          <View style={[styles.videoBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <MaterialCommunityIcons name="play-circle" size={18} color={theme.colors.primary} />
          </View>
        )}
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
  onEdit,
  onDelete,
}: {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);
  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}>
              {exercise.name}
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {(() => {
              const thumb = getExerciseThumbnail(exercise);
              return thumb ? (
                <Image
                  source={{ uri: thumb }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.detailImagePlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name={(muscleGroupIcons[exercise.muscle_group] ?? "dumbbell") as IconName}
                    size={48}
                    color={theme.colors.primary}
                  />
                </View>
              );
            })()}

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

            {exercise.video_url && (
              <Pressable
                style={[styles.videoButton, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => setShowVideo(true)}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="play-circle" size={22} color={theme.colors.primary} />
                <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "700", marginLeft: 8 }}>
                  {t("library.watchVideo")}
                </Text>
              </Pressable>
            )}

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

            {exercise.is_custom && (
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => onEdit(exercise)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
                  <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "700", marginLeft: 8 }}>
                    {t("library.editExercise")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: theme.colors.errorContainer }]}
                  onPress={() => onDelete(exercise)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                  <Text variant="labelLarge" style={{ color: theme.colors.error, fontWeight: "700", marginLeft: 8 }}>
                    {t("library.deleteExercise")}
                  </Text>
                </Pressable>
              </View>
            )}

          </ScrollView>
        </View>
      </View>

      {exercise.video_url && (
        <VideoPlayer
          url={exercise.video_url}
          visible={showVideo}
          onClose={() => setShowVideo(false)}
        />
      )}
    </Modal>
  );
}

type LibraryTab = "exercises" | "templates";

export default function LibraryScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("exercises");
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  const { data: templates = [], isLoading: templatesLoading, isError: templatesError, refetch: refetchTemplates, isRefetching: templatesRefetching } =
    useWorkoutTemplates(userId);
  const deleteTemplate = useDeleteTemplate();

  const filters: ExerciseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      muscleGroup: selectedMuscle,
    }),
    [search, selectedMuscle]
  );

  const { data: exercises = [], isLoading, isError, refetch: refetchExercises, isRefetching: exercisesRefetching } = useExercises(filters);
  const deleteExercise = useDeleteExercise();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  function handleEditExercise(exercise: Exercise) {
    setSelectedExercise(null);
    router.push({ pathname: "/(coach)/library/create-exercise", params: { exerciseId: exercise.id } } as any);
  }

  function handleDeleteExercise(exercise: Exercise) {
    Alert.alert(t("library.deleteExercise"), t("library.deleteExerciseConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExercise.mutateAsync(exercise.id);
            setSelectedExercise(null);
          } catch {
            Alert.alert(t("common.error"), t("library.failedDeleteExercise"));
          }
        },
      },
    ]);
  }

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
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={[styles.programsLink, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() => router.push("/(coach)/library/documents" as any)}
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 4 }}>
              {t("library.documents")}
            </Text>
          </Pressable>
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
            color: libraryTab === "exercises" ? theme.colors.onPrimary : theme.colors.onSurface,
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
            color: libraryTab === "templates" ? theme.colors.onPrimary : theme.colors.onSurface,
            fontWeight: "600", fontSize: 13,
          }}>
            {t("library.templatesTab")} ({templates.length})
          </Text>
        </Pressable>
      </View>

      {libraryTab === "templates" ? (
        templatesError ? (
          <ErrorState onRetry={refetchTemplates} />
        ) : templatesLoading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <TemplatesListView
            templates={templates}
            theme={theme}
            t={t}
            router={router}
            isRefetching={templatesRefetching}
            onRefresh={refetchTemplates}
            deleting={deleteTemplate.isPending}
            onDelete={(id) => {
              if (deleteTemplate.isPending) return;
              Alert.alert(t("common.delete"), t("library.deleteTemplateConfirm"), [
                { text: t("common.cancel"), style: "cancel" },
                { text: t("common.delete"), style: "destructive", onPress: () => deleteTemplate.mutate(id, { onError: () => Alert.alert(t("common.error"), t("common.errorGeneric")) }) },
              ]);
            }}
          />
        )
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
              selectedMuscle === item && { color: theme.colors.onPrimary },
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
        refreshControl={
          <RefreshControl refreshing={exercisesRefetching} onRefresh={refetchExercises} />
        }
        renderItem={({ item }) => <ExerciseCard exercise={item} onPress={() => setSelectedExercise(item)} />}
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={refetchExercises} />
          ) : (
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
          )
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push("/(coach)/library/create-exercise")}
        label={t("library.newExercise")}
      />
      </>
      )}

      <ExerciseDetailModal
        exercise={selectedExercise}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onEdit={handleEditExercise}
        onDelete={handleDeleteExercise}
      />
    </SafeAreaView>
  );
}

function TemplatesListView({
  templates,
  theme,
  t,
  router,
  isRefetching,
  onRefresh,
  onDelete,
  deleting,
}: {
  templates: WorkoutTemplate[];
  theme: AppTheme;
  t: (key: string, options?: Record<string, unknown>) => string;
  router: ReturnType<typeof useRouter>;
  isRefetching: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
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
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.templateCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            useWorkoutBuilderStore.getState().loadTemplate(
              item.name,
              item.description ?? "",
              item.exercises ?? []
            );
            router.push("/(coach)/library/workout-builder");
          }}
        >
          <View style={[styles.exerciseIconBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="file-document" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.exercises?.length ?? 0} {t("library.exerciseCount")} ·{" "}
              {safeDateString(item.updated_at)}
            </Text>
            {item.description && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <Pressable onPress={() => onDelete(item.id)} disabled={deleting} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, opacity: deleting ? 0.4 : 1 }}>
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
    overflow: "hidden",
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
    justifyContent: "flex-end" as const,
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
  videoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
});
