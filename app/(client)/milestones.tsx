import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
} from "react-native";
import { Text, useTheme, Card, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { useClientResults } from "@/lib/queries/results";
import { ErrorState } from "@/components/ErrorState";
import { computeMilestones, type Milestone } from "@/lib/milestones";
import type { AppTheme } from "@/lib/theme";

function MilestoneTooltip({
  milestone,
  visible,
  onDismiss,
}: {
  milestone: Milestone | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  if (!milestone) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.tooltipIcon,
              {
                backgroundColor: milestone.earned
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={milestone.icon as any}
              size={40}
              color={
                milestone.earned
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
          </View>

          <Text
            variant="titleLarge"
            style={{
              color: theme.colors.onSurface,
              fontWeight: "800",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {milestone.title}
          </Text>

          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.primary,
              fontStyle: "italic",
              textAlign: "center",
              marginTop: 8,
              lineHeight: 20,
              paddingHorizontal: 8,
            }}
          >
            "{milestone.flavor}"
          </Text>

          <View
            style={[
              styles.howToBox,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("milestones.howToEarn")}
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurface,
                marginTop: 4,
                lineHeight: 20,
              }}
            >
              {milestone.howTo}
            </Text>
          </View>

          {milestone.earned && (
            <View style={styles.unlockedRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.custom.success}
              />
              <Text
                variant="labelLarge"
                style={{
                  color: theme.custom.success,
                  fontWeight: "700",
                  marginLeft: 6,
                }}
              >
                {t("milestones.unlocked")}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MilestoneBadge({
  milestone,
  onPress,
}: {
  milestone: Milestone;
  onPress: (m: Milestone) => void;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      onPress={() => onPress(milestone)}
      style={({ pressed }) => [
        styles.badgeCard,
        {
          backgroundColor: milestone.earned
            ? theme.colors.surface
            : theme.colors.surfaceVariant,
          opacity: pressed ? 0.7 : milestone.earned ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.badgeContent}>
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
              color={theme.custom.success}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function MilestonesScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: workouts = [], isLoading: workoutsLoading, isError: workoutsError, refetch: refetchWorkouts, isRefetching: isRefetchingW } = useClientWorkouts(
    userId ?? ""
  );
  const { data: results = [], isLoading: resultsLoading, isError: resultsError, refetch: refetchResults, isRefetching: isRefetchingR } = useClientResults(
    userId ?? ""
  );

  const milestones = useMemo(
    () => computeMilestones(workouts, results, t),
    [workouts, results, t]
  );

  const earned = milestones.filter((m) => m.earned);
  const remaining = milestones.filter((m) => !m.earned);

  const [selected, setSelected] = useState<Milestone | null>(null);
  const openTooltip = useCallback((m: Milestone) => setSelected(m), []);
  const closeTooltip = useCallback(() => setSelected(null), []);

  if (workoutsLoading || resultsLoading || !userId) {
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingW || isRefetchingR}
            onRefresh={() => { refetchWorkouts(); refetchResults(); }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
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
                <MilestoneBadge key={m.id} milestone={m} onPress={openTooltip} />
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
            <MilestoneBadge key={m.id} milestone={m} onPress={openTooltip} />
          ))}
        </View>
      </ScrollView>

      <MilestoneTooltip
        milestone={selected}
        visible={selected !== null}
        onDismiss={closeTooltip}
      />
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  tooltip: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tooltipIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  howToBox: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
});
