import { View, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { Text, useTheme, Avatar, Chip, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "./use-demo-fade";
import { DemoPress } from "./DemoTooltip";
import { coachProfile } from "./mock-data";

export default function DemoPublicProfile() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro } = useDemoFadeIn("public-profile");

  const initials = coachProfile.full_name
    ? coachProfile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.navigate({ pathname: "/demo/coach/settings" } as any)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600", marginLeft: 12 }}>
          {t("demo.publicProfileSection")}
        </Text>
      </View>

      <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
        <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained" onPress={dismissIntro}>
          <Card.Content style={s.introContent}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
              {t("demo.introPublicProfile")}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity }}>
        <View style={s.hero}>
          <Avatar.Text
            size={96}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}>
            {coachProfile.full_name}
          </Text>
          {coachProfile.bio && (
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8, lineHeight: 24 }}>
              {coachProfile.bio}
            </Text>
          )}
        </View>

        {coachProfile.specialties && coachProfile.specialties.length > 0 && (
          <View style={s.specialtiesSection}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
              {t("publicProfile.specialties")}
            </Text>
            <View style={s.chipGrid}>
              {coachProfile.specialties.map((sp) => (
                <Chip key={sp} style={{ marginBottom: 6 }}>{sp}</Chip>
              ))}
            </View>
          </View>
        )}

        <View style={[s.linkRow, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="link-variant" size={20} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginLeft: 8, flex: 1 }} numberOfLines={1}>
            newcoach.vercel.app/coach/{coachProfile.public_slug}
          </Text>
          <DemoPress style={[s.copyBtn, { backgroundColor: theme.colors.primaryContainer }]} accessibilityRole="button">
            <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.primary} />
            <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "700", marginLeft: 4 }}>
              {t("settings.linkCopied")}
            </Text>
          </DemoPress>
        </View>

        <DemoPress
          style={[s.ctaButton, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>
            {t("publicProfile.getStarted")}
          </Text>
        </DemoPress>

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 24 }}>
          {t("publicProfile.poweredBy")}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  hero: { alignItems: "center", marginBottom: 32 },
  specialtiesSection: { marginBottom: 32 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linkRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 24 },
  copyBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  ctaButton: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
});
