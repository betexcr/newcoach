import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Platform,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  FAB,
  ActivityIndicator,
  Chip,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/stores/auth-store";
import { useProgressPhotos, useUploadProgressPhoto, useDeleteProgressPhoto } from "@/lib/queries/progress-photos";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { ProgressPhoto } from "@/types/database";

type PoseFilter = "all" | "front" | "side" | "back";

export default function ProgressPhotosScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  const { data: photos = [], isLoading, isError, refetch } = useProgressPhotos(userId);
  const uploadPhoto = useUploadProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();
  const [poseFilter, setPoseFilter] = useState<PoseFilter>("all");
  const [selectedPose, setSelectedPose] = useState<ProgressPhoto["pose"] | null>(null);

  const filteredPhotos = useMemo(() => {
    if (poseFilter === "all") return photos;
    return photos.filter((p) => p.pose === poseFilter);
  }, [photos, poseFilter]);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, ProgressPhoto[]> = {};
    for (const p of filteredPhotos) {
      const key = p.logged_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredPhotos]);

  async function handlePickImage(pose: ProgressPhoto["pose"]) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("auth.permissionNeeded"), t("auth.permissionCameraRoll"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    try {
      await uploadPhoto.mutateAsync({
        clientId: userId,
        pose,
        loggedDate: formatDate(new Date()),
        imageUri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      setSelectedPose(null);
    } catch {
      Alert.alert(t("common.error"), t("progressPhotos.failedUpload"));
    }
  }

  function handleDelete(photo: ProgressPhoto) {
    Alert.alert(t("progressPhotos.deletePhoto"), t("progressPhotos.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto.mutateAsync({ id: photo.id, photoUrl: photo.photo_url });
          } catch {
            Alert.alert(t("common.error"), t("progressPhotos.failedDelete"));
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}>
          {t("progressPhotos.title")}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {(["all", "front", "side", "back"] as PoseFilter[]).map((pose) => (
          <Chip
            key={pose}
            mode={poseFilter === pose ? "flat" : "outlined"}
            selected={poseFilter === pose}
            onPress={() => setPoseFilter(pose)}
            style={[
              styles.filterChip,
              poseFilter === pose && { backgroundColor: theme.colors.primary },
            ]}
            textStyle={[
              { fontSize: 13, textTransform: "capitalize" },
              poseFilter === pose && { color: theme.colors.onPrimary },
            ]}
          >
            {pose === "all" ? t("library.filterAll") : t(`progressPhotos.${pose}`)}
          </Chip>
        ))}
      </View>

      {selectedPose && (
        <Card style={[styles.posePickerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
              {t("progressPhotos.selectPose")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["front", "side", "back"] as const).map((pose) => (
                <Pressable
                  key={pose}
                  style={[
                    styles.poseOption,
                    {
                      backgroundColor:
                        selectedPose === pose ? theme.colors.primary : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => {
                    setSelectedPose(pose);
                    handlePickImage(pose);
                  }}
                >
                  <MaterialCommunityIcons
                    name={pose === "front" ? "account" : pose === "side" ? "account-arrow-right" : "account-arrow-left"}
                    size={24}
                    color={selectedPose === pose ? theme.colors.onPrimary : theme.colors.onSurface}
                  />
                  <Text
                    style={{
                      color: selectedPose === pose ? theme.colors.onPrimary : theme.colors.onSurface,
                      fontWeight: "600",
                      marginTop: 4,
                      fontSize: 12,
                    }}
                  >
                    {t(`progressPhotos.${pose}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={{ marginTop: 10, alignSelf: "center" }} onPress={() => setSelectedPose(null)}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{t("common.cancel")}</Text>
            </Pressable>
          </Card.Content>
        </Card>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {photos.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="camera-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: "center" }}>
              {t("progressPhotos.noPhotos")}
            </Text>
          </View>
        ) : (
          groupedPhotos.map(([date, datePhotos]) => {
            const dateStr = new Date(date + "T12:00:00").toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            return (
              <View key={date} style={styles.dateGroup}>
                <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 10 }}>
                  {dateStr}
                </Text>
                <View style={styles.photoRow}>
                  {datePhotos.map((photo) => (
                    <Pressable key={photo.id} onLongPress={() => handleDelete(photo)} style={styles.photoCard}>
                      <Image source={{ uri: photo.photo_url }} style={styles.photoImage} resizeMode="cover" />
                      <View style={[styles.poseBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={{ color: theme.colors.onPrimary, fontSize: 10, fontWeight: "700" }}>
                          {t(`progressPhotos.${photo.pose}`)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {!selectedPose && (
        <FAB
          icon="camera-plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => setSelectedPose("front")}
          label={t("progressPhotos.addPhoto")}
          loading={uploadPhoto.isPending}
          disabled={uploadPhoto.isPending}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: { borderRadius: 20 },
  posePickerCard: { marginHorizontal: 16, borderRadius: 14, elevation: 0, marginBottom: 12 },
  poseOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  content: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingVertical: 60 },
  dateGroup: { marginBottom: 20 },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoCard: {
    width: "31%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  poseBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
