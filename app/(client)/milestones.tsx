import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { useClientResults } from "@/lib/queries/results";
import { ErrorState } from "@/components/ErrorState";
import { computeMilestones, type Milestone } from "@/lib/milestones";

function MilestoneBadge({ milestone }: { milestone: Milestone }) {
  const theme = useTheme();

  return (
    <Card
      style={[
        styles.badgeCard,
        {
          backgroundColor: milestone.earned
            ? theme.colors.surface
            : theme.colors.surfaceVariant,
          opacity: milestone.earned ? 1 : 0.5,
        },
      ]}
    >
      <Card.Content style={styles.badgeContent}>
        <View
          style={[
            styles.badgeIcon,
            {
              backgroundColor: milestone.earned
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={milestone.icon as any}
            size={28}
            color={
              milestone.earned
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
          />
        </View>
        <Text
          variant="titleSmall"
          style={{
            color: milestone.earned
              ? theme.colors.onSurface
              : theme.colors.onSurfaceVariant,
            fontWeight: "700",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {milestone.title}
        </Text>
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginTop: 2,
            fontSize: 11,
          }}
        >
          {milestone.description}
        </Text>
        {milestone.earned && (
          <View style={styles.earnedBadge}>
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color="#22C55E"
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function MilestonesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: workouts = [], isLoading: workoutsLoading, isError: workoutsError, refetch: refetchWorkouts } = useClientWorkouts(
    userId ?? ""
  );
  const { data: results = [], isLoading: resultsLoading, isError: resultsError, refetch: refetchResults } = useClientResults(
    userId ?? ""
  );

  const milestones = useMemo(
    () => computeMilestones(workouts, results, t),
    [workouts, results, t]
  );

  const earned = milestones.filter((m) => m.earned);
  const remaining = milestones.filter((m) => !m.earned);

  if (workoutsLoading || resultsLoading) {
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

  if (workoutsError || resultsError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => { refetchWorkouts(); refetchResults(); }} />
      </SafeAreaView>
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
          {t("milestones.title")}
        </Text>

        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text
                variant="displaySmall"
                style={{ color: theme.colors.primary, fontWeight: "800" }}
              >
                {earned.length}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("milestones.earned")}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text
                variant="displaySmall"
                style={{ color: theme.colors.onSurfaceVariant, fontWeight: "800" }}
              >
                {remaining.length}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t("milestones.remaining")}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {earned.length > 0 && (
          <>
            <Text
              variant="titleLarge"
              style={{
                color: theme.colors.onSurface,
                fontWeight: "700",
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              {t("milestones.earned")}
            </Text>
            <View style={styles.badgeGrid}>
              {earned.map((m) => (
                <MilestoneBadge key={m.id} milestone={m} />
              ))}
            </View>
          </>
        )}

        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          {earned.length > 0 ? t("milestones.upNext") : t("milestones.allMilestones")}
        </Text>
        <View style={styles.badgeGrid}>
          {remaining.map((m) => (
            <MilestoneBadge key={m.id} milestone={m} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  summaryCard: { flex: 1, borderRadius: 16, elevation: 0 },
  summaryContent: { alignItems: "center", paddingVertical: 16 },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    borderRadius: 16,
    elevation: 0,
    width: "31%",
    position: "relative",
  },
  badgeContent: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  earnedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
