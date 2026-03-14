import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Text, useTheme, Card, TextInput, ProgressBar, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthButton } from "@/components/AuthButton";
import { useAuthStore } from "@/stores/auth-store";
import { useNutritionLogs, useAddNutritionLog, useDeleteNutritionLog } from "@/lib/queries/nutrition";
import { formatDate } from "@/lib/date-utils";
import type { NutritionLog } from "@/types/database";

const MACRO_GOALS = {
  calories: 2200,
  protein: 160,
  carbs: 250,
  fat: 70,
};

export default function NutritionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const today = formatDate(new Date());
  const { data: entries = [] } = useNutritionLogs(userId ?? "", today);
  const addEntry = useAddNutritionLog();
  const deleteEntry = useDeleteNutritionLog();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

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
    if (!name.trim() || !userId) return;
    try {
      await addEntry.mutateAsync({
        client_id: userId,
        name: name.trim(),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        meal: "snack",
        logged_date: today,
      });
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setShowForm(false);
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? t("nutrition.failedAddEntry"));
    }
  }

  function handleDelete(id: string) {
    Alert.alert(t("nutrition.deleteEntry"), t("nutrition.deleteEntryConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteEntry.mutate(id),
      },
    ]);
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
    const progress = Math.min(current / goal, 1);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("nutrition.title")}
        </Text>

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
                  {t("nutrition.ofCal", { count: MACRO_GOALS.calories })}
                </Text>
              </View>
              <View style={styles.remainingBadge}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.secondary, fontWeight: "700" }}
                >
                  {Math.max(MACRO_GOALS.calories - totals.calories, 0)}
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
                goal={MACRO_GOALS.protein}
                color="#EF4444"
              />
              <MacroBar
                label={t("nutrition.carbs")}
                current={totals.carbs}
                goal={MACRO_GOALS.carbs}
                color="#F59E0B"
              />
              <MacroBar
                label={t("nutrition.fat")}
                current={totals.fat}
                goal={MACRO_GOALS.fat}
                color="#3B82F6"
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.entriesHeader}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("nutrition.foodLog")}
          </Text>
          <Pressable onPress={() => setShowForm(!showForm)}>
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
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                  >
                    P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g
                  </Text>
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
                />
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
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
  entryCard: { borderRadius: 14, elevation: 0, marginBottom: 8 },
  entryContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
});
