import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Text, useTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCreateProgram } from "@/lib/queries/programs";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";

const DURATION_PRESETS = [4, 6, 8, 12, 16];

export default function CreateProgramScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const createProgram = useCreateProgram();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [customDuration, setCustomDuration] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("library.enterProgramName"));
      return;
    }
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    const weeks = customDuration
      ? parseInt(customDuration, 10) || durationWeeks
      : durationWeeks;

    try {
      const program = await createProgram.mutateAsync({
        coach_id: userId,
        name: name.trim(),
        description: description.trim() || undefined,
        duration_weeks: weeks,
      });
      router.replace({
        pathname: "/(coach)/library/program-detail",
        params: { programId: program.id, programName: name.trim() },
      } as any);
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("library.failedCreateProgram"));
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
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("library.createProgram")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          mode="outlined"
          label={t("library.programNameLabel")}
          value={name}
          onChangeText={setName}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <TextInput
          mode="outlined"
          label={t("library.descriptionLabel")}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineStyle={styles.outline}
        />

        <Text
          variant="titleMedium"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          {t("library.durationLabel")}
        </Text>

        <View style={styles.durationRow}>
          {DURATION_PRESETS.map((weeks) => {
            const selected = !customDuration && durationWeeks === weeks;
            return (
              <Pressable
                key={weeks}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
                onPress={() => {
                  setDurationWeeks(weeks);
                  setCustomDuration("");
                }}
              >
                <Text
                  variant="labelLarge"
                  style={{
                    color: selected ? theme.colors.onPrimary : theme.colors.onSurface,
                    fontWeight: "600",
                  }}
                >
                  {weeks}w
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          mode="outlined"
          label={t("library.customWeeks")}
          value={customDuration}
          onChangeText={(v) => {
            setCustomDuration(v.replace(/[^0-9]/g, ""));
          }}
          keyboardType="numeric"
          style={[styles.input, { marginTop: 12 }]}
          outlineStyle={styles.outline}
        />

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <MaterialCommunityIcons
              name="clipboard-list"
              size={32}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.summaryInfo}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {name.trim() || t("programs.untitled")}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            >
              {customDuration
                ? `${customDuration} ${t("library.weeks")}`
                : `${durationWeeks} ${t("library.weeks")}`}
              {description.trim() ? ` · ${description.trim()}` : ""}
            </Text>
          </View>
        </View>

        <AuthButton
          onPress={handleCreate}
          loading={createProgram.isPending}
          disabled={createProgram.isPending || !name.trim()}
          style={{ marginTop: 8 }}
        >
          {t("library.createProgramButton")}
        </AuthButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
  },
  outline: {
    borderRadius: 12,
  },
  durationRow: {
    flexDirection: "row",
    gap: 10,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 4,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
});
