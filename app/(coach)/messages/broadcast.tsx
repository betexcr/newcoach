import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import {
  Text,
  useTheme,
  TextInput,
  Avatar,
  Checkbox,
  Searchbar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCoachClients, type ClientWithProfile } from "@/lib/queries/clients";
import {
  useCreateConversation,
  useSendMessage,
} from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";
import { ErrorState } from "@/components/ErrorState";

function ClientRow({
  client,
  selected,
  onToggle,
}: {
  client: ClientWithProfile;
  selected: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const initials = client.profile?.full_name
    ? client.profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Pressable
      style={[
        styles.clientRow,
        {
          backgroundColor: selected
            ? `${theme.colors.primary}10`
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : "transparent",
        },
      ]}
      onPress={onToggle}
    >
      <Avatar.Text
        size={40}
        label={initials}
        style={{
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.colors.surfaceVariant,
        }}
        labelStyle={{
          color: selected
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant,
        }}
      />
      <View style={styles.clientInfo}>
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          numberOfLines={1}
        >
          {client.profile?.full_name ?? t("clients.unknown")}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
          numberOfLines={1}
        >
          {client.profile?.email ?? ""}
        </Text>
      </View>
      <Checkbox
        status={selected ? "checked" : "unchecked"}
        color={theme.colors.primary}
      />
    </Pressable>
  );
}

export default function BroadcastScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError, refetch: refetchClients } = useCoachClients(userId ?? "");
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [broadcastName, setBroadcastName] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === "active"),
    [clients]
  );

  const filteredClients = useMemo(() => {
    if (!search.trim()) return activeClients;
    const q = search.toLowerCase();
    return activeClients.filter(
      (c) =>
        c.profile?.full_name?.toLowerCase().includes(q) ||
        (c.profile?.email ?? "").toLowerCase().includes(q)
    );
  }, [activeClients, search]);

  function toggleClient(clientId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function selectAll() {
    const visibleIds = filteredClients.map((c) => c.client_id);
    const allVisible = visibleIds.every((id) => selectedIds.has(id));
    if (allVisible && visibleIds.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.add(id);
        return next;
      });
    }
  }

  const allVisibleSelected = filteredClients.length > 0 && filteredClients.every((c) => selectedIds.has(c.client_id));

  async function handleSend() {
    if (!message.trim()) {
      Alert.alert(t("common.required"), t("messages.enterMessage"));
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert(t("common.required"), t("messages.selectAtLeastOne"));
      return;
    }
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    setIsSending(true);
    try {
      const conversation = await createConversation.mutateAsync({
        type: "broadcast",
        name: broadcastName.trim() || t("messages.broadcastDefaultName", { count: selectedIds.size }),
        createdBy: userId,
        participantIds: Array.from(selectedIds),
      });

      await sendMessage.mutateAsync({
        conversation_id: conversation.id,
        sender_id: userId,
        body: message.trim(),
      });

      Alert.alert(
        t("messages.sent"),
        t("messages.broadcastSent", { count: selectedIds.size }),
        [{ text: t("common.ok"), onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("messages.failedBroadcast"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("messages.broadcastTitle")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {clientsError ? (
        <ErrorState onRetry={refetchClients} />
      ) : clientsLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          mode="outlined"
          label={t("messages.broadcastNameLabel")}
          value={broadcastName}
          onChangeText={setBroadcastName}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <TextInput
          mode="outlined"
          label={t("messages.messageLabel")}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <View style={styles.recipientsHeader}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
            {t("messages.recipientsLabel")} ({selectedIds.size})
          </Text>
          {filteredClients.length > 0 && (
            <Pressable onPress={selectAll}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary, fontWeight: "600" }}
              >
                {allVisibleSelected
                  ? t("messages.deselectAll")
                  : t("messages.selectAll")}
              </Text>
            </Pressable>
          )}
        </View>

        {activeClients.length > 3 && (
          <Searchbar
            placeholder={t("messages.searchClients")}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            inputStyle={{ fontSize: 14 }}
          />
        )}

        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-group-outline"
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
              {activeClients.length === 0
                ? t("messages.noClientsForBroadcast")
                : t("messages.noClientsMatch")}
            </Text>
          </View>
        ) : (
          <View style={styles.clientList}>
            {filteredClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                selected={selectedIds.has(client.client_id)}
                onToggle={() => toggleClient(client.client_id)}
              />
            ))}
          </View>
        )}

        <AuthButton
          onPress={handleSend}
          loading={isSending}
          disabled={isSending || !message.trim() || selectedIds.size === 0}
          style={{ marginTop: 16 }}
        >
          {t("messages.sendToClients", { count: selectedIds.size })}
        </AuthButton>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
  },
  outline: {
    borderRadius: 12,
  },
  recipientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 0,
    marginBottom: 12,
  },
  clientList: {
    gap: 8,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
});
