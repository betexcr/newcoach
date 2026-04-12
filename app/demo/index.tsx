import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { AppTheme } from "@/lib/theme";

export default function DemoIndex() {
  const theme = useTheme<AppTheme>();
  const router = useRouter();

  const options = [
    {
      label: "Coach View",
      description: "Dashboard, clients, workout builder, programs, exercise library, and messaging",
      icon: "clipboard-pulse" as const,
      color: theme.colors.primary,
      route: "/demo/coach" as const,
    },
    {
      label: "Client View",
      description: "Today's workout, calendar, progress, milestones, habits, nutrition, and messaging",
      icon: "account-heart" as const,
      color: theme.colors.secondary,
      route: "/demo/client" as const,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="displaySmall"
          style={{ color: theme.colors.primary, fontWeight: "800" }}
        >
          TrueCoach
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: "center" }}
        >
          Explore the app — pick a role to see all features in action
        </Text>
      </View>

      <View style={styles.cards}>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push(opt.route as any)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: `${opt.color}15` }]}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={36}
                color={opt.color}
              />
            </View>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 16 }}
            >
              {opt.label}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 6, lineHeight: 20 }}
            >
              {opt.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.loginLink}
        onPress={() => router.replace("/(auth)/login")}
        accessibilityRole="link"
      >
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Have an account?{" "}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.primary, fontWeight: "600" }}
        >
          Sign in
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  cards: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
});
