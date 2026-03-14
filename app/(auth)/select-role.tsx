import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButton } from "@/components/AuthButton";
import type { UserRole } from "@/types/database";

export default function SelectRoleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles: { id: UserRole; title: string; description: string; icon: string }[] = [
    {
      id: "coach",
      title: t("auth.imCoach"),
      description: t("auth.coachDescription"),
      icon: "whistle",
    },
    {
      id: "client",
      title: t("auth.imClient"),
      description: t("auth.clientDescription"),
      icon: "dumbbell",
    },
  ];

  async function handleContinue() {
    if (!selectedRole) return;

    setLoading(true);
    setError("");

    try {
      const userId =
        user?.id ??
        (await supabase.auth.getUser().then((r) => r.data.user?.id));

      if (!userId) {
        setError(t("auth.sessionExpired"));
        setLoading(false);
        return;
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      if (selectedRole === "coach") {
        router.replace("/(coach)/dashboard");
      } else {
        router.replace("/(client)/today");
      }
    } catch (err: any) {
      setError(err.message ?? t("auth.somethingWrong"));
      setLoading(false);
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.primary }]}
        >
          {t("auth.chooseRole")}
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("auth.howUsingApp")}
        </Text>
      </View>

      <View style={styles.cards}>
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <Pressable
              key={role.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.outline,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={role.icon as any}
                  size={32}
                  color={
                    isSelected
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>
              <Text
                variant="titleLarge"
                style={{
                  color: isSelected
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                  fontWeight: "700",
                }}
              >
                {role.title}
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 20,
                }}
              >
                {role.description}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}

      <AuthButton
        onPress={handleContinue}
        loading={loading}
        disabled={loading || !selectedRole}
        style={styles.continueButton}
      >
        {t("auth.continue")}
      </AuthButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
  cards: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
  continueButton: {
    marginTop: 24,
  },
});
