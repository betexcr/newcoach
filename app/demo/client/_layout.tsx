import { Platform, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type TabIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const tabDefs: { name: string; titleKey: string; icon: TabIcon; focusedIcon: TabIcon }[] = [
  { name: "today", titleKey: "tabs.today", icon: "lightning-bolt-outline", focusedIcon: "lightning-bolt" },
  { name: "calendar", titleKey: "tabs.calendar", icon: "calendar-outline", focusedIcon: "calendar" },
  { name: "habits", titleKey: "tabs.habits", icon: "checkbox-marked-circle-outline", focusedIcon: "checkbox-marked-circle" },
  { name: "messages", titleKey: "tabs.messages", icon: "message-outline", focusedIcon: "message" },
  { name: "settings", titleKey: "tabs.settings", icon: "cog-outline", focusedIcon: "cog" },
];

export default function DemoClientLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable onPress={() => router.navigate({ pathname: "/demo" } as any)} style={{ marginLeft: 12 }} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.secondary} />
          </Pressable>
        ),
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 28 : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {tabDefs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name={focused ? tab.focusedIcon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
