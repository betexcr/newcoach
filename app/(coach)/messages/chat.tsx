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
  Alert,
  RefreshControl,
} from "react-native";
import { Text, useTheme, IconButton, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMessages, useSendMessage } from "@/lib/queries/messaging";
import { useAuthStore } from "@/stores/auth-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { MessageBubble } from "@/components/MessageBubble";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { ErrorState } from "@/components/ErrorState";
import { supabase } from "@/lib/supabase";

export default function ChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId: string; name: string }>();
  const storeNav = useChatNavStore();
  const conversationId = params.conversationId || storeNav.conversationId || undefined;
  const name = params.name || storeNav.name || undefined;
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    return () => { useChatNavStore.getState().clear(); };
  }, []);
  const { data: messages = [], isLoading: messagesLoading, isError: messagesError, refetch: refetchMessages, isRefetching: messagesRefetching } = useMessages(
    conversationId ?? ""
  );
  const sendMessage = useSendMessage();

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const isNearBottom = useRef(true);

  useEffect(() => {
    if (messages.length > 0 && isNearBottom.current) {
      const timerId = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(timerId);
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
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("messages.sendFailed"));
    }
  }

  async function handleVoiceRecorded(uri: string) {
    if (!userId || !conversationId) return;
    try {
      const fileName = `${userId}/${Date.now()}.m4a`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from("voice-messages").upload(fileName, blob, { contentType: "audio/m4a" });
      if (uploadError) throw uploadError;
      const { data } = await supabase.storage.from("voice-messages").createSignedUrl(fileName, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) throw new Error("Failed to create voice URL");
      await sendMessage.mutateAsync({ conversation_id: conversationId, sender_id: userId, voice_url: data.signedUrl });
    } catch {
      Alert.alert(t("common.error"), t("messages.voiceFailed"));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.topBar, { borderBottomColor: theme.colors.outline }]}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
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
          {name ?? t("messages.chatTitle")}
        </Text>
      </View>

      {!conversationId ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <MaterialCommunityIcons name="message-off-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
            {t("messages.conversationNotFound")}
          </Text>
        </View>
      ) : messagesLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : messagesError ? (
        <ErrorState onRetry={refetchMessages} />
      ) : (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={messagesRefetching} onRefresh={refetchMessages} />
          }
          onScroll={(e) => {
            const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
            isNearBottom.current =
              contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
          }}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === userId}
            />
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
            accessibilityLabel={t("messages.inputPlaceholder")}
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
          {!text.trim() && <VoiceRecorder onRecorded={handleVoiceRecorded} />}
          <IconButton
            icon="send"
            iconColor={text.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant}
            size={24}
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            accessibilityLabel={t("messages.send")}
          />
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 0.5,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
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
});
