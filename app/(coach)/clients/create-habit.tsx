import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { Text, useTheme, SegmentedButtons } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCreateHabit } from "@/lib/queries/habits";
import { AuthInput } from "@/components/AuthInput";
import { AuthButton } from "@/components/AuthButton";

export default function CreateHabitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { clientId, coachId } = useLocalSearchParams<{
    clientId: string;
    coachId: string;
  }>();

  const createHabit = useCreateHabit();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert(t("common.required"), t("clientProfile.enterHabitName"));
      return;
    }
    if (!coachId || !clientId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }

    try {
      await createHabit.mutateAsync({
        coach_id: coachId,
        client_id: clientId,
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
      });
      router.back();
    } catch (err: unknown) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("common.errorGeneric"));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
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
          {t("clientProfile.createHabit")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AuthInput
          label={t("clientProfile.habitName")}
          value={name}
          onChangeText={setName}
          left={<AuthInput.Icon icon="checkbox-marked-circle-outline" />}
        />

        <AuthInput
          label={t("clientProfile.habitDescription")}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          left={<AuthInput.Icon icon="text" />}
        />

        <Text
          variant="titleSmall"
          style={{ color: theme.colors.onSurface, fontWeight: "600", marginTop: 16, marginBottom: 8 }}
        >
          {t("clientProfile.frequency")}
        </Text>

        <SegmentedButtons
          value={frequency}
          onValueChange={setFrequency}
          buttons={[
            { value: "daily", label: t("habits.daily") },
            { value: "weekly", label: t("habits.weekly") },
            { value: "monthly", label: t("habits.monthly") },
          ]}
        />

        <AuthButton
          onPress={handleCreate}
          loading={createHabit.isPending}
          disabled={createHabit.isPending || !name.trim()}
          style={{ marginTop: 24 }}
        >
          {t("clientProfile.createHabit")}
        </AuthButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: { padding: 24 },
});
