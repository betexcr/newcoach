import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useTheme, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "@/lib/use-require-auth";

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
  const authLoading = useRequireAuth();

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
      <Tabs.Screen name="progress" options={{ href: null, title: t("tabs.progress") }} />
      <Tabs.Screen name="milestones" options={{ href: null, title: t("tabs.milestones") }} />
      <Tabs.Screen name="nutrition" options={{ href: null, title: t("tabs.nutrition") }} />
      <Tabs.Screen name="messages/chat" options={{ href: null, title: t("tabs.chat") }} />
      <Tabs.Screen name="body-metrics" options={{ href: null, title: t("bodyMetrics.title") }} />
      <Tabs.Screen name="progress-photos" options={{ href: null, title: t("progressPhotos.title") }} />
      <Tabs.Screen name="invites" options={{ href: null, title: t("invites.title") }} />
      <Tabs.Screen name="documents" options={{ href: null, title: t("library.documents") }} />
    </Tabs>
  );
}
