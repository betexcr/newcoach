import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Alert } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useAddClient } from "@/lib/queries/clients";
import { useAuthStore } from "@/stores/auth-store";
import { AuthInput } from "@/components/AuthInput";
import { AuthButton } from "@/components/AuthButton";
import { isValidEmail } from "@/lib/validation";

export default function AddClientScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const addClient = useAddClient();
  const [email, setEmail] = useState("");

  async function handleAdd() {
    if (!userId) {
      Alert.alert(t("common.error"), t("auth.sessionExpired"));
      return;
    }
    if (!email.trim()) {
      Alert.alert(t("common.required"), t("auth.enterEmail"));
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }

    try {
      await addClient.mutateAsync({
        coachId: userId,
        clientEmail: email.trim(),
      });
      Alert.alert(t("clients.addClient"), t("clients.inviteSent"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message);
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
          {t("clients.addClient")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text
          variant="bodyLarge"
          style={{
            color: theme.colors.onSurfaceVariant,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t("clients.addClientInstructions")}
        </Text>

        <AuthInput
          label={t("clients.clientEmail")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          left={<AuthInput.Icon icon="email-outline" />}
        />

        <AuthButton
          onPress={handleAdd}
          loading={addClient.isPending}
          disabled={addClient.isPending || !email.trim()}
          style={{ marginTop: 16 }}
        >
          {t("clients.addClient")}
        </AuthButton>
      </View>
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
    padding: 24,
  },
});
