import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Text, useTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCreateExercise, useUpdateExercise, useExercise, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from "@/lib/queries/exercises";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";
import type { AppTheme } from "@/lib/theme";

export default function CreateExerciseScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const isEditMode = !!exerciseId;

  const { data: existingExercise } = useExercise(exerciseId ?? "");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existingExercise && !loaded) {
      setName(existingExercise.name);
      setDescription(existingExercise.description ?? "");
      setMuscleGroup(existingExercise.muscle_group);
      setEquipment(existingExercise.equipment ?? "");
      setVideoUrl(existingExercise.video_url ?? "");
      setThumbnailUrl(existingExercise.thumbnail_url ?? "");
      setLoaded(true);
    }
  }, [existingExercise, loaded]);

  async function handleSubmit() {
    Keyboard.dismiss();
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
      if (isEditMode) {
        await updateExercise.mutateAsync({
          id: exerciseId!,
          name: name.trim(),
          description: description.trim() || null,
          muscle_group: muscleGroup,
          equipment: equipment || null,
          video_url: videoUrl.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
        });
      } else {
        await createExercise.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          muscle_group: muscleGroup,
          equipment: equipment || undefined,
          video_url: videoUrl.trim() || undefined,
          thumbnail_url: thumbnailUrl.trim() || undefined,
          created_by: userId,
          is_custom: true,
        });
      }
      router.back();
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("library.failedCreateExercise"));
    }
  }

  const isPending = createExercise.isPending || updateExercise.isPending;

  const filteredMuscleGroups = MUSCLE_GROUPS.filter((g) => g !== "all");
  const filteredEquipment = EQUIPMENT_OPTIONS.filter((e) => e !== "all");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
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
          {isEditMode ? t("library.editExercise") : t("library.createExercise")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
                {t(`muscleGroups.${group}`, group)}
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
                {t(`equipment.${item}`, item)}
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

        <TextInput
          mode="outlined"
          label={t("library.thumbnailUrlLabel")}
          value={thumbnailUrl}
          onChangeText={setThumbnailUrl}
          keyboardType="url"
          autoCapitalize="none"
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <AuthButton
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending || !name.trim() || !muscleGroup}
          style={styles.createButton}
        >
          {isEditMode ? t("library.saveExercise") : t("library.createExerciseButton")}
        </AuthButton>
      </ScrollView>
      </KeyboardAvoidingView>
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
