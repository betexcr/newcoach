import { View, StyleSheet, ScrollView, Animated, TextInput as RNTextInput } from "react-native";
import { Text, useTheme, Card, Avatar, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import { coachProfile, demoConversations, demoChatMessages, CLIENT_1_ID, chatMessageKeys, convLastMessageKeys } from "../mock-data";

export default function DemoClientMessages() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("client-messages");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      {!introCollapsed && (
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained" onPress={dismissIntro}>
            <Card.Content style={s.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
              <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introClientMessages")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: contentOpacity }}>
      <DemoPress style={[s.convRow, { backgroundColor: theme.colors.surface }]}>
        <Avatar.Icon size={44} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{coachProfile.full_name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>{convLastMessageKeys["conv-001"] ? t(convLastMessageKeys["conv-001"]) : (demoConversations[0].last_message?.body ?? "")}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </DemoPress>

      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 20, marginBottom: 8 }}>{t("demo.chatPreview")}</Text>
      <View style={[s.chatContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        {demoChatMessages.map((msg) => {
          const isOwn = msg.sender_id === CLIENT_1_ID;
          return (
            <View key={msg.id} style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble, { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface }]}>
              {msg.voice_url ? (
                <DemoPress style={s.voiceMessage} accessibilityRole="button" accessibilityLabel={t("demo.voiceMessageDemo")}>
                  <MaterialCommunityIcons name="play-circle" size={20} color={isOwn ? theme.colors.onPrimary : theme.colors.primary} />
                  <Text variant="bodySmall" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, marginLeft: 6, opacity: isOwn ? 0.8 : 1 }}>
                    {t("messages.voiceMessage")}
                  </Text>
                  <View style={[s.waveform, { backgroundColor: isOwn ? `${theme.colors.onPrimary}30` : `${theme.colors.primary}20` }]}>
                    {[3, 5, 8, 12, 10, 7, 4, 6, 9, 11, 8, 5, 3].map((h, i) => (
                      <View key={i} style={[s.waveBar, { height: h, backgroundColor: isOwn ? theme.colors.onPrimary : theme.colors.primary }]} />
                    ))}
                  </View>
                </DemoPress>
              ) : (
                <Text variant="bodyMedium" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface, lineHeight: 20 }}>{chatMessageKeys[msg.id] ? t(chatMessageKeys[msg.id]) : msg.body}</Text>
              )}
              <Text variant="labelSmall" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: isOwn ? 0.6 : 1, marginTop: 4, alignSelf: isOwn ? "flex-end" : "flex-start" }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        })}

        <View style={[s.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          <DemoPress style={{ padding: 8 }} accessibilityLabel={t("demo.recordingDemo")}>
            <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.onSurfaceVariant} />
          </DemoPress>
          <RNTextInput
            placeholder={t("messages.inputPlaceholder")}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            editable={false}
            style={[s.textInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
          />
          <IconButton
            icon="send"
            iconColor={theme.colors.primary}
            size={22}
            disabled
            style={{ margin: 0, opacity: 0.5 }}
          />
        </View>
      </View>
      </Animated.View>
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
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 0.5, marginTop: 8, borderRadius: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  textInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  voiceMessage: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  waveform: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  waveBar: { width: 2, borderRadius: 1 },
});
