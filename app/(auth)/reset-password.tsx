import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AuthInput } from "@/components/AuthInput";
import { AuthButton } from "@/components/AuthButton";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleUpdatePassword() {
    if (!password.trim()) {
      setError(t("auth.enterNewPassword"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  if (hasSession === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (hasSession === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContent}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.error }]}
          >
            {t("auth.invalidResetLink")}
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.successMessage, { color: theme.colors.onSurfaceVariant }]}
          >
            {t("auth.invalidResetLinkMessage")}
          </Text>
          <AuthButton onPress={() => router.replace("/(auth)/forgot-password")}>
            {t("auth.requestNewLink")}
          </AuthButton>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.successContent}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            {t("auth.passwordUpdated")}
          </Text>
          <Text
            variant="bodyLarge"
            style={[
              styles.successMessage,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t("auth.passwordUpdatedMessage")}
          </Text>
          <AuthButton onPress={() => router.replace("/(auth)/login")}>
            {t("auth.goToSignIn")}
          </AuthButton>
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
            {t("auth.setNewPassword")}
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {t("auth.newPasswordSubtitle")}
          </Text>
        </View>

        <View style={styles.form}>
          <AuthInput
            label={t("auth.newPassword")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            left={<AuthInput.Icon icon="lock-outline" />}
          />

          <AuthInput
            label={t("auth.confirmPassword")}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            left={<AuthInput.Icon icon="lock-check-outline" />}
          />

          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <AuthButton
            onPress={handleUpdatePassword}
            loading={loading}
            disabled={loading}
          >
            {t("auth.updatePassword")}
          </AuthButton>

          <AuthButton variant="text" onPress={() => router.replace("/(auth)/login")}>
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
  successContent: {
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
  successMessage: {
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
