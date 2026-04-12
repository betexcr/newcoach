import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import {
  Text,
  useTheme,
  Card,
  Avatar,
  Chip,
  Searchbar,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import {
  coachProfile,
  demoClients,
  demoExercises,
  demoTemplates,
  demoAssignedWorkouts,
  demoProgram,
  demoProgramWorkouts,
  demoConversations,
  demoChatMessages,
  demoActivityFeed,
  COACH_ID,
} from "./mock-data";

function SectionHeader({
  icon,
  title,
  theme,
}: {
  icon: string;
  title: string;
  theme: AppTheme;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
      </View>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
        {title}
      </Text>
    </View>
  );
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

const statusColor = (status: string, theme: AppTheme) => {
  if (status === "completed") return theme.colors.secondary;
  if (status === "missed") return theme.custom.error;
  if (status === "partial") return theme.custom.partial;
  return theme.colors.primary;
};

export default function CoachDemoScreen() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { t } = useTranslation();

  const activeClients = demoClients.filter((c) => c.status === "active");
  const todayWorkouts = demoAssignedWorkouts.filter((w) => {
    const t = new Date().toISOString().split("T")[0];
    return w.scheduled_date === t;
  });

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Back to demo index */}
        <Pressable style={s.backRow} onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary} />
          <Text variant="labelLarge" style={{ color: theme.colors.primary, marginLeft: 6 }}>
            {t("demo.backToDemo")}
          </Text>
        </Pressable>

        <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: "800", marginBottom: 4 }}>
          {t("demo.coachHeadline")}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
          {t("demo.coachSubtitle")}
        </Text>

        {/* ──────────────── DASHBOARD ──────────────── */}
        <SectionHeader icon="view-dashboard" title={t("tabs.dashboard")} theme={theme} />

        <View style={s.greeting}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("demo.welcomeBack")}
            </Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
              {coachProfile.full_name}
            </Text>
          </View>
          <Avatar.Text size={48} label={initials(coachProfile.full_name)} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{ color: theme.colors.primary }} />
        </View>

        <View style={s.statsRow}>
          {[
            { label: t("dashboard.activeClients"), value: String(activeClients.length), icon: "account-group" },
            { label: t("dashboard.todaysWorkouts"), value: String(todayWorkouts.length), icon: "dumbbell" },
            { label: t("dashboard.messages"), value: String(demoConversations.length), icon: "message" },
          ].map((st) => (
            <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={s.statContent}>
                <MaterialCommunityIcons name={st.icon as any} size={24} color={theme.colors.primary} />
                <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 8 }}>
                  {st.value}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {st.label}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
          {t("demo.quickActions")}
        </Text>
        <View style={s.actionsGrid}>
          {[
            { label: t("demo.newWorkout"), icon: "plus-circle", color: theme.colors.primary },
            { label: t("demo.addClient"), icon: "account-plus", color: theme.colors.secondary },
            { label: t("demo.newProgram"), icon: "clipboard-list", color: theme.custom.warning },
            { label: t("demo.broadcast"), icon: "bullhorn", color: theme.custom.purple },
          ].map((a) => (
            <View key={a.label} style={[s.actionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[s.actionIcon, { backgroundColor: `${a.color}15` }]}>
                <MaterialCommunityIcons name={a.icon as any} size={28} color={a.color} />
              </View>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginTop: 8, fontWeight: "600" }}>
                {a.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Activity Feed */}
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
          {t("demo.recentActivity")}
        </Text>
        <View style={s.activityList}>
          {demoActivityFeed.map((item, idx) => (
            <View
              key={item.id}
              style={[
                s.activityRow,
                { backgroundColor: theme.colors.surface },
                idx === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
                idx === demoActivityFeed.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
              ]}
            >
              <View style={[s.activityIcon, { backgroundColor: `${item.type === "workout_completed" ? theme.colors.secondary : item.type === "client_added" ? theme.colors.secondary : theme.colors.primary}15` }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={item.type === "workout_completed" ? theme.colors.secondary : theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.subtitle}
                  </Text>
                  <View style={[s.clientTag, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="account" size={12} color={theme.colors.primary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 3 }} numberOfLines={1}>
                      {item.clientName}
                    </Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
          ))}
        </View>

        <Divider style={s.divider} />

        {/* ──────────────── CLIENT LIST ──────────────── */}
        <SectionHeader icon="account-group" title={t("demo.clients")} theme={theme} />

        <Searchbar placeholder={t("demo.searchClients")} value="" onChangeText={() => {}} style={[s.searchBar, { backgroundColor: theme.colors.surface }]} inputStyle={{ fontSize: 15 }} />

        <View style={s.chipRow}>
          {[t("demo.all"), t("demo.active"), t("demo.pending"), t("demo.inactive")].map((label, i) => (
            <Chip
              key={label}
              mode={i === 0 ? "flat" : "outlined"}
              selected={i === 0}
              style={[s.chip, i === 0 && { backgroundColor: theme.colors.primary }]}
              textStyle={[{ textTransform: "capitalize", fontSize: 13 }, i === 0 && { color: theme.colors.onPrimary }]}
            >
              {label}
            </Chip>
          ))}
        </View>

        {demoClients.map((c) => (
          <View key={c.id} style={[s.clientRow, { backgroundColor: theme.colors.surface }]}>
            <Avatar.Text size={44} label={initials(c.profile?.full_name ?? null)} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{ color: theme.colors.primary, fontSize: 16 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {c.profile?.full_name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {c.profile?.email}
              </Text>
            </View>
            <Chip
              mode="flat"
              textStyle={{ fontSize: 11, textTransform: "capitalize" }}
              style={{
                backgroundColor:
                  c.status === "active" ? theme.colors.secondaryContainer
                    : c.status === "pending" ? `${theme.custom.warning}20`
                      : theme.colors.surfaceVariant,
              }}
            >
              {c.status}
            </Chip>
          </View>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── CLIENT PROFILE ──────────────── */}
        <SectionHeader icon="account-details" title={t("demo.clientProfile")} theme={theme} />

        <View style={[s.profileHeader, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Text size={56} label="JA" style={{ backgroundColor: theme.colors.secondaryContainer }} labelStyle={{ color: theme.colors.secondary }} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
              Jordan Athlete
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              jordan@email.com
            </Text>
          </View>
          <Chip mode="flat" style={{ backgroundColor: theme.colors.secondaryContainer }} textStyle={{ fontSize: 11, textTransform: "capitalize" }}>
            active
          </Chip>
        </View>

        <View style={s.statsRow}>
          {[
            { label: t("demo.completed"), value: "16", icon: "check-circle" },
            { label: t("demo.compliance"), value: "78%", icon: "percent" },
            { label: t("demo.streak"), value: "8 days", icon: "fire" },
          ].map((st) => (
            <Card key={st.label} style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={s.statContent}>
                <MaterialCommunityIcons name={st.icon as any} size={22} color={theme.colors.primary} />
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>
                  {st.value}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {st.label}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Recent workouts preview */}
        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, marginBottom: 8 }}>
          {t("demo.recentWorkouts")}
        </Text>
        {demoAssignedWorkouts.slice(0, 4).map((w) => (
          <View key={w.id} style={[s.workoutRow, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {w.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {w.scheduled_date} &middot; {w.exercises.length} {t("demo.exercises")}
              </Text>
            </View>
            <Text
              variant="labelSmall"
              style={{ color: statusColor(w.status, theme), fontWeight: "600", textTransform: "capitalize" }}
            >
              {w.status}
            </Text>
          </View>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── EXERCISE LIBRARY ──────────────── */}
        <SectionHeader icon="bookshelf" title={t("demo.exerciseLibrary")} theme={theme} />

        <View style={s.chipRow}>
          {["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((label, i) => (
            <Chip
              key={label}
              mode={i === 0 ? "flat" : "outlined"}
              selected={i === 0}
              style={[s.chip, i === 0 && { backgroundColor: theme.colors.primary }]}
              textStyle={[{ textTransform: "capitalize", fontSize: 13 }, i === 0 && { color: theme.colors.onPrimary }]}
            >
              {label}
            </Chip>
          ))}
        </View>

        {demoExercises.slice(0, 8).map((ex) => (
          <View key={ex.id} style={[s.exerciseRow, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {ex.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize", marginTop: 2 }}>
                {ex.muscle_group}{ex.equipment ? ` \u00B7 ${ex.equipment}` : ""}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        ))}

        {/* Exercise detail card */}
        <Card style={[s.detailCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
              Barbell Bench Press
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Chip mode="flat" style={{ backgroundColor: theme.colors.primaryContainer }} textStyle={{ fontSize: 11, textTransform: "capitalize" }}>chest</Chip>
              <Chip mode="flat" style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11, textTransform: "capitalize" }}>barbell</Chip>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, lineHeight: 20 }}>
              Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up. Keep feet flat on floor and maintain a slight arch in your lower back.
            </Text>
          </Card.Content>
        </Card>

        <Divider style={s.divider} />

        {/* ──────────────── WORKOUT BUILDER ──────────────── */}
        <SectionHeader icon="wrench" title={t("demo.workoutBuilder")} theme={theme} />

        <Card style={[s.builderCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{t("demo.workoutName")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>Upper Body Strength</Text>
            </View>

            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4, marginTop: 12 }}>{t("demo.description")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Compound upper body focus</Text>
            </View>
          </Card.Content>
        </Card>

        {demoTemplates[0].exercises.slice(0, 3).map((ex) => (
          <Card key={ex.exercise_id + ex.order} style={[s.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                  {ex.exercise_name}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {ex.sets.length} sets
                </Text>
              </View>

              {/* Set table */}
              <View style={[s.setHeader, { borderBottomColor: theme.colors.outline }]}>
                <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.set")}</Text>
                <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.reps")}</Text>
                <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.weight")}</Text>
                <Text variant="labelSmall" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{t("demo.rest")}</Text>
              </View>
              {ex.sets.map((set) => (
                <View key={set.set_number} style={s.setRow}>
                  <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.set_number}</Text>
                  <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.reps ?? "—"}</Text>
                  <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurface }]}>{set.weight ? `${set.weight} kg` : "—"}</Text>
                  <Text variant="bodyMedium" style={[s.setCol, { color: theme.colors.onSurfaceVariant }]}>{set.rest_seconds ? `${set.rest_seconds}s` : "—"}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}

        <View style={[s.addExerciseBtn, { borderColor: theme.colors.outline }]}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
          <Text variant="labelLarge" style={{ color: theme.colors.primary, marginLeft: 6 }}>
            {t("demo.addExercise")}
          </Text>
        </View>

        <Divider style={s.divider} />

        {/* ──────────────── PROGRAMS ──────────────── */}
        <SectionHeader icon="clipboard-list" title={t("demo.programs")} theme={theme} />

        <Card style={[s.programCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
              {demoProgram.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {demoProgram.description}
            </Text>
            <Chip mode="flat" style={{ backgroundColor: theme.colors.primaryContainer, alignSelf: "flex-start", marginTop: 8 }} textStyle={{ fontSize: 11 }}>
              {demoProgram.duration_weeks} {t("demo.weeks")}
            </Chip>
          </Card.Content>
        </Card>

        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, marginBottom: 8 }}>
          {t("demo.week1")}
        </Text>
        {demoProgramWorkouts.map((pw) => (
          <View key={pw.id} style={[s.workoutRow, { backgroundColor: theme.colors.surface }]}>
            <View style={[s.dayBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                D{pw.day_number}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {pw.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {pw.exercises.length} {t("demo.exercises")}
              </Text>
            </View>
          </View>
        ))}

        <Divider style={s.divider} />

        {/* ──────────────── MESSAGING ──────────────── */}
        <SectionHeader icon="message" title={t("demo.messaging")} theme={theme} />

        {demoConversations.map((conv) => (
          <View key={conv.id} style={[s.convRow, { backgroundColor: theme.colors.surface }]}>
            <Avatar.Icon
              size={44}
              icon={conv.type === "direct" ? "account" : conv.type === "broadcast" ? "bullhorn" : "account-group"}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                {conv.name ?? (conv.type === "direct" ? "Jordan Athlete" : "Group Chat")}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                {conv.last_message?.body ?? ""}
              </Text>
            </View>
          </View>
        ))}

        {/* Chat preview */}
        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
          {t("demo.chatPreview")}
        </Text>
        <View style={[s.chatContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          {demoChatMessages.map((msg) => {
            const isOwn = msg.sender_id === COACH_ID;
            return (
              <View
                key={msg.id}
                style={[
                  s.bubble,
                  isOwn ? s.ownBubble : s.otherBubble,
                  { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface },
                ]}
              >
                <Text variant="bodyMedium" style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface, lineHeight: 20 }}>
                  {msg.body}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{
                    color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                    opacity: isOwn ? 0.6 : 1,
                    marginTop: 4,
                    alignSelf: isOwn ? "flex-end" : "flex-start",
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 10 },
  greeting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  actionCard: { width: "47%", borderRadius: 16, padding: 20, alignItems: "center" },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  activityList: { gap: 1, marginBottom: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  clientTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  divider: { marginVertical: 28 },
  searchBar: { borderRadius: 12, elevation: 0, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { borderRadius: 20 },
  clientRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  profileHeader: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 16 },
  workoutRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  exerciseRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  detailCard: { borderRadius: 16, marginTop: 12, elevation: 0 },
  builderCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  fakeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  exerciseBlock: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  setHeader: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 8, marginTop: 12 },
  setRow: { flexDirection: "row", paddingVertical: 6 },
  setCol: { flex: 1, textAlign: "center" },
  addExerciseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, marginTop: 4 },
  programCard: { borderRadius: 16, elevation: 0 },
  dayBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  convRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  chatContainer: { borderRadius: 16, padding: 12 },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 6 },
  ownBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
});
