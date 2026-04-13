import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Animated, Image } from "react-native";
import { Text, useTheme, Card, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";
import type { Exercise } from "@/types/database";
import { useDemoFadeIn } from "../use-demo-fade";
import { DemoPress } from "../DemoTooltip";
import { getDemoExercises, demoTemplates, demoProgram, demoProgramWorkouts, demoExerciseVideos, exerciseI18nKeys, workoutNameKeys } from "../mock-data";

const MUSCLE_GROUPS = [
  { key: "all", labelKey: "demo.all" },
  { key: "chest", labelKey: "muscleGroups.chest" },
  { key: "back", labelKey: "muscleGroups.back" },
  { key: "legs", labelKey: "muscleGroups.legs" },
  { key: "shoulders", labelKey: "muscleGroups.shoulders" },
  { key: "arms", labelKey: "muscleGroups.arms" },
  { key: "core", labelKey: "muscleGroups.core" },
] as const;

function translateMuscle(mg: string | null, t: (k: string) => string): string {
  if (!mg) return "";
  const key = `muscleGroups.${mg.toLowerCase()}` as const;
  const v = t(key);
  return v !== key ? v : mg;
}

function translateEquipment(eq: string | null | undefined, t: (k: string) => string): string {
  if (!eq) return "";
  const key = `equipment.${eq.toLowerCase()}` as const;
  const v = t(key);
  return v !== key ? v : eq;
}

function ExerciseCard({ exercise, hasVideo, theme, t }: { exercise: Exercise; hasVideo: boolean; theme: AppTheme; t: (k: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const i18nKey = exerciseI18nKeys[exercise.id];
  const displayName = i18nKey ? t(`${i18nKey}.name`) : exercise.name;
  const displayDesc = i18nKey ? t(`${i18nKey}.description`) : exercise.description;
  const displayMuscle = translateMuscle(exercise.muscle_group, t);
  const displayEquipment = translateEquipment(exercise.equipment, t);

  return (
    <Card
      style={[s.exerciseCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.exerciseRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{displayName}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {displayMuscle}{displayEquipment ? ` \u00B7 ${displayEquipment}` : ""}
          </Text>
        </View>
        {hasVideo && (
          <View style={[s.videoBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <MaterialCommunityIcons name="play-circle" size={18} color={theme.colors.primary} />
          </View>
        )}
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.onSurfaceVariant} />
      </View>

      {expanded && (
        <View style={[s.expandedContent, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <Chip mode="flat" compact style={{ backgroundColor: theme.colors.primaryContainer }} textStyle={{ fontSize: 11 }}>{displayMuscle}</Chip>
            {displayEquipment ? (
              <Chip mode="flat" compact style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 11 }}>{displayEquipment}</Chip>
            ) : null}
          </View>
          {displayDesc ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
              {displayDesc}
            </Text>
          ) : null}
          {hasVideo && (
            <View style={[s.videoPreview, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Image
                source={require("@/assets/demo-exercise.gif")}
                style={s.videoPreviewImage}
                resizeMode="cover"
              />
              <View style={s.videoOverlay}>
                <View style={[s.videoPlayBtn, { backgroundColor: `${theme.colors.primary}DD` }]}>
                  <MaterialCommunityIcons name="play" size={28} color="#fff" />
                </View>
                <Text variant="labelMedium" style={{ color: "#fff", marginTop: 6 }}>{t("demo.watchDemo")}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

export default function DemoLibrary() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const router = useRouter();
  const { introOpacity, introTranslateY, contentOpacity, dismissIntro, introCollapsed } = useDemoFadeIn("coach-library");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const demoExercises = useMemo(() => getDemoExercises(t), [t]);

  const filteredExercises = selectedGroup === "all"
    ? demoExercises
    : demoExercises.filter((ex) => ex.muscle_group.toLowerCase() === selectedGroup);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      {!introCollapsed && (
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
          <Card style={[s.introCard, { backgroundColor: `${theme.colors.primary}10` }]} mode="contained" onPress={dismissIntro}>
            <Card.Content style={s.introContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.primary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
                {t("demo.introLibrary")}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: contentOpacity }}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
        {t("demo.exerciseLibrary")}
      </Text>

      <View style={s.chipRow}>
        {MUSCLE_GROUPS.map((group) => {
          const active = group.key === selectedGroup;
          return (
            <Chip
              key={group.key}
              mode={active ? "flat" : "outlined"}
              selected={active}
              onPress={() => setSelectedGroup(group.key)}
              style={[s.chip, active && { backgroundColor: theme.colors.primary }]}
              textStyle={[{ textTransform: "capitalize", fontSize: 13 }, active && { color: theme.colors.onPrimary }]}
            >
              {t(group.labelKey)}
            </Chip>
          );
        })}
      </View>

      {filteredExercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          hasVideo={!!demoExerciseVideos[ex.id]}
          theme={theme}
          t={t}
        />
      ))}

      <DemoPress style={[s.videoLibraryCard, { backgroundColor: `${theme.colors.primary}08` }]}>
        <View style={s.videoLibraryContent}>
          <View style={[s.videoLibraryIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
            <MaterialCommunityIcons name="play-box-multiple" size={28} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("demo.exerciseVideos")}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {t("demo.videosAvailable", { count: Object.values(demoExerciseVideos).filter(Boolean).length })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
        </View>
      </DemoPress>

      <View style={{ height: 24 }} />
      <Pressable onPress={() => router.push({ pathname: "/demo/new-workout" } as any)} accessibilityRole="button">
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
          {t("demo.workoutBuilder")}
        </Text>

        <Card style={[s.builderCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{t("demo.workoutName")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{t(workoutNameKeys["Upper Body Strength"] ?? "Upper Body Strength")}</Text>
            </View>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4, marginTop: 12 }}>{t("demo.description")}</Text>
            <View style={[s.fakeInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Compound upper body focus</Text>
            </View>
          </Card.Content>
        </Card>
      </Pressable>

      {demoTemplates[0].exercises.slice(0, 3).map((ex) => {
        const exI18n = exerciseI18nKeys[ex.exercise_id];
        const exName = exI18n ? t(`${exI18n}.name`) : ex.exercise_name;
        return (
        <Card key={ex.exercise_id + ex.order} style={[s.exerciseBlock, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{exName}</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{ex.sets.length} sets</Text>
            </View>
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
        );
      })}

      <Pressable style={[s.addExerciseBtn, { borderColor: theme.colors.outline }]} onPress={() => router.push({ pathname: "/demo/new-workout" } as any)} accessibilityRole="button">
        <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
        <Text variant="labelLarge" style={{ color: theme.colors.primary, marginLeft: 6 }}>{t("demo.addExercise")}</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push({ pathname: "/demo/coach-documents" } as any)}
        style={[s.docsBanner, { backgroundColor: `${theme.colors.primary}08` }]}
        accessibilityRole="button"
      >
        <View style={s.docsBannerContent}>
          <View style={[s.docsBannerIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
            <MaterialCommunityIcons name="file-document-multiple" size={28} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t("demo.documentsSection")}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {t("demo.introDocuments")}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
        </View>
      </Pressable>

      <View style={{ height: 24 }} />
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 12 }}>
        {t("demo.programs")}
      </Text>

      <Pressable onPress={() => router.push({ pathname: "/demo/new-program" } as any)} accessibilityRole="button">
        <Card style={[s.programCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>{t(workoutNameKeys[demoProgram.name] ?? demoProgram.name)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>{t("demo.workoutNames.strengthFoundationsDesc")}</Text>
            <Chip mode="flat" style={{ backgroundColor: theme.colors.primaryContainer, alignSelf: "flex-start", marginTop: 8 }} textStyle={{ fontSize: 11 }}>
              {demoProgram.duration_weeks} {t("demo.weeks")}
            </Chip>
          </Card.Content>
        </Card>
      </Pressable>

      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, marginBottom: 8 }}>{t("demo.week1")}</Text>
      {demoProgramWorkouts.map((pw) => (
        <View key={pw.id} style={[s.workoutRow, { backgroundColor: theme.colors.surface }]}>
          <View style={[s.dayBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "700" }}>D{pw.day_number}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{t(workoutNameKeys[pw.name] ?? pw.name)}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{pw.exercises.length} {t("demo.exercises")}</Text>
          </View>
        </View>
      ))}
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { borderRadius: 20 },
  exerciseCard: { borderRadius: 16, elevation: 0, marginBottom: 6, overflow: "hidden" },
  exerciseRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  expandedContent: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 0.5, paddingTop: 12 },
  builderCard: { borderRadius: 16, elevation: 0, marginBottom: 12 },
  fakeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  exerciseBlock: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  setHeader: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 8, marginTop: 12 },
  setRow: { flexDirection: "row", paddingVertical: 6 },
  setCol: { flex: 1, textAlign: "center" },
  addExerciseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, marginTop: 4 },
  programCard: { borderRadius: 16, elevation: 0 },
  dayBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  workoutRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 6 },
  videoBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 6 },
  videoPreview: { height: 140, borderRadius: 12, overflow: "hidden", marginTop: 12, position: "relative" },
  videoPreviewImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" },
  videoPlayBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  videoLibraryCard: { borderRadius: 16, elevation: 0, marginTop: 12 },
  videoLibraryContent: { flexDirection: "row", alignItems: "center" },
  videoLibraryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  docsBanner: { borderRadius: 16, elevation: 0, marginTop: 16, padding: 16 },
  docsBannerContent: { flexDirection: "row", alignItems: "center" },
  docsBannerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
});
