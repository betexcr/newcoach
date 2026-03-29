import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Text, useTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCreateExercise, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from "@/lib/queries/exercises";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";

export default function CreateExerciseScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const createExercise = useCreateExercise();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("library.enterExerciseName"));
      return;
    }
    if (!muscleGroup) {
      Alert.alert(t("common.required"), t("library.selectMuscleGroup"));
      return;
    }
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    try {
      await createExercise.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        muscle_group: muscleGroup,
        equipment: equipment || undefined,
        video_url: videoUrl.trim() || undefined,
        created_by: userId,
        is_custom: true,
      });
      router.back();
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("library.failedCreateExercise"));
    }
  }

  const filteredMuscleGroups = MUSCLE_GROUPS.filter((g) => g !== "all");
  const filteredEquipment = EQUIPMENT_OPTIONS.filter((e) => e !== "all");

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
          {t("library.createExercise")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          mode="outlined"
          label={t("library.exerciseNameLabel")}
          value={name}
          onChangeText={setName}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <TextInput
          mode="outlined"
          label={t("library.description")}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <Text
          variant="titleMedium"
          style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
        >
          {t("library.muscleGroupLabel")}
        </Text>
        <View style={styles.chipGrid}>
          {filteredMuscleGroups.map((group) => (
            <Pressable
              key={group}
              style={[
                styles.selectChip,
                {
                  backgroundColor:
                    muscleGroup === group
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    muscleGroup === group
                      ? theme.colors.primary
                      : theme.colors.outline,
                },
              ]}
              onPress={() => setMuscleGroup(group)}
            >
              <Text
                style={[
                  styles.selectChipText,
                  {
                    color:
                      muscleGroup === group
                        ? theme.colors.onPrimary
                        : theme.colors.onSurface,
                  },
                ]}
              >
                {group}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text
          variant="titleMedium"
          style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
        >
          {t("library.equipmentLabel")}
        </Text>
        <View style={styles.chipGrid}>
          {filteredEquipment.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.selectChip,
                {
                  backgroundColor:
                    equipment === item
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    equipment === item
                      ? theme.colors.primary
                      : theme.colors.outline,
                },
              ]}
              onPress={() =>
                setEquipment((prev) => (prev === item ? "" : item))
              }
            >
              <Text
                style={[
                  styles.selectChipText,
                  {
                    color:
                      equipment === item
                        ? theme.colors.onPrimary
                        : theme.colors.onSurface,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          mode="outlined"
          label={t("library.videoUrlLabel")}
          value={videoUrl}
          onChangeText={setVideoUrl}
          keyboardType="url"
          autoCapitalize="none"
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <AuthButton
          onPress={handleCreate}
          loading={createExercise.isPending}
          disabled={createExercise.isPending || !name.trim() || !muscleGroup}
          style={styles.createButton}
        >
          {t("library.createExerciseButton")}
        </AuthButton>
      </ScrollView>
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
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
    fontSize: 16,
  },
  outline: {
    borderRadius: 12,
  },
  sectionLabel: {
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  selectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectChipText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  createButton: {
    marginTop: 16,
  },
});
