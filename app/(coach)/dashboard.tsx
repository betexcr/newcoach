import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text, useTheme, Card, Avatar, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachClients } from "@/lib/queries/clients";
import {
  useCoachWorkoutsToday,
  useCoachRecentWorkouts,
} from "@/lib/queries/workouts";
import { useConversations } from "@/lib/queries/messaging";
import { useSubscription } from "@/lib/queries/billing";
import { ErrorState } from "@/components/ErrorState";
import { safeDateTimeString } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { AssignedWorkout } from "@/types/database";
import type { ClientWithProfile } from "@/lib/queries/clients";

interface ActivityItem {
  id: string;
  type: "workout_assigned" | "client_added" | "workout_completed";
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  timestamp: string;
  workoutId?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientStatus?: string;
  relationshipId?: string;
}

function buildActivityFeed(
  recentWorkouts: AssignedWorkout[],
  clients: ClientWithProfile[],
  t: (key: string, opts?: Record<string, unknown>) => string,
  theme: AppTheme
): ActivityItem[] {
  const items: ActivityItem[] = [];

  const clientLookup: Record<string, ClientWithProfile> = {};
  for (const c of clients) {
    clientLookup[c.client_id] = c;
  }

  for (const w of recentWorkouts) {
    const cl = clientLookup[w.client_id];
    items.push({
      id: `w-${w.id}`,
      type:
        w.status === "completed" ? "workout_completed" : "workout_assigned",
      title:
        w.status === "completed"
          ? t("dashboard.activityCompleted", { name: w.name })
          : t("dashboard.activityAssigned", { name: w.name }),
      subtitle: safeDateTimeString(w.created_at, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      icon: w.status === "completed" ? "check-circle" : "dumbbell",
      color: w.status === "completed" ? theme.colors.secondary : theme.colors.primary,
      timestamp: w.created_at,
      workoutId: w.id,
      clientId: w.client_id,
      clientName: cl?.profile?.full_name ?? t("dashboard.fallbackClient"),
      clientEmail: cl?.profile?.email ?? "",
      clientStatus: cl?.status ?? "active",
      relationshipId: cl?.id ?? "",
    });
  }

  for (const c of clients) {
    items.push({
      id: `c-${c.id}`,
      type: "client_added",
      title: t("dashboard.clientJoined", { name: c.profile?.full_name ?? t("dashboard.fallbackClient") }),
      subtitle: safeDateTimeString(c.created_at, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      icon: "account-plus",
      color: theme.colors.secondary,
      timestamp: c.created_at,
      clientId: c.client_id,
      clientName: c.profile?.full_name ?? t("dashboard.fallbackClient"),
      clientEmail: c.profile?.email ?? "",
      clientStatus: c.status ?? "active",
      relationshipId: c.id ?? "",
    });
  }

  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return items.slice(0, 10);
}

export default function CoachDashboard() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isError: clientsError,
    refetch: refetchClients,
    isRefetching: isRefetchingClients,
  } = useCoachClients(userId);
  const {
    data: todayWorkouts = [],
    isLoading: todayLoading,
    isError: todayError,
    refetch: refetchToday,
    isRefetching: isRefetchingToday,
  } = useCoachWorkoutsToday(userId);
  const {
    data: recentWorkouts = [],
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
    isRefetching: isRefetchingRecent,
  } = useCoachRecentWorkouts(userId);
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: convosError,
    refetch: refetchConvos,
    isRefetching: isRefetchingConvos,
  } = useConversations(userId);
  const { data: subscription } = useSubscription(userId);

  const dashboardLoading =
    !userId ||
    clientsLoading ||
    todayLoading ||
    recentLoading ||
    conversationsLoading;

  const dashboardError =
    clientsError ||
    todayError ||
    recentError ||
    convosError;

  const activeClientCount = useMemo(
    () => clients.filter((c) => c.status === "active").length,
    [clients]
  );

  const activityFeed = useMemo(
    () => buildActivityFeed(recentWorkouts, clients, t, theme),
    [recentWorkouts, clients, t, theme]
  );

  const stats = [
    {
      label: t("dashboard.activeClients"),
      value: String(activeClientCount),
      icon: "account-group",
      onPress: () => router.push("/(coach)/clients/index" as any),
    },
    {
      label: t("dashboard.todaysWorkouts"),
      value: String(todayWorkouts.length),
      icon: "dumbbell",
      onPress: () => router.push("/(coach)/clients/index" as any),
    },
    {
      label: t("dashboard.messages"),
      value: String(conversations.length),
      icon: "message",
      onPress: () => router.push("/(coach)/messages/index" as any),
    },
    {
      label: t("billing.currentPlan"),
      value: subscription ? t(`billing.${subscription.plan}`) : "—",
      icon: "credit-card-outline",
      onPress: () => router.push("/(coach)/settings" as any),
    },
  ];

  const quickActions = [
    {
      label: t("dashboard.newWorkout"),
      icon: "plus-circle",
      color: theme.colors.primary,
      onPress: () => router.push("/(coach)/library/workout-builder"),
    },
    {
      label: t("dashboard.addClient"),
      icon: "account-plus",
      color: theme.colors.secondary,
      onPress: () => router.push("/(coach)/clients/add-client"),
    },
    {
      label: t("dashboard.newProgram"),
      icon: "clipboard-list",
      color: theme.custom.warning,
      onPress: () => router.push("/(coach)/library/create-program"),
    },
    {
      label: t("dashboard.broadcast"),
      icon: "bullhorn",
      color: theme.custom.purple,
      onPress: () => router.push("/(coach)/messages/broadcast"),
    },
  ];

  if (dashboardLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => { refetchClients(); refetchToday(); refetchRecent(); refetchConvos(); }} />
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
            refreshing={
              isRefetchingClients ||
              isRefetchingToday ||
              isRefetchingRecent ||
              isRefetchingConvos
            }
            onRefresh={() => {
              refetchClients();
              refetchToday();
              refetchRecent();
              refetchConvos();
            }}
          />
        }
      >
        <View style={styles.greeting}>
          <View>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {t("dashboard.greeting")}
            </Text>
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {profile?.full_name ?? t("dashboard.fallbackCoach")}
            </Text>
          </View>
          <Avatar.Text
            size={48}
            label={
              profile?.full_name
                ? profile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "C"
            }
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <Card
              key={stat.label}
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={stat.onPress}
            >
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons
                  name={stat.icon as any}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  variant="headlineMedium"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: "700",
                    marginTop: 8,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("dashboard.quickActions")}
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={[
                  styles.actionCard,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text
                  variant="labelLarge"
                  style={{
                    color: theme.colors.onSurface,
                    marginTop: 8,
                    fontWeight: "600",
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("dashboard.recentActivity")}
          </Text>

          {activityFeed.length === 0 ? (
            <Card
              style={{
                backgroundColor: theme.colors.surface,
                marginTop: 12,
              }}
            >
              <Card.Content style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={32}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {t("dashboard.noActivity")}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.activityList}>
              {activityFeed.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.activityRow,
                    { backgroundColor: theme.colors.surface },
                    index === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
                    index === activityFeed.length - 1 && {
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    if (item.workoutId) {
                      router.push({
                        pathname: "/(coach)/clients/workout-detail",
                        params: { workoutId: item.workoutId, clientName: item.clientName ?? t("dashboard.fallbackClient") },
                      } as any);
                    } else if (item.clientId) {
                      router.push({
                        pathname: "/(coach)/clients/client-profile",
                        params: {
                          clientId: item.clientId,
                          clientName: item.clientName ?? t("dashboard.fallbackClient"),
                          clientEmail: item.clientEmail ?? "",
                          clientStatus: item.clientStatus ?? "active",
                          relationshipId: item.relationshipId ?? "",
                        },
                      } as any);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.activityMeta}>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {item.subtitle}
                      </Text>
                      {item.clientName && (
                        <Pressable
                          style={[styles.clientTag, { backgroundColor: theme.colors.primaryContainer }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel={item.clientName ?? t("dashboard.fallbackClient")}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            if (item.clientId) {
                              router.push({
                                pathname: "/(coach)/clients/client-profile",
                                params: {
                                  clientId: item.clientId,
                                  clientName: item.clientName ?? t("dashboard.fallbackClient"),
                                  clientEmail: item.clientEmail ?? "",
                                  clientStatus: item.clientStatus ?? "active",
                                  relationshipId: item.relationshipId ?? "",
                                },
                              } as any);
                            }
                          }}
                        >
                          <MaterialCommunityIcons
                            name="account"
                            size={12}
                            color={theme.colors.primary}
                          />
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 3 }}
                            numberOfLines={1}
                          >
                            {item.clientName}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 0,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  activityList: {
    marginTop: 12,
    gap: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  clientTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});
