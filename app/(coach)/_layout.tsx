import { View } from "react-native";
import { Tabs } from "expo-router";
import { useTheme, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRequireAuth } from "@/lib/use-require-auth";

type TabIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const tabDefs: { name: string; titleKey: string; icon: TabIcon; focusedIcon: TabIcon }[] = [
  { name: "dashboard", titleKey: "tabs.dashboard", icon: "view-dashboard-outline", focusedIcon: "view-dashboard" },
  { name: "clients/index", titleKey: "tabs.clients", icon: "account-group-outline", focusedIcon: "account-group" },
  { name: "library/index", titleKey: "tabs.library", icon: "bookshelf", focusedIcon: "bookshelf" },
  { name: "messages/index", titleKey: "tabs.messages", icon: "message-outline", focusedIcon: "message" },
  { name: "settings", titleKey: "tabs.settings", icon: "cog-outline", focusedIcon: "cog" },
];

const hiddenScreens = [
  "clients/add-client",
  "clients/assign-workout",
  "clients/assign-program",
  "clients/workout-detail",
  "clients/client-profile",
  "clients/create-habit",
  "library/workout-builder",
  "library/pick-exercise",
  "library/create-exercise",
  "library/create-program",
  "library/programs",
  "library/program-detail",
  "library/documents",
  "messages/chat",
  "messages/broadcast",
  "messages/new-chat",
];

export default function CoachLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const authLoading = useRequireAuth();
  const bottomInset = Math.max(insets.bottom, 16);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
          height: 62 + bottomInset,
          paddingBottom: bottomInset,
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
      {hiddenScreens.map((screen) => (
        <Tabs.Screen
          key={screen}
          name={screen}
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />
      ))}
    </Tabs>
  );
}
