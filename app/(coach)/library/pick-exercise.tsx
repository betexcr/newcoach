import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { Text, useTheme, Searchbar, Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useExercises, MUSCLE_GROUPS, type ExerciseFilters } from "@/lib/queries/exercises";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { ErrorState } from "@/components/ErrorState";
import type { Exercise } from "@/types/database";

export default function PickExerciseScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const addExercise = useWorkoutBuilderStore((s) => s.addExercise);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  const filters: ExerciseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      muscleGroup: selectedMuscle,
    }),
    [search, selectedMuscle]
  );

  const { data: exercises = [], isLoading, isError, refetch, isRefetching } = useExercises(filters);

  function handleSelect(exercise: Exercise) {
    addExercise(exercise);
    router.back();
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
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
          {t("pickExercise.title")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Searchbar
        placeholder={t("pickExercise.searchPlaceholder")}
        onChangeText={setSearch}
        value={search}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ fontSize: 15 }}
        autoFocus
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
            {item === "all" ? t("pickExercise.all") : item}
          </Chip>
        )}
      />

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.exerciseItem,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => handleSelect(item)}
          >
            <View style={styles.exerciseInfo}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: "600" }}
              >
                {item.name}
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textTransform: "capitalize",
                  marginTop: 2,
                }}
              >
                {item.muscle_group}
                {item.equipment ? ` · ${item.equipment}` : ""}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={refetch} />
          ) : (
          <View style={styles.emptyState}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {isLoading ? t("common.loading") : t("pickExercise.noResults")}
            </Text>
          </View>
          )
        }
      />
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
  searchBar: {
    marginHorizontal: 16,
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
    paddingBottom: 32,
    gap: 6,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
});
