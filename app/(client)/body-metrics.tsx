import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput as RNTextInput,
  Platform,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  FAB,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useBodyMetrics, useAddBodyMetric, useDeleteBodyMetric } from "@/lib/queries/body-metrics";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/date-utils";
import type { AppTheme } from "@/lib/theme";
import type { BodyMetric } from "@/types/database";

export default function BodyMetricsScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  const { data: metrics = [], isLoading, isError, refetch } = useBodyMetrics(userId);
  const addMetric = useAddBodyMetric();
  const deleteMetric = useDeleteBodyMetric();
  const [showForm, setShowForm] = useState(false);

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [biceps, setBiceps] = useState("");
  const [thighs, setThighs] = useState("");

  const latest = metrics[0] ?? null;
  const previous = metrics[1] ?? null;

  const weightChange = useMemo(() => {
    if (!latest?.weight || !previous?.weight) return null;
    return latest.weight - previous.weight;
  }, [latest, previous]);

  const weightTrendPoints = useMemo(() => {
    const sorted = [...metrics]
      .filter((m) => m.weight != null)
      .sort((a, b) => a.logged_date.localeCompare(b.logged_date))
      .slice(-12);
    if (sorted.length < 2) return null;
    const weights = sorted.map((m) => m.weight!);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    return sorted.map((m) => ({
      date: m.logged_date,
      value: m.weight!,
      normalized: (m.weight! - min) / range,
    }));
  }, [metrics]);

  function resetForm() {
    setWeight("");
    setBodyFat("");
    setChest("");
    setWaist("");
    setHips("");
    setBiceps("");
    setThighs("");
    setShowForm(false);
  }

  async function handleSubmit() {
    const w = weight ? parseFloat(weight) : null;
    if (!w && !bodyFat && !chest && !waist && !hips && !biceps && !thighs) return;

    try {
      await addMetric.mutateAsync({
        client_id: userId,
        logged_date: formatDate(new Date()),
        weight: w,
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        biceps: biceps ? parseFloat(biceps) : null,
        thighs: thighs ? parseFloat(thighs) : null,
      });
      resetForm();
    } catch {
      Alert.alert(t("common.error"), t("bodyMetrics.failedAdd"));
    }
  }

  function handleDelete(id: string) {
    Alert.alert(t("bodyMetrics.deleteEntry"), t("bodyMetrics.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMetric.mutateAsync(id);
          } catch {
            Alert.alert(t("common.error"), t("bodyMetrics.failedDelete"));
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginLeft: 12, flex: 1 }}>
          {t("bodyMetrics.title")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {latest && (
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                  {latest.weight ?? t("bodyMetrics.noData")}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t("bodyMetrics.currentWeight")}
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                  {latest.body_fat != null ? `${latest.body_fat}%` : t("bodyMetrics.noData")}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t("bodyMetrics.bodyFat")}
                </Text>
              </Card.Content>
            </Card>
            {weightChange != null && (
              <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.statContent}>
                  <Text
                    variant="headlineMedium"
                    style={{
                      color: weightChange <= 0 ? theme.custom.success : theme.colors.error,
                      fontWeight: "700",
                    }}
                  >
                    {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t("bodyMetrics.change")}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {weightTrendPoints && (
          <Card style={[styles.trendCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
                {t("bodyMetrics.weightTrend")}
              </Text>
              <View style={styles.chartContainer}>
                {weightTrendPoints.map((p, i) => (
                  <View key={p.date} style={styles.chartBarCol}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: 20 + p.normalized * 80,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                    <Text style={{ fontSize: 9, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      {p.value}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {latest && (latest.chest != null || latest.waist != null || latest.hips != null || latest.biceps != null || latest.thighs != null) && (
          <Card style={[styles.measurementsCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
                {t("bodyMetrics.measurements")}
              </Text>
              {[
                { label: t("bodyMetrics.chest"), value: latest.chest },
                { label: t("bodyMetrics.waist"), value: latest.waist },
                { label: t("bodyMetrics.hips"), value: latest.hips },
                { label: t("bodyMetrics.biceps"), value: latest.biceps },
                { label: t("bodyMetrics.thighs"), value: latest.thighs },
              ]
                .filter((m) => m.value != null)
                .map((m) => (
                  <View key={m.label} style={styles.measurementRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{m.label}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: "600" }}>
                      {m.value} {t("bodyMetrics.inches")}
                    </Text>
                  </View>
                ))}
            </Card.Content>
          </Card>
        )}

        {showForm && (
          <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
                {t("bodyMetrics.logEntry")}
              </Text>
              <View style={styles.formRow}>
                <FormField label={t("bodyMetrics.weight")} value={weight} onChange={setWeight} theme={theme} />
                <FormField label={t("bodyMetrics.bodyFat")} value={bodyFat} onChange={setBodyFat} theme={theme} />
              </View>
              <View style={styles.formRow}>
                <FormField label={t("bodyMetrics.chest")} value={chest} onChange={setChest} theme={theme} />
                <FormField label={t("bodyMetrics.waist")} value={waist} onChange={setWaist} theme={theme} />
              </View>
              <View style={styles.formRow}>
                <FormField label={t("bodyMetrics.hips")} value={hips} onChange={setHips} theme={theme} />
                <FormField label={t("bodyMetrics.biceps")} value={biceps} onChange={setBiceps} theme={theme} />
              </View>
              <View style={styles.formRow}>
                <FormField label={t("bodyMetrics.thighs")} value={thighs} onChange={setThighs} theme={theme} />
                <View style={{ flex: 1 }} />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <Pressable
                  style={[styles.formButton, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={resetForm}
                >
                  <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{t("common.cancel")}</Text>
                </Pressable>
                <Pressable
                  style={[styles.formButton, { backgroundColor: theme.colors.primary, flex: 2 }]}
                  onPress={handleSubmit}
                  disabled={addMetric.isPending}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>
                    {addMetric.isPending ? t("common.loading") : t("common.save")}
                  </Text>
                </Pressable>
              </View>
            </Card.Content>
          </Card>
        )}

        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 20, marginBottom: 12 }}>
          {t("bodyMetrics.history")}
        </Text>

        {metrics.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="scale-bathroom" size={48} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: "center" }}>
              {t("bodyMetrics.noEntries")}
            </Text>
          </View>
        ) : (
          metrics.map((m) => (
            <MetricRow key={m.id} metric={m} theme={theme} t={t} onDelete={() => handleDelete(m.id)} />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!showForm && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => setShowForm(true)}
          label={t("bodyMetrics.addEntry")}
        />
      )}
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: AppTheme;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
        {label}
      </Text>
      <RNTextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          {
            color: theme.colors.onSurface,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.background,
          },
        ]}
        placeholder="—"
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

function MetricRow({
  metric,
  theme,
  t,
  onDelete,
}: {
  metric: BodyMetric;
  theme: AppTheme;
  t: (key: string) => string;
  onDelete: () => void;
}) {
  const dateStr = new Date(metric.logged_date + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.historyRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
            {dateStr}
          </Text>
          <View style={styles.historyMeta}>
            {metric.weight != null && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {metric.weight} {t("bodyMetrics.lbs")}
              </Text>
            )}
            {metric.body_fat != null && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {" · "}{metric.body_fat}{t("bodyMetrics.percent")}
              </Text>
            )}
          </View>
        </View>
        <IconButton icon="delete-outline" size={18} iconColor={theme.colors.error} onPress={onDelete} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: { padding: 16, paddingBottom: 100 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, elevation: 0 },
  statContent: { alignItems: "center", paddingVertical: 12 },
  trendCard: { borderRadius: 14, elevation: 0, marginBottom: 16 },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 120,
  },
  chartBarCol: { alignItems: "center", flex: 1 },
  chartBar: { width: 12, borderRadius: 6 },
  measurementsCard: { borderRadius: 14, elevation: 0, marginBottom: 16 },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  formCard: { borderRadius: 14, elevation: 0, marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  formButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  empty: { alignItems: "center", paddingVertical: 40 },
  historyCard: { borderRadius: 12, elevation: 0, marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  historyMeta: { flexDirection: "row", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
