import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform, Keyboard, KeyboardAvoidingView } from "react-native";
import { Text, useTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";

const DURATION_PRESETS = [4, 6, 8, 12, 16];

export default function DemoCreateProgram() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [customDuration, setCustomDuration] = useState("");

  function handleCreate() {
    Keyboard.dismiss();
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("library.enterProgramName"));
      return;
    }
    Alert.alert(t("library.createProgram"), t("demo.savedDemo"), [
      { text: t("common.ok"), onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("library.createProgram")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput mode="outlined" label={t("library.programNameLabel")} value={name} onChangeText={setName} style={styles.input} outlineStyle={styles.outline} />
          <TextInput mode="outlined" label={t("library.descriptionLabel")} value={description} onChangeText={setDescription} multiline numberOfLines={3} style={styles.input} outlineStyle={styles.outline} />

          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 8, marginBottom: 12 }}>
            {t("library.durationLabel")}
          </Text>

          <View style={styles.durationRow}>
            {DURATION_PRESETS.map((weeks) => {
              const selected = !customDuration && durationWeeks === weeks;
              return (
                <Pressable
                  key={weeks}
                  style={[styles.durationChip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.outline }]}
                  onPress={() => { setDurationWeeks(weeks); setCustomDuration(""); }}
                >
                  <Text variant="labelLarge" style={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: "600" }}>{weeks}w</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            mode="outlined"
            label={t("library.customWeeks")}
            value={customDuration}
            onChangeText={(v) => setCustomDuration(v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            style={[styles.input, { marginTop: 12 }]}
            outlineStyle={styles.outline}
          />

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name="clipboard-list" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                {name.trim() || t("programs.untitled")}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {customDuration ? `${customDuration} ${t("library.weeks")}` : `${durationWeeks} ${t("library.weeks")}`}
                {description.trim() ? ` · ${description.trim()}` : ""}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.createBtn, { backgroundColor: !name.trim() ? theme.colors.surfaceVariant : theme.colors.primary }]}
            onPress={handleCreate}
            disabled={!name.trim()}
          >
            <Text variant="labelLarge" style={{ color: !name.trim() ? theme.colors.onSurfaceVariant : theme.colors.onPrimary, fontWeight: "700" }}>
              {t("library.createProgramButton")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 12 },
  outline: { borderRadius: 12 },
  durationRow: { flexDirection: "row", gap: 10 },
  durationChip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  summaryCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 16, marginTop: 4 },
  summaryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  summaryInfo: { flex: 1, marginLeft: 14 },
  createBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
});
