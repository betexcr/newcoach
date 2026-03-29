import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { safeDateString } from "@/lib/date-utils";
import { Text, useTheme, Avatar, FAB, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useConversations, useCreateConversation, type ConversationWithLastMessage } from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { ErrorState } from "@/components/ErrorState";
import { supabase } from "@/lib/supabase";

export default function ClientMessagesScreen() {
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
  const createConversation = useCreateConversation();
  const [creatingChat, setCreatingChat] = useState(false);

  async function handleNewChat() {
    if (!userId) return;
    setCreatingChat(true);
    try {
      const { data: rel, error: relError } = await supabase
        .from("coach_clients")
        .select("coach_id, profiles!coach_clients_coach_id_fkey(full_name)")
        .eq("client_id", userId)
        .limit(1)
        .single();

      if (relError && relError.code !== "PGRST116") {
        Alert.alert(t("common.error"), t("common.errorGeneric"));
        setCreatingChat(false);
        return;
      }

      if (!rel) {
        Alert.alert(t("common.error"), t("messages.noCoachLinked"));
        setCreatingChat(false);
        return;
      }

      const coachName = (rel as any).profiles?.full_name ?? t("messages.coachFallback");

      const { data: coachConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", rel.coach_id);

      const coachConvIds = new Set((coachConvs ?? []).map((p) => p.conversation_id));
      const existingDirect = conversations.find(
        (c) => c.type === "direct" && coachConvIds.has(c.id)
      );
      if (existingDirect) {
        useChatNavStore.getState().set(existingDirect.id, coachName);
        router.push({
          pathname: "/(client)/messages/chat",
          params: { conversationId: existingDirect.id, name: coachName },
        });
        setCreatingChat(false);
        return;
      }

      const conv = await createConversation.mutateAsync({
        type: "direct",
        name: coachName,
        createdBy: userId,
        participantIds: [rel.coach_id],
      });
      useChatNavStore.getState().set(conv.id, coachName);
      router.push({
        pathname: "/(client)/messages/chat",
        params: { conversationId: conv.id, name: coachName },
      });
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("common.errorGeneric"));
    } finally {
      setCreatingChat(false);
    }
  }

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
            {t("messages.noMessages")}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {t("messages.clientEmptyState")}
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
            <Pressable
              style={[
                styles.convoItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => {
                useChatNavStore.getState().set(item.id, item.name ?? t("messages.coachFallback"));
                router.push({
                  pathname: "/(client)/messages/chat",
                  params: {
                    conversationId: item.id,
                    name: item.name ?? t("messages.coachFallback"),
                  },
                });
              }}
            >
              <Avatar.Icon
                size={48}
                icon="account"
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
                    {item.name ?? t("messages.coachFallback")}
                  </Text>
                  {(item as ConversationWithLastMessage).last_message && (
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                      {safeDateString((item as ConversationWithLastMessage).last_message!.created_at, { month: "short", day: "numeric" })}
                    </Text>
                  )}
                </View>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  numberOfLines={1}
                >
                  {(item as ConversationWithLastMessage).last_message?.body ?? t("messages.tapToChat")}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        />
      )}

      <FAB
        icon="message-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={handleNewChat}
        loading={creatingChat}
        label={t("messages.newMessage")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  list: { paddingHorizontal: 16, gap: 8 },
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
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
