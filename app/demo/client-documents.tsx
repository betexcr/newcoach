import { View, StyleSheet, FlatList, Pressable, Alert, Animated } from "react-native";
import { Text, useTheme, Card, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";
import { DemoPress } from "./DemoTooltip";
import { demoClientDocuments } from "./mock-data";

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

export default function DemoClientDocuments() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity } = useDemoFadeIn("client-documents");

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.navigate({ pathname: "/demo/client/settings" } as any)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}>
          {t("library.documents")}
        </Text>
      </View>

      <FlatList
        data={demoClientDocuments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
            <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained">
              <Card.Content style={s.introContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
                <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                  {t("demo.introClientDocuments")}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        }
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: contentOpacity }}>
            <DemoPress style={{ borderRadius: 14 }} accessibilityRole="button" accessibilityLabel={item.title}>
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
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={2}>
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
                  <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.onSurfaceVariant} />
                </Card.Content>
              </Card>
            </DemoPress>
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  docCard: { borderRadius: 14, elevation: 0 },
  docContent: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  docInfo: { flex: 1 },
  docMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  typeBadge: { borderRadius: 6, height: 22 },
  empty: { alignItems: "center", paddingVertical: 64 },
});
