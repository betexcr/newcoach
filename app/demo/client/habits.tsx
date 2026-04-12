import { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";
import { useDemoFadeIn } from "../use-demo-fade";
import { demoHabits, demoHabitLogs } from "../mock-data";

export default function DemoHabits() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const { introOpacity, introTranslateY, contentOpacity } = useDemoFadeIn("client-habits");

  const initialState = Object.fromEntries(
    demoHabits.map((h) => [h.id, demoHabitLogs.find((l) => l.habit_id === h.id)?.completed ?? false])
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(initialState);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={s.content}>
      <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTranslateY }] }}>
        <Card style={[s.introCard, { backgroundColor: `${theme.colors.secondary}10` }]} mode="contained">
          <Card.Content style={s.introContent}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.secondary} />
            <Text variant="bodySmall" style={{ color: theme.colors.secondary, flex: 1, marginLeft: 10, lineHeight: 18 }}>
              {t("demo.introHabits")}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity }}>
      {demoHabits.map((habit) => {
        const completed = checked[habit.id];
        return (
          <Card key={habit.id} style={[s.habitCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() => toggle(habit.id)}
                style={[s.habitCheck, { borderColor: completed ? theme.colors.secondary : theme.colors.outline, backgroundColor: completed ? theme.colors.secondary : "transparent" }]}
              >
                {completed && <MaterialCommunityIcons name="check" size={16} color={theme.colors.onSecondary} />}
              </Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{habit.name}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {habit.frequency}{habit.description ? ` \u00B7 ${habit.description}` : ""}
                </Text>
              </View>
            </Card.Content>
          </Card>
        );
      })}
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  introCard: { borderRadius: 12, marginBottom: 16, elevation: 0 },
  introContent: { flexDirection: "row", alignItems: "center" },
  habitCard: { borderRadius: 16, elevation: 0, marginBottom: 8 },
  habitCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: "center", alignItems: "center" },
});
