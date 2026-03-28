import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { Text, useTheme, FAB, Avatar, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useConversations, type ConversationWithLastMessage } from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import { ErrorState } from "@/components/ErrorState";

function ConversationItem({
  conversation,
  onPress,
}: {
  conversation: ConversationWithLastMessage;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const typeIcons: Record<string, string> = {
    direct: "account",
    group: "account-group",
    broadcast: "bullhorn",
  };

  const preview = conversation.last_message?.body;
  const timestamp = conversation.last_message
    ? new Date(conversation.last_message.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : undefined;

  return (
    <Pressable
      style={[styles.convoItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <Avatar.Icon
        size={48}
        icon={typeIcons[conversation.type] ?? "message"}
        style={{ backgroundColor: theme.colors.primaryContainer }}
        color={theme.colors.primary}
      />
      <View style={styles.convoInfo}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "600", flex: 1 }}
            numberOfLines={1}
          >
            {conversation.name ?? t("messages.directMessage")}
          </Text>
          {timestamp && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {timestamp}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
          numberOfLines={1}
        >
          {preview ?? t("messages.tapToChat")}
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

export default function CoachMessagesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useConversations(userId ?? "");

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
          {t("messages.title")}
        </Text>
      </View>

      {isLoading || !userId ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="message-outline"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("messages.noConversations")}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {t("messages.coachEmptyState")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() =>
                router.push({
                  pathname: "/(coach)/messages/chat",
                  params: { conversationId: item.id, name: item.name ?? t("messages.chatTitle") },
                })
              }
            />
          )}
        />
      )}

      <View style={styles.fabGroup}>
        <FAB
          icon="bullhorn"
          style={[styles.fabSecondary, { backgroundColor: theme.colors.secondaryContainer }]}
          color={theme.colors.secondary}
          onPress={() => router.push("/(coach)/messages/broadcast")}
          size="small"
          label={t("messages.typeBroadcast")}
        />
        <FAB
          icon="message-plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => router.push("/(coach)/messages/new-chat")}
          label={t("messages.newMessage")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 100 },
  convoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  convoInfo: { flex: 1, marginLeft: 12 },
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
  fabGroup: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "flex-end",
    gap: 10,
  },
  fabSecondary: {
    borderRadius: 28,
  },
  fab: {
    borderRadius: 28,
  },
});
