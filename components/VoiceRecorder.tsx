import { useState, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { AppTheme } from "@/lib/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTranslation } from "react-i18next";

interface VoiceRecorderProps {
  onRecorded: (uri: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: VoiceRecorderProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("common.error"), t("publicProfile.micPermissionDenied"));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }, []);

  const stopAndSend = useCallback(async () => {
    if (!recordingRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setDuration(0);

      if (uri) onRecorded(uri);
    } catch {
      setDuration(0);
    }
  }, [onRecorded]);

  const cancel = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch { /* noop */ }
      recordingRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (isRecording) {
    return (
      <View style={styles.recordingBar}>
        <View style={[styles.recordDot, { backgroundColor: theme.colors.error }]} />
        <Text variant="labelLarge" style={{ color: theme.colors.error, fontWeight: "700", marginLeft: 8 }}>
          {formatDuration(duration)}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={cancel} style={styles.cancelBtn} accessibilityLabel={t("common.cancel")}>
          <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
        </Pressable>
        <Pressable
          onPress={stopAndSend}
          style={[styles.sendVoiceBtn, { backgroundColor: theme.colors.primary }]}
          accessibilityLabel={t("messages.send")}
        >
          <MaterialCommunityIcons name="send" size={20} color={theme.colors.onPrimary} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={startRecording}
      disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1, padding: 8 }}
      accessibilityLabel={t("messages.holdToRecord")}
    >
      <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cancelBtn: {
    padding: 8,
    marginRight: 8,
  },
  sendVoiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
