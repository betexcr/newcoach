import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import {
  Text,
  useTheme,
  Avatar,
  Card,
  Chip,
  FAB,
  ActivityIndicator,
  SegmentedButtons,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { useClientResults } from "@/lib/queries/results";
import { useClientHabits } from "@/lib/queries/habits";
import { useRemoveClient, type ClientWithProfile } from "@/lib/queries/clients";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import type { AssignedWorkout, WorkoutResult, Habit } from "@/types/database";

type ProfileTab = "workouts" | "progress" | "habits";

export default function ClientProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const {
    clientId,
    clientName,
    clientEmail,
    clientStatus,
    relationshipId,
  } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientStatus: string;
    relationshipId: string;
  }>();

  const userId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<ProfileTab>("workouts");

  const { data: workouts = [], isLoading: loadingWorkouts } = useClientWorkouts(clientId ?? "");
  const { data: results = [], isLoading: loadingResults } = useClientResults(clientId ?? "");
  const { data: habits = [], isLoading: loadingHabits } = useClientHabits(clientId ?? "");
  const removeClient = useRemoveClient();

  const completedCount = useMemo(
    () => workouts.filter((w) => w.status === "completed").length,
    [workouts]
  );

  const complianceRate = useMemo(() => {
    if (workouts.length === 0) return 0;
    return Math.round((completedCount / workouts.length) * 100);
  }, [workouts, completedCount]);

  const streak = useMemo(() => {
    const sorted = workouts
      .filter((w) => w.status === "completed")
      .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
    if (sorted.length === 0) return 0;

    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].scheduled_date);
      const curr = new Date(sorted[i].scheduled_date);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) count++;
      else break;
    }
    return count;
  }, [workouts]);

  const initials = clientName
    ? clientName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const statusColor =
    clientStatus === "active"
      ? "#22C55E"
      : clientStatus === "pending"
        ? "#F59E0B"
        : "#9CA3AF";

  function handleRemoveClient() {
    Alert.alert(
      t("clientProfile.removeClient"),
      t("clientProfile.removeConfirm", { name: clientName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            if (!relationshipId) return;
            try {
              await removeClient.mutateAsync(relationshipId);
              router.back();
            } catch (err: any) {
              Alert.alert(t("common.error"), err.message);
            }
          },
        },
      ]
    );
  }

  function handleMessageClient() {
    router.push({
      pathname: "/(coach)/messages/new-chat",
      params: { preselectedClientId: clientId, preselectedClientName: clientName },
    } as any);
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
          style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1, marginLeft: 12 }}
          numberOfLines={1}
        >
          {clientName ?? t("clients.unknown")}
        </Text>
        <Pressable onPress={handleRemoveClient}>
          <MaterialCommunityIcons
            name="account-remove"
            size={24}
            color={theme.colors.error}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={72}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary, fontSize: 28 }}
          />
          <View style={styles.profileInfo}>
            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {clientName}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {clientEmail ?? ""}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: statusColor }]} />
              <Text
                variant="labelMedium"
                style={{ color: statusColor, textTransform: "capitalize", fontWeight: "600" }}
              >
                {clientStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {completedCount}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("clientProfile.completed")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {complianceRate}%
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("clientProfile.compliance")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {streak}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("clientProfile.streak")}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              useWorkoutBuilderStore.getState().reset();
              router.push({
                pathname: "/(coach)/clients/assign-workout",
                params: { clientId, clientName },
              } as any);
            }}
          >
            <MaterialCommunityIcons name="dumbbell" size={20} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "600", marginLeft: 6 }}>
              {t("clientProfile.assignWorkout")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleMessageClient}
          >
            <MaterialCommunityIcons name="message" size={20} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "600", marginLeft: 6 }}>
              {t("clientProfile.message")}
            </Text>
          </Pressable>
        </View>

        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as ProfileTab)}
          buttons={[
            { value: "workouts", label: t("clientProfile.tabWorkouts") },
            { value: "progress", label: t("clientProfile.tabProgress") },
            { value: "habits", label: t("clientProfile.tabHabits") },
          ]}
          style={styles.tabs}
        />

        {tab === "workouts" && (
          <WorkoutsTab
            workouts={workouts}
            results={results}
            loading={loadingWorkouts}
            theme={theme}
            t={t}
            router={router}
            clientName={clientName ?? ""}
          />
        )}
        {tab === "progress" && (
          <ProgressTab
            workouts={workouts}
            results={results}
            loading={loadingResults}
            theme={theme}
            t={t}
          />
        )}
        {tab === "habits" && (
          <HabitsTab
            habits={habits}
            loading={loadingHabits}
            theme={theme}
            t={t}
            router={router}
            coachId={userId ?? ""}
            clientId={clientId ?? ""}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkoutsTab({
  workouts,
  results,
  loading,
  theme,
  t,
  router,
  clientName,
}: {
  workouts: AssignedWorkout[];
  results: WorkoutResult[];
  loading: boolean;
  theme: any;
  t: any;
  router: any;
  clientName: string;
}) {
  const resultMap = useMemo(() => {
    const map: Record<string, WorkoutResult> = {};
    for (const r of results) map[r.assigned_workout_id] = r;
    return map;
  }, [results]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <MaterialCommunityIcons name="dumbbell" size={40} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          {t("clientProfile.noWorkoutsYet")}
        </Text>
      </View>
    );
  }

  const sorted = [...workouts].sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));

  return (
    <View>
      {sorted.map((w) => {
        const statusColors: Record<string, string> = {
          completed: "#22C55E",
          pending: "#F59E0B",
          missed: "#EF4444",
          partial: "#F97316",
        };
        const color = statusColors[w.status] ?? "#9CA3AF";
        const result = resultMap[w.id];

        return (
          <Pressable
            key={w.id}
            style={[styles.workoutRow, { backgroundColor: theme.colors.surface }]}
            onPress={() =>
              router.push({
                pathname: "/(coach)/clients/workout-detail",
                params: { workoutId: w.id, clientName },
              } as any)
            }
          >
            <View style={[styles.workoutStatusDot, { backgroundColor: color }]} />
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {w.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {new Date(w.scheduled_date).toLocaleDateString()} · {w.exercises?.length ?? 0} {t("clients.exercises").toLowerCase()}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Chip
                compact
                textStyle={{ fontSize: 10, color, fontWeight: "600" }}
                style={{ backgroundColor: `${color}15` }}
              >
                {w.status}
              </Chip>
              {result && (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {t("clientProfile.hasResults")}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgressTab({
  workouts,
  results,
  loading,
  theme,
  t,
}: {
  workouts: AssignedWorkout[];
  results: WorkoutResult[];
  loading: boolean;
  theme: any;
  t: any;
}) {
  const exerciseStats = useMemo(() => {
    const stats: Record<string, { count: number; maxWeight: number }> = {};
    for (const r of results) {
      if (!Array.isArray(r.logged_sets)) continue;
      for (const ex of r.logged_sets) {
        if (!stats[ex.exercise_name]) {
          stats[ex.exercise_name] = { count: 0, maxWeight: 0 };
        }
        stats[ex.exercise_name].count++;
        for (const s of ex.sets) {
          if (s.weight && s.weight > stats[ex.exercise_name].maxWeight) {
            stats[ex.exercise_name].maxWeight = s.weight;
          }
        }
      }
    }
    return Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [results]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
        {t("clientProfile.exerciseStats")}
      </Text>
      {exerciseStats.length === 0 ? (
        <View style={styles.emptyTab}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("clientProfile.noResultsYet")}
          </Text>
        </View>
      ) : (
        exerciseStats.map(([name, stat]) => (
          <View
            key={name}
            style={[styles.statRow, { backgroundColor: theme.colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {stat.count} {t("clientProfile.sessions")}
              </Text>
            </View>
            {stat.maxWeight > 0 && (
              <Chip compact textStyle={{ fontSize: 11, fontWeight: "600" }}>
                {t("clientProfile.pr")}: {stat.maxWeight} lbs
              </Chip>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function HabitsTab({
  habits,
  loading,
  theme,
  t,
  router,
  coachId,
  clientId,
}: {
  habits: Habit[];
  loading: boolean;
  theme: any;
  t: any;
  router: any;
  coachId: string;
  clientId: string;
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {habits.length === 0 ? (
        <View style={styles.emptyTab}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={40} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {t("clientProfile.noHabitsYet")}
          </Text>
        </View>
      ) : (
        habits.map((h) => (
          <View key={h.id} style={[styles.habitRow, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {h.name}
              </Text>
              {h.description && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {h.description}
                </Text>
              )}
              <Text variant="labelSmall" style={{ color: theme.colors.primary, textTransform: "capitalize", marginTop: 2 }}>
                {h.frequency}
              </Text>
            </View>
          </View>
        ))
      )}
      <Pressable
        style={[styles.addHabitButton, { borderColor: theme.colors.primary }]}
        onPress={() =>
          router.push({
            pathname: "/(coach)/clients/create-habit",
            params: { clientId, coachId },
          } as any)
        }
      >
        <MaterialCommunityIcons name="plus-circle" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 6 }}>
          {t("clientProfile.addHabit")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: { padding: 16, paddingBottom: 32 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileInfo: { marginLeft: 16, flex: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 12 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabs: { marginBottom: 16 },
  loadingContainer: { paddingVertical: 40, alignItems: "center" },
  emptyTab: { alignItems: "center", paddingVertical: 40 },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  addHabitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    marginTop: 8,
  },
});
