import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  TextInput,
  ProgressBar,
  IconButton,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthButton } from "@/components/AuthButton";
import { ErrorState } from "@/components/ErrorState";
import { useAuthStore } from "@/stores/auth-store";
import {
  useNutritionLogs,
  useAddNutritionLog,
  useDeleteNutritionLog,
  useUpdateNutritionGoals,
} from "@/lib/queries/nutrition";
import { formatDate } from "@/lib/date-utils";
import type { MacroGoals } from "@/types/database";
import type { AppTheme } from "@/lib/theme";

const DEFAULT_GOALS: MacroGoals = {
  calories: 2200,
  protein: 160,
  carbs: 250,
  fat: 70,
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

export default function NutritionScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const userId = user?.id;
  const goals: MacroGoals = profile?.nutrition_goals ?? DEFAULT_GOALS;

  const today = formatDate(new Date());
  const {
    data: entries = [],
    isLoading: nutritionLogsLoading,
    isError,
    refetch,
    isRefetching,
  } = useNutritionLogs(userId ?? "", today);
  const addEntry = useAddNutritionLog();
  const deleteEntry = useDeleteNutritionLog();
  const updateGoals = useUpdateNutritionGoals();

  const [showForm, setShowForm] = useState(false);
  const [showGoalsForm, setShowGoalsForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [meal, setMeal] = useState<MealType>("snack");

  const [goalCalories, setGoalCalories] = useState(String(goals.calories));
  const [goalProtein, setGoalProtein] = useState(String(goals.protein));
  const [goalCarbs, setGoalCarbs] = useState(String(goals.carbs));
  const [goalFat, setGoalFat] = useState(String(goals.fat));

  if (nutritionLogsLoading || !userId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("nutrition.nameRequired"));
      return;
    }
    if (!userId) return;
    try {
      await addEntry.mutateAsync({
        client_id: userId,
        name: name.trim(),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        meal,
        logged_date: today,
      });
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setMeal("snack");
      setShowForm(false);
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("nutrition.failedAddEntry"));
    }
  }

  async function handleSaveGoals() {
    if (!userId) return;
    const newGoals: MacroGoals = {
      calories: parseFloat(goalCalories) || DEFAULT_GOALS.calories,
      protein: parseFloat(goalProtein) || DEFAULT_GOALS.protein,
      carbs: parseFloat(goalCarbs) || DEFAULT_GOALS.carbs,
      fat: parseFloat(goalFat) || DEFAULT_GOALS.fat,
    };
    try {
      await updateGoals.mutateAsync({ userId, goals: newGoals });
      if (profile) setProfile({ ...profile, nutrition_goals: newGoals });
      setShowGoalsForm(false);
      Alert.alert(t("common.ok"), t("nutrition.goalsUpdated"));
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("nutrition.failedUpdateGoals"));
    }
  }

  function handleDelete(id: string) {
    Alert.alert(t("nutrition.deleteEntry"), t("nutrition.deleteEntryConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteEntry.mutate(id, { onError: () => Alert.alert(t("common.error"), t("common.errorGeneric")) }),
      },
    ]);
  }

  function openGoalsForm() {
    setGoalCalories(String(goals.calories));
    setGoalProtein(String(goals.protein));
    setGoalCarbs(String(goals.carbs));
    setGoalFat(String(goals.fat));
    setShowGoalsForm(true);
    setShowForm(false);
  }

  const mealLabel = (m: MealType) => {
    const map: Record<MealType, string> = {
      breakfast: t("nutrition.mealBreakfast"),
      lunch: t("nutrition.mealLunch"),
      dinner: t("nutrition.mealDinner"),
      snack: t("nutrition.mealSnack"),
    };
    return map[m];
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.titleRow}>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("nutrition.title")}
          </Text>
          <Pressable onPress={openGoalsForm}>
            <MaterialCommunityIcons
              name="target"
              size={26}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        <Card
          style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <View style={styles.calorieRow}>
              <View>
                <Text
                  variant="displaySmall"
                  style={{ color: theme.colors.primary, fontWeight: "800" }}
                >
                  {Math.round(totals.calories)}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t("nutrition.ofCal", { count: goals.calories })}
                </Text>
              </View>
              <View style={styles.remainingBadge}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.secondary, fontWeight: "700" }}
                >
                  {Math.max(goals.calories - totals.calories, 0)}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t("nutrition.remaining")}
                </Text>
              </View>
            </View>

            <View style={styles.macrosSection}>
              <MacroBar
                label={t("nutrition.protein")}
                current={totals.protein}
                goal={goals.protein}
                color={theme.colors.error}
              />
              <MacroBar
                label={t("nutrition.carbs")}
                current={totals.carbs}
                goal={goals.carbs}
                color={theme.custom.warning}
              />
              <MacroBar
                label={t("nutrition.fat")}
                current={totals.fat}
                goal={goals.fat}
                color={theme.custom.info}
              />
            </View>
          </Card.Content>
        </Card>

        {showGoalsForm && (
          <Card
            style={[styles.formCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}
              >
                {t("nutrition.goalsTitle")}
              </Text>
              <TextInput
                mode="outlined"
                label={t("nutrition.caloriesGoal")}
                value={goalCalories}
                onChangeText={setGoalCalories}
                keyboardType="numeric"
                style={styles.formInput}
                outlineStyle={styles.outline}
                dense
              />
              <View style={styles.formRow}>
                <TextInput
                  mode="outlined"
                  label={t("nutrition.proteinGoal")}
                  value={goalProtein}
                  onChangeText={setGoalProtein}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
                <TextInput
                  mode="outlined"
                  label={t("nutrition.carbsGoal")}
                  value={goalCarbs}
                  onChangeText={setGoalCarbs}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
              </View>
              <TextInput
                mode="outlined"
                label={t("nutrition.fatGoal")}
                value={goalFat}
                onChangeText={setGoalFat}
                keyboardType="numeric"
                style={styles.formInput}
                outlineStyle={styles.outline}
                dense
              />
              <View style={styles.formRow}>
                <AuthButton
                  onPress={handleSaveGoals}
                  loading={updateGoals.isPending}
                  disabled={updateGoals.isPending}
                  style={{ flex: 1, marginTop: 8 }}
                >
                  {t("nutrition.saveGoals")}
                </AuthButton>
                <Pressable
                  onPress={() => setShowGoalsForm(false)}
                  style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
                >
                  <Text style={{ color: theme.colors.onSurface }}>{t("common.cancel")}</Text>
                </Pressable>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.entriesHeader}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("nutrition.foodLog")}
          </Text>
          <Pressable onPress={() => { setShowForm(!showForm); setShowGoalsForm(false); }}>
            <MaterialCommunityIcons
              name={showForm ? "close" : "plus-circle"}
              size={28}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        {showForm && (
          <Card
            style={[styles.formCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <TextInput
                mode="outlined"
                label={t("nutrition.foodName")}
                value={name}
                onChangeText={setName}
                style={styles.formInput}
                outlineStyle={styles.outline}
                dense
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}
              >
                {t("nutrition.mealLabel")}
              </Text>
              <View style={styles.mealChips}>
                {MEAL_TYPES.map((m) => (
                  <Chip
                    key={m}
                    selected={meal === m}
                    onPress={() => setMeal(m)}
                    compact
                    style={[
                      styles.mealChip,
                      meal === m && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    textStyle={{
                      color: meal === m ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      fontWeight: meal === m ? "700" : "400",
                    }}
                  >
                    {mealLabel(m)}
                  </Chip>
                ))}
              </View>
              <View style={styles.formRow}>
                <TextInput
                  mode="outlined"
                  label={t("nutrition.calories")}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
                <TextInput
                  mode="outlined"
                  label={t("nutrition.proteinGrams")}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
              </View>
              <View style={styles.formRow}>
                <TextInput
                  mode="outlined"
                  label={t("nutrition.carbsGrams")}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
                <TextInput
                  mode="outlined"
                  label={t("nutrition.fatGrams")}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                  style={[styles.formInput, { flex: 1 }]}
                  outlineStyle={styles.outline}
                  dense
                />
              </View>
              <AuthButton
                onPress={handleAdd}
                loading={addEntry.isPending}
                disabled={addEntry.isPending || !name.trim()}
                style={{ marginTop: 8 }}
              >
                {t("nutrition.addEntry")}
              </AuthButton>
            </Card.Content>
          </Card>
        )}

        {entries.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={40}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              {t("nutrition.emptyMessage")}
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <Card
              key={entry.id}
              style={[
                styles.entryCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content style={styles.entryContent}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                  >
                    {entry.name}
                  </Text>
                  <View style={styles.entryMeta}>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {t("nutrition.macroLine", {
                        protein: entry.protein,
                        carbs: entry.carbs,
                        fat: entry.fat,
                      })}
                    </Text>
                    {entry.meal && (
                      <Chip
                        compact
                        style={[styles.mealBadge, { backgroundColor: theme.colors.surfaceVariant }]}
                        textStyle={{ fontSize: 10, color: theme.colors.onSurfaceVariant }}
                      >
                        {mealLabel(entry.meal as MealType)}
                      </Chip>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: "center", marginRight: 4 }}>
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.primary, fontWeight: "700" }}
                  >
                    {entry.calories}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {t("nutrition.cal")}
                  </Text>
                </View>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => handleDelete(entry.id)}
                  disabled={deleteEntry.isPending}
                />
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const theme = useTheme<AppTheme>();
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroBarHeader}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {Math.round(current)} / {goal}g
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={color}
        style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  summaryCard: { borderRadius: 20, elevation: 0, marginTop: 16, marginBottom: 20 },
  calorieRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  remainingBadge: { alignItems: "center" },
  macrosSection: { gap: 12 },
  macroBar: {},
  macroBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressBar: { height: 8, borderRadius: 4 },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  formCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  formInput: { marginBottom: 8 },
  formRow: { flexDirection: "row", gap: 8 },
  outline: { borderRadius: 10 },
  mealChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  mealChip: { borderRadius: 20 },
  mealBadge: { marginTop: 4, alignSelf: "flex-start", borderRadius: 20 },
  entryCard: { borderRadius: 14, elevation: 0, marginBottom: 8 },
  entryContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  entryMeta: { marginTop: 2, gap: 4 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  cancelButton: {
    flex: 1,
    marginTop: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
  },
});
