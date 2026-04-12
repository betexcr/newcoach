import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, useTheme, Avatar, Chip, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePublicProfile } from "@/lib/queries/public-profile";
import type { AppTheme } from "@/lib/theme";

export default function PublicCoachProfile() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { t } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: profile, isLoading, isError } = usePublicProfile(slug ?? "");

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="account-off" size={48} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
          {t("publicProfile.notFound")}
        </Text>
      </SafeAreaView>
    );
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {profile.avatar_url ? (
            <Avatar.Image size={96} source={{ uri: profile.avatar_url }} />
          ) : (
            <Avatar.Text size={96} label={initials} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{ color: theme.colors.primary }} />
          )}
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}>
            {profile.full_name}
          </Text>
          {profile.bio && (
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8, lineHeight: 24 }}>
              {profile.bio}
            </Text>
          )}
        </View>

        {profile.specialties && profile.specialties.length > 0 && (
          <View style={styles.specialtiesSection}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
              {t("publicProfile.specialties")}
            </Text>
            <View style={styles.chipGrid}>
              {profile.specialties.map((s: string) => (
                <Chip key={s} style={{ marginBottom: 6 }}>{s}</Chip>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push("/(auth)/signup" as any)}
          accessibilityRole="button"
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>
            {t("publicProfile.getStarted")}
          </Text>
        </Pressable>

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>
          {t("publicProfile.poweredBy")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 24, paddingBottom: 48 },
  hero: { alignItems: "center", marginBottom: 32 },
  specialtiesSection: { marginBottom: 32 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ctaButton: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
});
