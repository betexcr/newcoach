import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Text, useTheme, IconButton, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMessages, useSendMessage } from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import type { Message } from "@/types/database";

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

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

export default function ClientChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { conversationId, name } = useLocalSearchParams<{
    conversationId: string;
    name: string;
  }>();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    conversationId ?? ""
  );
  const sendMessage = useSendMessage();

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim() || !userId || !conversationId) return;

    const body = text.trim();
    setText("");

    try {
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        sender_id: userId,
        body,
      });
    } catch (err: unknown) {
      setText(body);
      const message =
        err instanceof Error ? err.message : t("messages.sendFailed");
      Alert.alert(t("common.error"), message);
    }
  }

  if (messagesLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.topBar, { borderBottomColor: theme.colors.outline }]}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1, marginLeft: 12 }}
          numberOfLines={1}
        >
          {name ?? t("messages.coachFallback")}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender_id === userId} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={40}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                {t("messages.emptyChat")}
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outline,
            },
          ]}
        >
          <RNTextInput
            value={text}
            onChangeText={setText}
            placeholder={t("messages.inputPlaceholder")}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[
              styles.textInput,
              {
                color: theme.colors.onSurface,
                backgroundColor: theme.colors.background,
              },
            ]}
            multiline
            maxLength={2000}
          />
          <IconButton
            icon="send"
            iconColor={text.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant}
            size={24}
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
          />
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 0.5,
  },
  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 6,
  },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 0.5,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
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
