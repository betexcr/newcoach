import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Alert, Platform, Keyboard, KeyboardAvoidingView, Pressable, Animated } from "react-native";
import { Text, useTheme, TextInput, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";

export default function DemoAddClient() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  function goBack() {
    router.navigate({ pathname: "/demo/coach/clients" } as any);
  }

  const [email, setEmail] = useState("");
  const { introOpacity, introTranslateY, contentOpacity } = useDemoFadeIn("add-client");

  function handleAdd() {
    Keyboard.dismiss();
    if (!email.trim()) {
      Alert.alert(t("common.required"), t("auth.enterEmail"));
      return;
    }
    Alert.alert(t("clients.addClient"), t("clients.inviteSent"), [
      { text: t("common.ok"), onPress: goBack },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={10} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("clients.addClient")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }], width: "100%" }}>
            <Card style={[styles.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
              <Card.Content style={styles.introContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                  {t("demo.introAddClient")}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity, width: "100%", alignItems: "center" }}>
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
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 24, alignItems: "center" },
  iconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: 20, marginTop: 20 },
  input: { marginBottom: 16, width: "100%" },
  outline: { borderRadius: 12 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, width: "100%" },
});
