import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Card, Avatar, Chip, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { demoClients, demoAssignedWorkouts } from "../mock-data";

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

export default function DemoClients() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained">
        <Card.Content style={s.introContent}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
            {t("demo.introClients")}
          </Text>
        </Card.Content>
      </Card>

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

      <View style={{ height: 20 }} />

      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
        {t("demo.clientProfile")}
      </Text>

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
        <Chip mode="flat" style={{ backgroundColor: theme.colors.secondaryContainer }} textStyle={{ fontSize: 11, textTransform: "capitalize" }}>active</Chip>
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
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 6 }}>{st.value}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{st.label}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, marginBottom: 8 }}>
        {t("demo.recentWorkouts")}
      </Text>
      {demoAssignedWorkouts.slice(0, 4).map((w) => (
        <View key={w.id} style={[s.workoutRow, { backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{w.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {w.scheduled_date} &middot; {w.exercises.length} {t("demo.exercises")}
            </Text>
          </View>
          <Text variant="labelSmall" style={{ color: statusColor(w.status, theme), fontWeight: "600", textTransform: "capitalize" }}>
            {w.status}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  searchBar: { borderRadius: 12, elevation: 0, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { borderRadius: 20 },
  clientRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  profileHeader: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 14 },
  workoutRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
});
