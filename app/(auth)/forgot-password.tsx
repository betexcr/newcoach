import { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AuthInput } from "@/components/AuthInput";
import { AuthButton } from "@/components/AuthButton";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      setError(t("auth.enterEmail"));
      return;
    }

    if (!isValidEmail(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo:
            Platform.OS === "web"
              ? `${window.location.origin}/reset-password`
              : "newcoach://reset-password",
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("common.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.sentContent}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            {t("auth.checkEmail")}
          </Text>
          <Text
            variant="bodyLarge"
            style={[
              styles.sentMessage,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t("auth.resetLinkSent", { email })}
          </Text>
          <AuthButton onPress={() => router.back()}>{t("auth.backToSignIn")}</AuthButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            {t("auth.resetPassword")}
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {t("auth.resetPasswordSubtitle")}
          </Text>
        </View>

        <View style={styles.form}>
          <AuthInput
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<AuthInput.Icon icon="email-outline" />}
          />

          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <AuthButton
            onPress={handleReset}
            loading={loading}
            disabled={loading}
          >
            {t("auth.sendResetLink")}
          </AuthButton>

          <AuthButton variant="text" onPress={() => router.back()}>
            {t("auth.backToSignIn")}
          </AuthButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  sentContent: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
  sentMessage: {
    textAlign: "center",
    marginVertical: 24,
    lineHeight: 24,
  },
  form: {
    gap: 4,
  },
  error: {
    textAlign: "center",
    marginVertical: 8,
    fontSize: 14,
  },
});
