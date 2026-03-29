import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useClientWorkouts } from "@/lib/queries/workouts";
import { useAuthStore } from "@/stores/auth-store";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/date-utils";
import type { AssignedWorkout } from "@/types/database";
import type { AppTheme } from "@/lib/theme";

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const [weekOffset, setWeekOffset] = useState(0);

  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate]);

  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const { data: workouts = [], isLoading: workoutsLoading, isError, refetch } = useClientWorkouts(
    userId ?? "",
    startDate,
    endDate
  );

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  useEffect(() => {
    const today = new Date();
    const todayStr = formatDate(today);
    const weekStart = formatDate(weekDates[0]);
    const weekEnd = formatDate(weekDates[6]);
    if (todayStr >= weekStart && todayStr <= weekEnd) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(weekStart);
    }
  }, [weekOffset]);

  const dayWorkouts = useMemo(
    () => workouts.filter((w) => w.scheduled_date === selectedDate),
    [workouts, selectedDate]
  );

  const today = formatDate(new Date());

  const weekLabel = `${weekDates[0].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${weekDates[6].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  if (workoutsLoading || !userId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700" }}
        >
          {t("calendar.title")}
        </Text>
      </View>

      <View style={styles.weekNav}>
        <Pressable onPress={() => setWeekOffset((o) => o - 1)}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme.colors.primary}
          />
        </Pressable>
        <Pressable onPress={() => setWeekOffset(0)}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          >
            {weekLabel}
          </Text>
        </Pressable>
        <Pressable onPress={() => setWeekOffset((o) => o + 1)}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.dayRow}>
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const hasWorkout = workouts.some((w) => w.scheduled_date === dateStr);

          return (
            <Pressable
              key={dateStr}
              style={[
                styles.dayCell,
                isSelected && {
                  backgroundColor: theme.colors.primary,
                  borderRadius: 14,
                },
              ]}
              onPress={() => setSelectedDate(dateStr)}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: isSelected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                  fontWeight: isToday ? "800" : "400",
                }}
              >
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </Text>
              <Text
                variant="titleMedium"
                style={{
                  color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {date.getDate()}
              </Text>
              {hasWorkout && (
                <View
                  style={[
                    styles.workoutDot,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.onPrimary
                        : theme.colors.primary,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.dayContent} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {dayWorkouts.length === 0 ? (
          <View style={styles.emptyDay}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={40}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 8,
              }}
            >
              {t("calendar.noWorkouts")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {dayWorkouts.map((item) => (
              <WorkoutCard key={item.id} workout={item} theme={theme} t={t} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkoutCard({
  workout,
  theme,
  t,
}: {
  workout: AssignedWorkout;
  theme: any;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const router = useRouter();
  const statusConfig: Record<string, { icon: string; color: string }> = {
    pending: { icon: "clock-outline", color: theme.custom.warning },
    completed: { icon: "check-circle", color: theme.colors.secondary },
    missed: { icon: "close-circle", color: theme.colors.error },
    partial: { icon: "circle-half-full", color: theme.custom.partial },
  };
  const status = statusConfig[workout.status] ?? statusConfig.pending;
  const exerciseCount = workout.exercises?.length ?? 0;
  const totalSets = workout.exercises?.reduce(
    (sum, ex) => sum + (ex.sets?.length ?? 0),
    0
  ) ?? 0;

  const workoutId = workout.id;

  return (
    <Pressable
      onPress={() => {
        if (workoutId) {
          router.push(`/workout/${workoutId}` as any);
        }
      }}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.workoutCard,
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.workoutHeader}>
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1 }}
        >
          {workout.name}
        </Text>
        <View style={styles.statusBadge}>
          <MaterialCommunityIcons
            name={status.icon as any}
            size={18}
            color={status.color}
          />
          <Text style={[styles.statusText, { color: status.color }]}>
            {t(`status.${workout.status}`)}
          </Text>
        </View>
      </View>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
      >
        {t("calendar.exerciseSets", { exercises: exerciseCount, sets: totalSets })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  weekNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "space-around",
  },
  dayCell: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 44,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyDay: {
    alignItems: "center",
    paddingVertical: 48,
  },
  workoutCard: {
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
