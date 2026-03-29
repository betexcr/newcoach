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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAssignWorkout } from "@/lib/queries/workouts";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";

export default function AssignWorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
  }>();
  const userId = useAuthStore((s) => s.user?.id);
  const assignWorkout = useAssignWorkout();
  const { name, exercises, reset } = useWorkoutBuilderStore();

  const [workoutName, setWorkoutName] = useState(name);
  const [dateStr, setDateStr] = useState(
    (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()
  );

  async function handleAssign() {
    if (!workoutName.trim()) {
      Alert.alert(t("common.required"), t("clients.enterWorkoutName"));
      return;
    }
    if (exercises.length === 0) {
      Alert.alert(t("common.required"), t("clients.addExercisesFirst"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      Alert.alert(t("common.required"), t("clients.invalidDate"));
      return;
    }
    if (!userId || !clientId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    try {
      await assignWorkout.mutateAsync({
        coach_id: userId,
        client_id: clientId,
        name: workoutName.trim(),
        scheduled_date: dateStr,
        exercises,
      });
      reset();
      Alert.alert(
        t("clients.assigned"),
        t("clients.workoutAssignedTo", { name: clientName ?? t("dashboard.fallbackClient") }),
        [{ text: t("common.ok"), onPress: () => router.dismissAll() }]
      );
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("clients.failedAssign"));
    }
  }

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
          {t("clients.assignWorkout")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[styles.clientBadge, { backgroundColor: theme.colors.primaryContainer }]}
        >
          <MaterialCommunityIcons
            name="account"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 8 }}
          >
            {clientName ?? t("dashboard.fallbackClient")}
          </Text>
        </View>

        <TextInput
          mode="outlined"
          label={t("clients.workoutName")}
          value={workoutName}
          onChangeText={setWorkoutName}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <TextInput
          mode="outlined"
          label={t("clients.scheduledDate")}
          value={dateStr}
          onChangeText={setDateStr}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <View style={styles.summary}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
            {t("clients.exercises")} ({exercises.length})
          </Text>
          {exercises.length > 0 ? (
            <>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                {exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} {t("clients.totalSets")}
              </Text>
              {exercises.map((ex, i) => (
                <View
                  key={`${ex.exercise_id}-${i}`}
                  style={[styles.summaryItem, { borderBottomColor: theme.colors.outline }]}
                >
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                    {i + 1}. {ex.exercise_name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {ex.sets.length} {t("clients.sets")}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const { exercises: allExercises } = useWorkoutBuilderStore.getState();
                      useWorkoutBuilderStore.setState({
                        exercises: allExercises.filter((_, idx) => idx !== i).map((e, idx) => ({ ...e, order: idx })),
                      });
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.colors.error} />
                  </Pressable>
                </View>
              ))}
            </>
          ) : (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              {t("clients.noExercisesAdded")}
            </Text>
          )}
        </View>

        <Pressable
          style={[
            styles.addExerciseButton,
            {
              borderColor: theme.colors.primary,
              backgroundColor: `${theme.colors.primary}08`,
            },
          ]}
          onPress={() => router.push("/(coach)/library/pick-exercise" as any)}
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
            {t("clients.addExercise")}
          </Text>
        </Pressable>

        <AuthButton
          onPress={handleAssign}
          loading={assignWorkout.isPending}
          disabled={assignWorkout.isPending || exercises.length === 0}
          style={{ marginTop: 16 }}
        >
          {t("clients.assignTo", { name: clientName ?? t("dashboard.fallbackClient") })}
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
  clientBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  outline: {
    borderRadius: 12,
  },
  summary: {
    marginTop: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    marginTop: 12,
  },
});
