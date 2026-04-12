import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  RefreshControl,
  TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  Text,
  useTheme,
  FAB,
  Card,
  ActivityIndicator,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useAssignDocument,
} from "@/lib/queries/documents";
import { useCoachClients } from "@/lib/queries/clients";
import { ErrorState } from "@/components/ErrorState";
import { safeDateString } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { Document } from "@/types/database";

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "file-pdf-box",
  doc: "file-word-box",
  docx: "file-word-box",
  xls: "file-excel-box",
  xlsx: "file-excel-box",
  image: "file-image",
  video: "file-video",
};

function fileTypeIcon(type: string): string {
  return FILE_TYPE_ICONS[type] ?? "file-document-outline";
}

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDocuments(userId);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const assignDoc = useAssignDocument();
  const { data: clients = [] } = useCoachClients(userId);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigningDoc, setAssigningDoc] = useState<Document | null>(null);

  async function handleUpload() {
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("library.titleRequired"));
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const ext = asset.name?.split(".").pop()?.toLowerCase() ?? "pdf";
      const mimeType = asset.mimeType ?? "application/octet-stream";

      await uploadDoc.mutateAsync({
        coachId: userId,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUri: asset.uri,
        mimeType,
        fileType: ext,
      });
      setTitle("");
      setDescription("");
      setShowUploadModal(false);
      Alert.alert(t("library.uploadDocument"), t("library.documentUploaded"));
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }

  function handleDelete(doc: Document) {
    Alert.alert(t("library.deleteDocument"), t("library.deleteDocumentConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc.mutateAsync({ id: doc.id, fileUrl: doc.file_url });
          } catch {
            Alert.alert(t("common.error"), t("common.errorGeneric"));
          }
        },
      },
    ]);
  }

  function handleAssign(doc: Document) {
    const activeClients = clients.filter((c) => c.status === "active");
    if (activeClients.length === 0) {
      Alert.alert(t("library.noClientsTitle"), t("library.noClientsMessage"));
      return;
    }
    setAssigningDoc(doc);
  }

  async function confirmAssign(clientId: string) {
    if (!assigningDoc) return;
    const client = clients.find((c) => c.client_id === clientId);
    const clientName = client?.profile?.full_name ?? client?.profile?.email ?? "";
    try {
      await assignDoc.mutateAsync({
        documentId: assigningDoc.id,
        clientId,
      });
      setAssigningDoc(null);
      Alert.alert(t("library.assignedTitle"), t("library.assignedMessage", { name: clientName }));
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}
        >
          {t("library.documents")}
        </Text>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <Card style={[styles.docCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.docContent}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name={fileTypeIcon(item.file_type) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.docInfo}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.docMeta}>
                  <Chip
                    compact
                    style={[styles.typeBadge, { backgroundColor: theme.colors.secondaryContainer }]}
                    textStyle={{ fontSize: 10, color: theme.colors.secondary }}
                  >
                    {item.file_type.toUpperCase()}
                  </Chip>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
                  >
                    {safeDateString(item.created_at)}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleAssign(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("library.assignDocument")}
                >
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("library.deleteDocument")}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </Pressable>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 12,
              }}
            >
              {t("library.noDocuments")}
            </Text>
          </View>
        }
      />

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}
              >
                {t("library.uploadDocument")}
              </Text>
              <Pressable onPress={() => setShowUploadModal(false)} accessibilityRole="button" accessibilityLabel={t("common.close")}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>
            <TextInput
              placeholder={t("library.documentTitle")}
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.onSurface,
                },
              ]}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            <TextInput
              placeholder={t("library.documentDescription")}
              value={description}
              onChangeText={setDescription}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.onSurface,
                },
              ]}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
            />
            <Pressable
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleUpload}
            >
              <MaterialCommunityIcons name="upload" size={20} color={theme.colors.onPrimary} />
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.onPrimary, fontWeight: "700", marginLeft: 8 }}
              >
                {t("library.uploadDocument")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Assign to Client Modal */}
      <Modal
        visible={!!assigningDoc}
        animationType="slide"
        transparent
        onRequestClose={() => setAssigningDoc(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.custom.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}
              >
                {t("library.assignDocument")}
              </Text>
              <Pressable onPress={() => setAssigningDoc(null)} accessibilityRole="button" accessibilityLabel={t("common.close")}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>
            <FlatList
              data={clients.filter((c) => c.status === "active")}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.clientRow, { borderBottomColor: theme.colors.outlineVariant }]}
                  onPress={() => confirmAssign(item.client_id)}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                  >
                    {item.profile.full_name ?? item.profile.email}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", padding: 24 }}
                >
                  {t("library.noActiveClients")}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowUploadModal(true)}
        label={t("library.uploadDocument")}
        loading={uploadDoc.isPending}
        disabled={uploadDoc.isPending}
      />
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 8,
  },
  docCard: {
    borderRadius: 14,
    elevation: 0,
  },
  docContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  typeBadge: {
    borderRadius: 6,
    height: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
