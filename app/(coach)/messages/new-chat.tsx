import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Text, useTheme, Searchbar, Avatar, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { useCoachClients, type ClientWithProfile } from "@/lib/queries/clients";
import { useCreateConversation, useConversations } from "@/lib/queries/messaging";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { ErrorState } from "@/components/ErrorState";

export default function NewChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const { preselectedClientId, preselectedClientName } = useLocalSearchParams<{
    preselectedClientId?: string;
    preselectedClientName?: string;
  }>();

  const { data: clients = [], isLoading, isError: clientsError, refetch: refetchClients } = useCoachClients(userId);
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(userId);
  const createConversation = useCreateConversation();
  const [search, setSearch] = useState("");
  const selectingRef = useRef(false);

  const filtered = useMemo(() => {
    const active = clients.filter((c) => c.status === "active");
    if (!search.trim()) return active;
    const q = search.toLowerCase();
    return active.filter(
      (c) =>
        c.profile?.full_name?.toLowerCase().includes(q) ||
        c.profile?.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleSelect = useCallback(async (client: ClientWithProfile) => {
    if (selectingRef.current) return;
    selectingRef.current = true;
    const clientName = client.profile?.full_name ?? t("dashboard.fallbackClient");

    const { data: sharedConvs, error: lookupError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", client.client_id);

    if (lookupError) {
      selectingRef.current = false;
      Alert.alert(t("common.error"), t("common.errorGeneric"));
      return;
    }

    const clientConvIds = new Set((sharedConvs ?? []).map((p) => p.conversation_id));
    const existingDirect = conversations.find(
      (c) => c.type === "direct" && clientConvIds.has(c.id)
    );

    if (existingDirect) {
      useChatNavStore.getState().set(existingDirect.id, clientName);
      router.replace({
        pathname: "/(coach)/messages/chat",
        params: { conversationId: existingDirect.id, name: clientName },
      });
      return;
    }

    try {
      const conv = await createConversation.mutateAsync({
        type: "direct",
        name: clientName,
        createdBy: userId,
        participantIds: [client.client_id],
      });
      useChatNavStore.getState().set(conv.id, clientName);
      router.replace({
        pathname: "/(coach)/messages/chat",
        params: { conversationId: conv.id, name: clientName },
      });
    } catch (err: any) {
      selectingRef.current = false;
      Alert.alert(t("common.error"), err.message);
    }
  }, [userId, conversations, t, createConversation, router]);

  const autoSelectDone = useRef(false);
  useEffect(() => {
    if (autoSelectDone.current || !preselectedClientId || isLoading || conversationsLoading) return;
    const match = clients.find((c) => c.client_id === preselectedClientId);
    if (match) {
      autoSelectDone.current = true;
      handleSelect(match);
    } else {
      autoSelectDone.current = true;
      Alert.alert(t("common.error"), t("messages.clientNotFound"));
    }
  }, [preselectedClientId, clients, isLoading, conversationsLoading]);

  if (preselectedClientId && !autoSelectDone.current) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12 }}
        >
          {t("messages.newMessage")}
        </Text>
      </View>

      <Searchbar
        placeholder={t("messages.searchClients")}
        onChangeText={setSearch}
        value={search}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
      />

      {clientsError ? (
        <ErrorState onRetry={refetchClients} />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("messages.noClientsMatch")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = item.profile?.full_name ?? t("clients.unknown");
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase();

            return (
              <Pressable
                style={[styles.clientRow, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleSelect(item)}
              >
                <Avatar.Text
                  size={44}
                  label={initials}
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  labelStyle={{ color: theme.colors.primary }}
                />
                <View style={styles.clientInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                    {name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.profile?.email ?? ""}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
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
  searchBar: {
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 0,
  },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  clientInfo: { flex: 1, marginLeft: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 48 },
});
