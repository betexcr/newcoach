import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { demoConversations, demoChatMessages, COACH_ID } from "../mock-data";

export default function DemoMessages() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introMessages")}
          </Text>
        </Card.Content>
      </Card>

      {demoConversations.map((conv) => (
        <View key={conv.id} style={[s.convRow, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Icon
            size={44}
            icon={conv.type === "direct" ? "account" : conv.type === "broadcast" ? "bullhorn" : "account-group"}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.primary}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
              {conv.name ?? (conv.type === "direct" ? "Jordan Athlete" : "Group Chat")}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {conv.last_message?.body ?? ""}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        </View>
      ))}

      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 20, marginBottom: 8 }}>
        {t("demo.chatPreview")}
      </Text>
      <View style={[s.chatContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        {demoChatMessages.map((msg) => {
          const isOwn = msg.sender_id === COACH_ID;
          return (
            <View
              key={msg.id}
              style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble, { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface }]}
            >
              <Text variant="bodyMedium" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface, lineHeight: 20 }}>
                {msg.body}
              </Text>
              <Text variant="labelSmall" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: isOwn ? 0.6 : 1, marginTop: 4, alignSelf: isOwn ? "flex-end" : "flex-start" }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  convRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  chatContainer: { borderRadius: 16, padding: 12 },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 6 },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
});
