import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Text, useTheme, TextInput, Avatar, Checkbox, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { demoClients } from "./mock-data";
import type { AppTheme } from "@/lib/theme";

export default function DemoBroadcast() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [broadcastName, setBroadcastName] = useState("");
  const [search, setSearch] = useState("");

  const activeClients = useMemo(() => demoClients.filter((c) => c.status === "active"), []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return activeClients;
    const q = search.toLowerCase();
    return activeClients.filter((c) => c.profile?.full_name?.toLowerCase().includes(q) || (c.profile?.email ?? "").toLowerCase().includes(q));
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
      setSelectedIds((prev) => { const next = new Set(prev); for (const id of visibleIds) next.delete(id); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); for (const id of visibleIds) next.add(id); return next; });
    }
  }

  const allVisibleSelected = filteredClients.length > 0 && filteredClients.every((c) => selectedIds.has(c.client_id));

  function handleSend() {
    if (!message.trim()) { Alert.alert(t("common.required"), t("messages.enterMessage")); return; }
    if (selectedIds.size === 0) { Alert.alert(t("common.required"), t("messages.selectAtLeastOne")); return; }
    Alert.alert(t("messages.sent"), t("messages.broadcastSent", { count: selectedIds.size }), [
      { text: t("common.ok"), onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("messages.broadcastTitle")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput mode="outlined" label={t("messages.broadcastNameLabel")} value={broadcastName} onChangeText={setBroadcastName} style={styles.input} outlineStyle={styles.outline} />
        <TextInput mode="outlined" label={t("messages.messageLabel")} value={message} onChangeText={setMessage} multiline numberOfLines={4} style={styles.input} outlineStyle={styles.outline} />

        <View style={styles.recipientsHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("messages.recipientsLabel")} ({selectedIds.size})</Text>
          {filteredClients.length > 0 && (
            <Pressable onPress={selectAll}>
              <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "600" }}>
                {allVisibleSelected ? t("messages.deselectAll") : t("messages.selectAll")}
              </Text>
            </Pressable>
          )}
        </View>

        {activeClients.length > 3 && (
          <Searchbar placeholder={t("messages.searchClients")} value={search} onChangeText={setSearch} style={[styles.searchBar, { backgroundColor: theme.colors.surface }]} inputStyle={{ fontSize: 14 }} />
        )}

        <View style={styles.clientList}>
          {filteredClients.map((client) => {
            const selected = selectedIds.has(client.client_id);
            const label = client.profile?.full_name
              ? client.profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
              : "?";
            return (
              <Pressable
                key={client.id}
                style={[styles.clientRow, { backgroundColor: selected ? `${theme.colors.primary}10` : theme.colors.surface, borderColor: selected ? theme.colors.primary : "transparent" }]}
                onPress={() => toggleClient(client.client_id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <Avatar.Text size={40} label={label} style={{ backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant }} labelStyle={{ color: selected ? theme.colors.primary : theme.colors.onSurfaceVariant }} />
                <View style={styles.clientInfo}>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>{client.profile?.full_name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>{client.profile?.email}</Text>
                </View>
                <Checkbox status={selected ? "checked" : "unchecked"} color={theme.colors.primary} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.sendBtn, { backgroundColor: (!message.trim() || selectedIds.size === 0) ? theme.colors.surfaceVariant : theme.colors.primary }]}
          onPress={handleSend}
          disabled={!message.trim() || selectedIds.size === 0}
        >
          <MaterialCommunityIcons name="send" size={20} color={(!message.trim() || selectedIds.size === 0) ? theme.colors.onSurfaceVariant : theme.colors.onPrimary} />
          <Text variant="labelLarge" style={{ color: (!message.trim() || selectedIds.size === 0) ? theme.colors.onSurfaceVariant : theme.colors.onPrimary, fontWeight: "700", marginLeft: 8 }}>
            {t("messages.sendToClients", { count: selectedIds.size })}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 12 },
  outline: { borderRadius: 12 },
  recipientsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginBottom: 12 },
  searchBar: { borderRadius: 12, elevation: 0, marginBottom: 12 },
  clientList: { gap: 8 },
  clientRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1.5 },
  clientInfo: { flex: 1, marginLeft: 12 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, marginTop: 16 },
});
