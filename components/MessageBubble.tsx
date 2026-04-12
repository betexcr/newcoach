import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { AppTheme } from "@/lib/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import type { Message } from "@/types/database";

function VoicePlayback({ url, tintColor, textColor, isOwn }: { url: string; tintColor: string; textColor: string; isOwn: boolean }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.stopAsync().catch(() => {});
        sound.current.unloadAsync().catch(() => {});
        sound.current = null;
      }
    };
  }, []);

  async function toggle() {
    if (playing && sound.current) {
      await sound.current.stopAsync();
      await sound.current.unloadAsync();
      sound.current = null;
      setPlaying(false);
      return;
    }
    try {
      const { sound: s } = await Audio.Sound.createAsync({ uri: url });
      sound.current = s;
      setPlaying(true);
      s.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          s.unloadAsync();
          sound.current = null;
          setPlaying(false);
        }
      });
      await s.playAsync();
    } catch {
      setPlaying(false);
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }

  return (
    <Pressable onPress={toggle} style={styles.voiceMessage} accessibilityRole="button" accessibilityLabel={t("messages.tapToPlay")}>
      <MaterialCommunityIcons name={playing ? "stop-circle" : "play-circle"} size={20} color={tintColor} />
      <Text variant="bodySmall" style={{ color: textColor, marginLeft: 6, opacity: isOwn ? 0.8 : 1 }}>
        {playing ? t("messages.playing") : t("messages.voiceMessage")}
      </Text>
    </Pressable>
  );
}

export function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();

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
        <VoicePlayback
          url={message.voice_url}
          tintColor={isOwn ? theme.colors.onPrimary : theme.colors.primary}
          textColor={isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
          isOwn={isOwn}
        />
      ) : null}
      {message.body ? (
        <Text
          variant="bodyMedium"
          style={{
            color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface,
            lineHeight: 20,
          }}
        >
          {message.body}
        </Text>
      ) : null}
      <Text
        variant="labelSmall"
        style={{
          color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
          opacity: isOwn ? 0.6 : 1,
          marginTop: 4,
          alignSelf: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {(() => {
          const d = new Date(message.created_at);
          return Number.isNaN(d.getTime())
            ? ""
            : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        })()}
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
