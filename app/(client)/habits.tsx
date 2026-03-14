import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useClientHabits, useHabitLogs, useToggleHabitLog } from "@/lib/queries/habits";
import { formatDate } from "@/lib/date-utils";
import type { Habit } from "@/types/database";

function HabitItem({ habit }: { habit: Habit }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const toggleLog = useToggleHabitLog();
  const today = formatDate(new Date());
  const { data: logs = [] } = useHabitLogs(habit.id, today, today);
  const isCompleted = logs.some((l) => l.completed);

  const frequencyLabels: Record<string, string> = {
    daily: t("habits.daily"),
    weekly: t("habits.weekly"),
    monthly: t("habits.monthly"),
  };

  return (
    <Card style={[styles.habitCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.habitContent}>
        <Pressable
          style={[
            styles.checkCircle,
            {
              borderColor: theme.colors.primary,
              backgroundColor: isCompleted ? theme.colors.primary : "transparent",
            },
          ]}
          onPress={() =>
            toggleLog.mutate({
              habitId: habit.id,
              date: today,
              completed: !isCompleted,
            })
          }
        >
          {isCompleted && (
            <MaterialCommunityIcons
              name="check"
              size={18}
              color="#FFFFFF"
            />
          )}
        </Pressable>
        <View style={styles.habitInfo}>
          <Text
            variant="titleMedium"
            style={{
              color: theme.colors.onSurface,
              fontWeight: "600",
              textDecorationLine: isCompleted ? "line-through" : "none",
              opacity: isCompleted ? 0.6 : 1,
            }}
          >
            {habit.name}
          </Text>
          <View style={styles.habitMeta}>
            <MaterialCommunityIcons
              name="repeat"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
            >
              {frequencyLabels[habit.frequency] ?? habit.frequency}
            </Text>
          </View>
          {habit.description && (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              {habit.description}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function HabitsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: habits = [] } = useClientHabits(userId ?? "");

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
          {t("habits.title")}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginBottom: 20 }}
        >
          {t("habits.subtitle")}
        </Text>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="checkbox-marked-circle-outline"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {t("habits.noHabits")}
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {t("habits.noHabitsMessage")}
            </Text>
          </View>
        ) : (
          habits.map((habit) => <HabitItem key={habit.id} habit={habit} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  habitCard: { borderRadius: 14, elevation: 0, marginBottom: 10 },
  habitContent: { flexDirection: "row", alignItems: "center" },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  habitInfo: { flex: 1 },
  habitMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
});
