import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Text, useTheme, Avatar, FAB, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useConversations, useCreateConversation } from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import type { Conversation } from "@/types/database";

export default function ClientMessagesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: conversations = [], isLoading } = useConversations(userId ?? "");
  const createConversation = useCreateConversation();
  const [creatingChat, setCreatingChat] = useState(false);

  async function handleNewChat() {
    if (!userId) return;
    setCreatingChat(true);
    try {
      const { data: rel } = await supabase
        .from("coach_clients")
        .select("coach_id, profiles!coach_clients_coach_id_fkey(full_name)")
        .eq("client_id", userId)
        .limit(1)
        .single();

      if (!rel) {
        Alert.alert(t("common.error"), t("messages.noCoachLinked"));
        setCreatingChat(false);
        return;
      }

      const coachName = (rel as any).profiles?.full_name ?? t("messages.coachFallback");

      const existingDirect = conversations.find(
        (c) => c.type === "direct" && c.created_by === rel.coach_id
      );
      if (existingDirect) {
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
      router.push({
        pathname: "/(client)/messages/chat",
        params: { conversationId: conv.id, name: coachName },
      });
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message);
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

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.convoItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(client)/messages/chat",
                  params: {
                    conversationId: item.id,
                    name: item.name ?? t("messages.coachFallback"),
                  },
                })
              }
            >
              <Avatar.Icon
                size={48}
                icon="account"
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={theme.colors.primary}
              />
              <View style={styles.convoInfo}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                >
                  {item.name ?? t("messages.coachFallback")}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t("messages.tapToChat")}
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
        color="#FFFFFF"
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
