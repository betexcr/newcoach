import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Text, useTheme, FAB, Card, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { usePrograms, useDeleteProgram } from "@/lib/queries/programs";
import { ErrorState } from "@/components/ErrorState";
import type { Program } from "@/types/database";

export default function ProgramsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const { data: programs = [], isLoading, isError, refetch } = usePrograms(userId);
  const deleteProgram = useDeleteProgram();

  function handleDelete(program: Program) {
    if (deleteProgram.isPending) return;
    Alert.alert(
      t("common.delete"),
      t("programs.deleteConfirm", { name: program.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteProgram.mutate(program.id),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}
        >
          {t("programs.title")}
        </Text>
      </View>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : programs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}>
            {t("programs.noPrograms")}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8 }}>
            {t("programs.noProgramsMessage")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={[styles.programCard, { backgroundColor: theme.colors.surface }]}
              onPress={() =>
                router.push({
                  pathname: "/(coach)/library/program-detail",
                  params: { programId: item.id, programName: item.name },
                } as any)
              }
            >
              <Card.Content style={styles.programContent}>
                <View style={[styles.programIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="clipboard-list" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.duration_weeks} {t("programs.weeks")} · {t("programs.created")}{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {item.description && (
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
                <Pressable onPress={() => handleDelete(item)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                </Pressable>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => router.push("/(coach)/library/create-program")}
        label={t("programs.newProgram")}
      />
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
  },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 80 },
  programCard: { borderRadius: 14, elevation: 0 },
  programContent: { flexDirection: "row", alignItems: "center" },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
