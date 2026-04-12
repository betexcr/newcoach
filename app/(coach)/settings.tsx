import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform, Linking } from "react-native";
import { Text, useTheme, Avatar, Divider, SegmentedButtons, Card, ActivityIndicator, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutBuilderStore } from "@/stores/workout-builder-store";
import { useChatNavStore } from "@/stores/chat-nav-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useSubscription, useCreateCheckoutSession, useOpenCustomerPortal } from "@/lib/queries/billing";
import { useUpdateCoachProfile } from "@/lib/queries/public-profile";
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook } from "@/lib/queries/webhooks";
import type { WebhookEventType } from "@/types/database";
import type { ThemePreference, LanguagePreference } from "@/stores/settings-store";
import type { AppTheme } from "@/lib/theme";

const APP_BASE_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://newcoach.vercel.app";

export default function SettingsScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const reset = useAuthStore((s) => s.reset);
  const themePref = useSettingsStore((s) => s.theme);
  const languagePref = useSettingsStore((s) => s.language);
  const setThemePref = useSettingsStore((s) => s.setTheme);
  const setLanguagePref = useSettingsStore((s) => s.setLanguage);

  const [publicSlug, setPublicSlug] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvent, setWebhookEvent] = useState<WebhookEventType>("workout.completed");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  const { data: subscription, isLoading: subLoading } = useSubscription(userId);
  const createCheckout = useCreateCheckoutSession();
  const openPortal = useOpenCustomerPortal();
  const updateProfile = useUpdateCoachProfile();
  const { data: webhooks } = useWebhooks(userId);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  useEffect(() => {
    if (profile) {
      setPublicSlug(profile.public_slug ?? "");
      setBio(profile.bio ?? "");
      setSpecialties(profile.specialties?.join(", ") ?? "");
    }
  }, [profile]);

  async function handleManageSubscription() {
    if (!subscription?.stripe_customer_id) {
      try {
        const url = await createCheckout.mutateAsync({ plan: "professional" });
        if (url) Linking.openURL(url);
      } catch {
        Alert.alert(t("common.error"), t("common.errorGeneric"));
      }
      return;
    }
    try {
      const url = await openPortal.mutateAsync({});
      if (url) Linking.openURL(url);
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }

  async function doLogout() {
    try {
      if (profile?.id) {
        await supabase.from("profiles").update({ push_token: null }).eq("id", profile.id);
      }
      await supabase.auth.signOut();
    } catch (err: unknown) {
      if (__DEV__) console.warn("Sign out failed:", err);
      Alert.alert(t("common.error"), t("common.errorGeneric"));
      return;
    }
    queryClient.clear();
    useWorkoutBuilderStore.getState().reset();
    useChatNavStore.getState().clear();
    reset();
    router.replace("/(auth)/login");
  }

  async function handleSaveProfile() {
    if (!profile?.id) return;
    try {
      const parsedSpecialties = specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProfile.mutateAsync({
        id: profile.id,
        public_slug: publicSlug || null,
        bio: bio || null,
        specialties: parsedSpecialties.length > 0 ? parsedSpecialties : null,
      });
      Alert.alert(t("settings.profileSaved"));
    } catch {
      Alert.alert(t("common.error"), t("settings.profileSaveFailed"));
    }
  }

  async function handleCopyLink() {
    if (publicSlug) {
      await Clipboard.setStringAsync(`${APP_BASE_URL}/coach/${publicSlug}`);
      Alert.alert(t("settings.linkCopied"));
    }
  }

  const WEBHOOK_EVENTS: WebhookEventType[] = [
    "workout.completed",
    "client.added",
    "client.removed",
    "message.sent",
  ];

  async function handleAddWebhook() {
    if (!webhookUrl.trim()) return;
    try {
      await createWebhook.mutateAsync({
        coach_id: userId,
        event_type: webhookEvent,
        url: webhookUrl.trim(),
        secret: webhookSecret.trim() || null,
      });
      setWebhookUrl("");
      setWebhookSecret("");
      setShowAddWebhook(false);
    } catch {
      Alert.alert(t("common.error"), t("common.errorGeneric"));
    }
  }

  function handleDeleteWebhook(id: string) {
    const doDelete = () => deleteWebhook.mutate({ id, coach_id: userId });
    if (Platform.OS === "web") {
      if (window.confirm(t("settings.deleteWebhookConfirm"))) doDelete();
      return;
    }
    Alert.alert(t("settings.deleteWebhook"), t("settings.deleteWebhookConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: doDelete },
    ]);
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm(t("settings.signOutConfirm"))) {
        doLogout();
      }
      return;
    }
    Alert.alert(t("settings.signOut"), t("settings.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.signOut"), style: "destructive", onPress: doLogout },
    ]);
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const menuItems = [
    { icon: "account-circle-outline", label: t("settings.editProfile"), route: "/(auth)/edit-profile" },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {t("settings.title")}
        </Text>

        <Pressable
          style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push("/(auth)/edit-profile" as any)}
        >
          <Avatar.Text
            size={56}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
          <View style={styles.profileInfo}>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {profile?.full_name ?? t("settings.yourName")}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {profile?.email ?? t("settings.emailPlaceholder")}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {t("settings.roleCoach")}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>

        <View
          style={[styles.menuSection, { backgroundColor: theme.colors.surface }]}
        >
          {menuItems.map((item, index) => (
            <View key={item.label}>
              <Pressable
                style={styles.menuItem}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <MaterialCommunityIcons
                  name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyLarge"
                  style={{
                    flex: 1,
                    color: theme.colors.onSurface,
                    marginLeft: 16,
                  }}
                >
                  {item.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
              {index < menuItems.length - 1 && (
                <Divider style={{ marginLeft: 56 }} />
              )}
            </View>
          ))}
        </View>

        <Card style={[styles.billingCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialCommunityIcons name="credit-card-outline" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 8 }}>
                {t("billing.title")}
              </Text>
            </View>

            {subLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : subscription ? (
              <View>
                <View style={[styles.billingRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("billing.currentPlan")}</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: "700", textTransform: "capitalize" }}>
                    {t(`billing.${subscription.plan}`)}
                  </Text>
                </View>
                <View style={[styles.billingRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("billing.status")}</Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: subscription.status === "active" ? theme.custom.success : theme.colors.error,
                      fontWeight: "600",
                    }}
                  >
                    {t(`billing.${subscription.status === "past_due" ? "pastDue" : subscription.status}`)}
                  </Text>
                </View>
                {subscription.current_period_end && (
                  <View style={[styles.billingRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t("billing.nextBilling")}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    style={[styles.billingButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleManageSubscription}
                    disabled={openPortal.isPending}
                  >
                    <Text style={{ color: theme.colors.onPrimary, fontWeight: "600", fontSize: 13 }}>
                      {t("billing.manageSubscription")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                  {t("billing.noPlan")}
                </Text>
                <Pressable
                  style={[styles.billingButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleManageSubscription}
                  disabled={createCheckout.isPending}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
                    {t("billing.subscribe")}
                  </Text>
                </Pressable>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialCommunityIcons name="webhook" size={22} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 8 }}>
              {t("settings.integrations")}
            </Text>
          </View>

          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, fontWeight: "700" }}
          >
            {t("settings.webhooks")}
          </Text>

          {webhooks && webhooks.length > 0 ? (
            webhooks.map((wh) => (
              <View
                key={wh.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: theme.colors.outlineVariant,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                    {wh.url}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {wh.event_type}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    updateWebhook.mutate({
                      id: wh.id,
                      coach_id: userId,
                      active: !wh.active,
                    })
                  }
                  style={{ marginRight: 12 }}
                >
                  <MaterialCommunityIcons
                    name={wh.active ? "toggle-switch" : "toggle-switch-off-outline"}
                    size={36}
                    color={wh.active ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                </Pressable>
                <Pressable onPress={() => handleDeleteWebhook(wh.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              {t("settings.noWebhooks")}
            </Text>
          )}

          {showAddWebhook ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                label={t("settings.webhookUrl")}
                value={webhookUrl}
                onChangeText={setWebhookUrl}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="url"
                style={{ marginBottom: 8 }}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                {t("settings.webhookEvent")}
              </Text>
              <SegmentedButtons
                value={webhookEvent}
                onValueChange={(v) => setWebhookEvent(v as WebhookEventType)}
                buttons={WEBHOOK_EVENTS.map((e) => ({ value: e, label: e.replace(".", " ") }))}
                style={{ marginBottom: 8 }}
              />
              <TextInput
                label={t("settings.webhookSecret")}
                value={webhookSecret}
                onChangeText={setWebhookSecret}
                mode="outlined"
                autoCapitalize="none"
                secureTextEntry
                style={{ marginBottom: 12 }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={[styles.billingButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddWebhook}
                  disabled={createWebhook.isPending}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
                    {t("common.save")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.billingButton, { backgroundColor: theme.colors.secondaryContainer }]}
                  onPress={() => setShowAddWebhook(false)}
                >
                  <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: "700", fontSize: 13 }}>
                    {t("common.cancel")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.billingButton, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
              onPress={() => setShowAddWebhook(true)}
            >
              <Text style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
                {t("settings.addWebhook")}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, fontWeight: "700" }}
          >
            {t("settings.publicProfile")}
          </Text>

          <TextInput
            label={t("settings.profileSlug")}
            value={publicSlug}
            onChangeText={setPublicSlug}
            mode="outlined"
            autoCapitalize="none"
            style={{ marginBottom: 4 }}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            {t("settings.profileSlugHint")}
          </Text>

          <TextInput
            label={t("settings.bio")}
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label={t("settings.specialties")}
            value={specialties}
            onChangeText={setSpecialties}
            mode="outlined"
            style={{ marginBottom: 4 }}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            {t("settings.specialtiesHint")}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[styles.billingButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSaveProfile}
              disabled={updateProfile.isPending}
            >
              <Text style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
                {t("settings.saveProfile")}
              </Text>
            </Pressable>
            {publicSlug ? (
              <Pressable
                style={[styles.billingButton, { backgroundColor: theme.colors.secondaryContainer }]}
                onPress={handleCopyLink}
              >
                <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: "700", fontSize: 13 }}>
                  {t("settings.copyLink")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, fontWeight: "700" }}
          >
            {t("settings.appearance")}
          </Text>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            {t("settings.theme")}
          </Text>
          <SegmentedButtons
            value={themePref}
            onValueChange={(v) => setThemePref(v as ThemePreference)}
            buttons={[
              { value: "auto", label: t("settings.themeAuto") },
              { value: "light", label: t("settings.themeLight") },
              { value: "dark", label: t("settings.themeDark") },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            {t("settings.language")}
          </Text>
          <SegmentedButtons
            value={languagePref}
            onValueChange={(v) => setLanguagePref(v as LanguagePreference)}
            buttons={[
              { value: "auto", label: t("settings.langAuto") },
              { value: "en", label: t("settings.langEnglish") },
              { value: "es", label: t("settings.langSpanish") },
            ]}
          />
        </View>

        <Pressable
          style={[styles.logoutButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={theme.colors.error}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.error, marginLeft: 16, fontWeight: "600" }}
          >
            {t("settings.signOut")}
          </Text>
        </Pressable>

        <Text
          variant="bodySmall"
          style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("common.version")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontWeight: "700",
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  menuSection: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  billingCard: {
    borderRadius: 16,
    elevation: 0,
    marginBottom: 16,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  billingButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  settingsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  version: {
    textAlign: "center",
    marginTop: 24,
  },
});
