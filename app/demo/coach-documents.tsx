import { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Animated } from "react-native";
import { Text, useTheme, Card, Chip, FAB } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";
import { DemoPress } from "./DemoTooltip";
import { demoDocuments, demoClients, type DemoDocument } from "./mock-data";

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "file-pdf-box",
  doc: "file-word-box",
  docx: "file-word-box",
  xls: "file-excel-box",
  xlsx: "file-excel-box",
  image: "file-image",
};

function fileTypeIcon(type: string): string {
  return FILE_TYPE_ICONS[type] ?? "file-document-outline";
}

export default function DemoCoachDocuments() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity } = useDemoFadeIn("coach-documents");
  const [docs, setDocs] = useState(demoDocuments);

  function handleAssign(doc: DemoDocument) {
    const activeClients = demoClients.filter((c) => c.status === "active");
    Alert.alert(
      t("library.assignDocument"),
      `${activeClients.map((c) => c.profile.full_name).join(", ")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.ok"),
          onPress: () =>
            Alert.alert(t("library.assignedTitle"), t("library.assignedMessage", { name: activeClients[0]?.profile.full_name ?? "" })),
        },
      ]
    );
  }

  function handleDelete(doc: DemoDocument) {
    Alert.alert(t("library.deleteDocument"), t("library.deleteDocumentConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => setDocs((prev) => prev.filter((d) => d.id !== doc.id)),
      },
    ]);
  }

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.navigate({ pathname: "/demo/coach/library" } as any)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}>
          {t("demo.documentsSection")}
        </Text>
      </View>

      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
            <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
              <Card.Content style={s.introContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                  {t("demo.introDocuments")}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        }
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: contentOpacity }}>
            <Card style={[s.docCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={s.docContent}>
                <View style={[s.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name={fileTypeIcon(item.file_type) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={s.docInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={s.docMeta}>
                    <Chip
                      compact
                      style={[s.typeBadge, { backgroundColor: theme.colors.secondaryContainer }]}
                      textStyle={{ fontSize: 10, color: theme.colors.secondary }}
                    >
                      {item.file_type.toUpperCase()}
                    </Chip>
                  </View>
                </View>
                <View style={s.actions}>
                  <Pressable
                    onPress={() => handleAssign(item)}
                    hitSlop={8}
                    style={s.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={t("library.assignDocument")}
                  >
                    <MaterialCommunityIcons name="account-plus-outline" size={20} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    hitSlop={8}
                    style={s.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={t("library.deleteDocument")}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                  </Pressable>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
              {t("library.noDocuments")}
            </Text>
          </View>
        }
      />

      <DemoPress style={[s.fab, { backgroundColor: theme.colors.primary }]} accessibilityRole="button">
        <MaterialCommunityIcons name="plus" size={24} color={theme.colors.onPrimary} />
        <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: "700", marginLeft: 8 }}>
          {t("library.uploadDocument")}
        </Text>
      </DemoPress>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 8 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  docCard: { borderRadius: 14, elevation: 0 },
  docContent: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  docInfo: { flex: 1 },
  docMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  typeBadge: { borderRadius: 6, height: 22 },
  actions: { flexDirection: "row", gap: 4 },
  actionButton: { padding: 6 },
  empty: { alignItems: "center", paddingVertical: 64 },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 28, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});
