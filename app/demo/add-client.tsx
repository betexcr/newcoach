import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Alert, Platform, Keyboard, KeyboardAvoidingView, Pressable } from "react-native";
import { Text, useTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";

export default function DemoAddClient() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleAdd() {
    Keyboard.dismiss();
    if (!email.trim()) {
      Alert.alert(t("common.required"), t("auth.enterEmail"));
      return;
    }
    Alert.alert(t("clients.addClient"), t("clients.inviteSent"), [
      { text: t("common.ok"), onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("clients.addClient")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}15` }]}>
            <MaterialCommunityIcons name="account-plus" size={48} color={theme.colors.secondary} />
          </View>

          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24, lineHeight: 24, textAlign: "center" }}>
            {t("clients.addClientInstructions")}
          </Text>

          <TextInput
            mode="outlined"
            label={t("clients.clientEmail")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineStyle={styles.outline}
          />

          <Pressable
            style={[styles.submitBtn, { backgroundColor: !email.trim() ? theme.colors.surfaceVariant : theme.colors.primary }]}
            onPress={handleAdd}
            disabled={!email.trim()}
          >
            <MaterialCommunityIcons name="send" size={20} color={!email.trim() ? theme.colors.onSurfaceVariant : theme.colors.onPrimary} />
            <Text variant="labelLarge" style={{ color: !email.trim() ? theme.colors.onSurfaceVariant : theme.colors.onPrimary, fontWeight: "700", marginLeft: 8 }}>
              {t("clients.addClient")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 24, alignItems: "center" },
  iconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: 20, marginTop: 20 },
  input: { marginBottom: 16, width: "100%" },
  outline: { borderRadius: 12 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, width: "100%" },
});
