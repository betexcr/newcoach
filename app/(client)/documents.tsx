import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  ActivityIndicator,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useClientDocuments, getDocumentSignedUrl } from "@/lib/queries/documents";
import { ErrorState } from "@/components/ErrorState";
import { safeDateString } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";

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

export default function ClientDocumentsScreen() {
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
  } = useClientDocuments(userId);

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
          <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={async () => {
            const url = item.file_url.startsWith("http")
              ? item.file_url
              : await getDocumentSignedUrl(item.file_url);
            if (url) Linking.openURL(url);
            else Alert.alert(t("common.error"), t("common.errorGeneric"));
          }}>
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
                      numberOfLines={2}
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
                <MaterialCommunityIcons
                  name="open-in-new"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </Card.Content>
            </Card>
          </Pressable>
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
    paddingBottom: 40,
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
  empty: {
    alignItems: "center",
    paddingVertical: 64,
  },
});
