import { useTranslation } from "react-i18next";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import {
  Text,
  useTheme,
  Card,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import {
  usePendingInvites,
  useAcceptInvite,
  useDeclineInvite,
  type InviteWithCoach,
} from "@/lib/queries/clients";
import { AuthButton } from "@/components/AuthButton";

export default function InvitesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const { data: invites = [], isLoading } = usePendingInvites(userId);
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  async function handleAccept(invite: InviteWithCoach) {
    try {
      await acceptInvite.mutateAsync(invite.id);
      Alert.alert(t("common.ok"), t("invites.accepted"));
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? t("invites.failedAccept"));
    }
  }

  function handleDecline(invite: InviteWithCoach) {
    const coachName = invite.coach?.full_name ?? "this coach";
    Alert.alert(
      t("invites.decline"),
      t("invites.declineConfirm", { name: coachName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("invites.decline"),
          style: "destructive",
          onPress: async () => {
            try {
              await declineInvite.mutateAsync(invite.id);
            } catch (err: any) {
              Alert.alert(t("common.error"), err.message ?? t("invites.failedDecline"));
            }
          },
        },
      ]
    );
  }

  function renderInvite({ item }: { item: InviteWithCoach }) {
    const coachName = item.coach?.full_name ?? "Coach";
    const initials = coachName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

    return (
      <Card
        style={[styles.inviteCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content style={styles.inviteContent}>
          <Avatar.Text
            size={52}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary, fontSize: 20 }}
          />
          <View style={styles.inviteInfo}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {coachName}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.coach?.email}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            >
              {t("invites.coachWantsToConnect", { name: coachName })}
            </Text>
          </View>
        </Card.Content>
        <View style={styles.inviteActions}>
          <Pressable
            style={[styles.declineButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDecline(item)}
          >
            <Text style={{ color: theme.colors.error, fontWeight: "600" }}>
              {t("invites.decline")}
            </Text>
          </Pressable>
          <AuthButton
            onPress={() => handleAccept(item)}
            loading={acceptInvite.isPending}
            style={{ flex: 1 }}
          >
            {t("invites.accept")}
          </AuthButton>
        </View>
      </Card>
    );
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
          style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}
        >
          {t("invites.title")}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : invites.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-check-outline"
            size={56}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}
          >
            {t("invites.noInvites")}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8, paddingHorizontal: 32 }}
          >
            {t("invites.noInvitesMessage")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInvite}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: { padding: 16, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  inviteCard: { borderRadius: 16, elevation: 0 },
  inviteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  inviteInfo: { flex: 1 },
  inviteActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  declineButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
  },
});
