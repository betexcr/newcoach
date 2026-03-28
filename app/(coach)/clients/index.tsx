import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import {
  Text,
  useTheme,
  Searchbar,
  FAB,
  Avatar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachClients, type ClientWithProfile } from "@/lib/queries/clients";

const STATUS_FILTERS = ["All", "Active", "Pending", "Inactive"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function ClientsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: clients = [], isLoading } = useCoachClients(userId ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filterLabels: Record<StatusFilter, string> = {
    All: t("clients.filterAll"),
    Active: t("clients.filterActive"),
    Pending: t("clients.filterPending"),
    Inactive: t("clients.filterInactive"),
  };

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter !== "All") {
      list = list.filter(
        (c) => c.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.profile?.full_name?.toLowerCase().includes(q) ||
          c.profile?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, searchQuery, statusFilter]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("clients.title")}
        </Text>
        {clients.length > 0 && (
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          >
            {clients.length} {t("clients.total")}
          </Text>
        )}
      </View>

      <Searchbar
        placeholder={t("clients.searchPlaceholder")}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ fontSize: 15 }}
      />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => (
          <Chip
            key={filter}
            mode="outlined"
            selected={filter === statusFilter}
            onPress={() => setStatusFilter(filter)}
            style={[
              styles.filterChip,
              filter === statusFilter && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            textStyle={{ fontSize: 13 }}
          >
            {filterLabels[filter]}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group-outline"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {clients.length === 0 ? t("clients.noClients") : t("clients.noMatches")}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            {clients.length === 0
              ? t("clients.addFirstClient")
              : t("clients.tryDifferentSearch")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              theme={theme}
              onPress={() =>
                router.push({
                  pathname: "/(coach)/clients/client-profile",
                  params: {
                    clientId: item.client_id,
                    clientName: item.profile?.full_name ?? t("dashboard.fallbackClient"),
                    clientEmail: item.profile?.email ?? "",
                    clientStatus: item.status,
                    relationshipId: item.id,
                  },
                } as any)
              }
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => router.push("/(coach)/clients/add-client")}
        label={t("clients.addClient")}
      />
    </SafeAreaView>
  );
}

const statusColors: Record<string, string> = {
  active: "#22C55E",
  pending: "#F59E0B",
  inactive: "#9CA3AF",
};

function ClientRow({
  client,
  theme,
  onPress,
}: {
  client: ClientWithProfile;
  theme: any;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const profile = client.profile;
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";
  const color = statusColors[client.status] ?? statusColors.inactive;

  return (
    <Pressable
      style={[styles.clientRow, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      {profile?.avatar_url ? (
        <Avatar.Image size={48} source={{ uri: profile.avatar_url }} />
      ) : (
        <Avatar.Text
          size={48}
          label={initials}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          labelStyle={{ color: theme.colors.primary }}
        />
      )}
      <View style={styles.clientInfo}>
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          numberOfLines={1}
        >
          {profile?.full_name ?? t("clients.unknown")}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
          numberOfLines={1}
        >
          {profile?.email ?? "—"}
        </Text>
      </View>
      <View style={styles.statusDot}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text
          variant="labelSmall"
          style={{ color, textTransform: "capitalize", fontWeight: "600" }}
        >
          {t(`status.${client.status}`)}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  searchBar: {
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: { borderRadius: 20 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 80 },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  clientInfo: { flex: 1, marginLeft: 12 },
  statusDot: { alignItems: "center", marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
