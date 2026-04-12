import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { usePrograms } from "@/lib/queries/programs";
import { useAssignProgram } from "@/lib/queries/workouts";
import { AuthButton } from "@/components/AuthButton";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/date-utils";
import type { Program } from "@/types/database";

export default function AssignProgramScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
  }>();

  const coachId = useAuthStore((s) => s.user?.id) ?? "";
  const { data: programs = [], isLoading, isError, refetch } = usePrograms(coachId);
  const assignProgram = useAssignProgram();

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [startDate, setStartDate] = useState(formatDate(new Date()));

  async function handleAssign() {
    Keyboard.dismiss();
    if (!selectedProgram) return;
    if (!clientId?.trim() || !coachId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }
    if (!startDate.trim()) {
      Alert.alert(t("common.error"), t("assignProgram.enterStartDate"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert(t("common.error"), t("assignProgram.invalidDate"));
      return;
    }
    try {
      const assigned = await assignProgram.mutateAsync({
        programId: selectedProgram.id,
        coachId,
        clientId: clientId ?? "",
        startDate,
      });
      Alert.alert(
        t("assignProgram.successTitle"),
        t("assignProgram.successMessage", {
          count: assigned.length,
          name: clientName,
        }),
        [{ text: t("common.ok"), onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "";
      const ERROR_MAP: Record<string, string> = {
        INVALID_START_DATE: t("assignProgram.invalidStartDate"),
        PROGRAM_NO_WORKOUTS: t("assignProgram.programNoWorkouts"),
      };
      Alert.alert(t("common.error"), ERROR_MAP[code] ?? t("assignProgram.failedAssign"));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={t("common.back")} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginLeft: 12,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {t("assignProgram.title")}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}
        >
          {t("assignProgram.selectProgram")}
        </Text>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {t("assignProgram.noPrograms")}
            </Text>
          </View>
        ) : (
          programs.map((program) => {
            const isSelected = selectedProgram?.id === program.id;
            return (
              <Pressable
                key={program.id}
                onPress={() => setSelectedProgram(program)}
              >
                <Card
                  style={[
                    styles.programCard,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? theme.colors.primary : "transparent",
                    },
                  ]}
                >
                  <Card.Content style={styles.programContent}>
                    <View
                      style={[
                        styles.programIcon,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.primaryContainer,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="clipboard-list"
                        size={22}
                        color={isSelected ? theme.colors.onPrimary : theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="titleMedium"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: "600",
                        }}
                      >
                        {program.name}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {program.duration_weeks} {t("programs.weeks")}
                      </Text>
                      {program.description && (
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                          numberOfLines={2}
                        >
                          {program.description}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={theme.colors.primary}
                      />
                    )}
                  </Card.Content>
                </Card>
              </Pressable>
            );
          })
        )}

        {selectedProgram && (
          <View style={styles.dateSection}>
            <TextInput
              mode="outlined"
              label={t("assignProgram.startDate")}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={styles.dateInput}
              outlineStyle={{ borderRadius: 10 }}
              left={<TextInput.Icon icon="calendar" />}
            />
            <AuthButton
              onPress={handleAssign}
              loading={assignProgram.isPending}
              disabled={assignProgram.isPending}
              style={{ marginTop: 4 }}
            >
              {t("assignProgram.assignButton")}
            </AuthButton>
          </View>
        )}
      </ScrollView>
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
  },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  programCard: { borderRadius: 14, elevation: 0, marginBottom: 10 },
  programContent: { flexDirection: "row", alignItems: "center" },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateSection: { marginTop: 20 },
  dateInput: { marginBottom: 12 },
});
