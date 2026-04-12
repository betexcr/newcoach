import { useEffect } from "react";
import { View, Modal, StyleSheet, Pressable, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useTranslation } from "react-i18next";

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;

function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_RE.test(url);
}

interface VideoPlayerProps {
  url: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * Unified video player:
 *  - YouTube / external URLs → opens the system browser via Linking and auto-closes.
 *  - Direct video files (.mp4, .mov, …) → plays inline in a full-screen dark modal
 *    with native controls via expo-av.
 */
export function VideoPlayer({ url, visible, onClose }: VideoPlayerProps) {
  const { t } = useTranslation();
  const youtube = isYouTubeUrl(url);

  useEffect(() => {
    if (visible && youtube) {
      Linking.openURL(url);
      onClose();
    }
  }, [visible, youtube, url, onClose]);

  if (!visible || youtube) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("publicProfile.closeVideo")}
        >
          <View style={styles.closeCircle}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </View>
        </Pressable>

        <Video
          source={{ uri: url }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: 300,
  },
});
