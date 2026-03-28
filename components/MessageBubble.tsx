import { useTranslation } from "react-i18next";
import { View, StyleSheet, Image } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Message } from "@/types/database";

export function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!message.body && !message.image_url && !message.voice_url) {
    return null;
  }

  return (
    <View
      style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
        {
          backgroundColor: isOwn
            ? theme.colors.primary
            : theme.colors.surface,
        },
      ]}
    >
      {message.image_url ? (
        <Image
          source={{ uri: message.image_url }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      ) : null}
      {message.voice_url ? (
        <View style={styles.voiceMessage}>
          <MaterialCommunityIcons
            name="microphone"
            size={20}
            color={isOwn ? "#FFFFFF" : theme.colors.primary}
          />
          <Text
            variant="bodySmall"
            style={{ color: isOwn ? "rgba(255,255,255,0.8)" : theme.colors.onSurfaceVariant, marginLeft: 6 }}
          >
            {t("messages.voiceMessage")}
          </Text>
        </View>
      ) : null}
      {message.body ? (
        <Text
          variant="bodyMedium"
          style={{
            color: isOwn ? "#FFFFFF" : theme.colors.onSurface,
            lineHeight: 20,
          }}
        >
          {message.body}
        </Text>
      ) : null}
      <Text
        variant="labelSmall"
        style={{
          color: isOwn ? "rgba(255,255,255,0.6)" : theme.colors.onSurfaceVariant,
          marginTop: 4,
          alignSelf: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 6,
  },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  voiceMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});
