import { Platform, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type TabIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const tabDefs: { name: string; titleKey: string; icon: TabIcon; focusedIcon: TabIcon }[] = [
  { name: "dashboard", titleKey: "tabs.dashboard", icon: "view-dashboard-outline", focusedIcon: "view-dashboard" },
  { name: "clients", titleKey: "tabs.clients", icon: "account-group-outline", focusedIcon: "account-group" },
  { name: "library", titleKey: "tabs.library", icon: "bookshelf", focusedIcon: "bookshelf" },
  { name: "messages", titleKey: "tabs.messages", icon: "message-outline", focusedIcon: "message" },
  { name: "settings", titleKey: "tabs.settings", icon: "cog-outline", focusedIcon: "cog" },
];

export default function DemoCoachLayout() {
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
          <Pressable onPress={() => router.push("/demo")} style={{ marginLeft: 12 }} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
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
