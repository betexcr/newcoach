import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { coachProfile, demoConversations, demoChatMessages, CLIENT_1_ID } from "../mock-data";

export default function DemoClientMessages() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
          <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introClientMessages")}
          </Text>
        </Card.Content>
      </Card>

      <View style={[s.convRow, { backgroundColor: theme.colors.surface }]}>
        <Avatar.Icon size={44} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{coachProfile.full_name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>{demoConversations[0].last_message?.body ?? ""}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </View>

      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 20, marginBottom: 8 }}>{t("demo.chatPreview")}</Text>
      <View style={[s.chatContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        {demoChatMessages.map((msg) => {
          const isOwn = msg.sender_id === CLIENT_1_ID;
          return (
            <View key={msg.id} style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble, { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface }]}>
              <Text variant="bodyMedium" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface, lineHeight: 20 }}>{msg.body}</Text>
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
