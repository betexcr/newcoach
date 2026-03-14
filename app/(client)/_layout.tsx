import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type TabIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const tabDefs: { name: string; titleKey: string; icon: TabIcon; focusedIcon: TabIcon }[] = [
  { name: "today", titleKey: "tabs.today", icon: "lightning-bolt-outline", focusedIcon: "lightning-bolt" },
  { name: "calendar", titleKey: "tabs.calendar", icon: "calendar-outline", focusedIcon: "calendar" },
  { name: "habits", titleKey: "tabs.habits", icon: "checkbox-marked-circle-outline", focusedIcon: "checkbox-marked-circle" },
  { name: "messages/index", titleKey: "tabs.messages", icon: "message-outline", focusedIcon: "message" },
  { name: "settings", titleKey: "tabs.settings", icon: "cog-outline", focusedIcon: "cog" },
];

export default function ClientLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
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
      <Tabs.Screen
        name="workout/[id]"
        options={{ href: null, headerShown: false, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="progress" options={{ href: null, title: t("tabs.progress") }} />
      <Tabs.Screen name="milestones" options={{ href: null, title: t("tabs.milestones") }} />
      <Tabs.Screen name="nutrition" options={{ href: null, title: t("tabs.nutrition") }} />
      <Tabs.Screen name="messages/chat" options={{ href: null, title: t("tabs.chat") }} />
    </Tabs>
  );
}
