import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PlaceholderScreenProps {
  icon: string;
  title: string;
  subtitle: string;
}

export function PlaceholderScreen({ icon, title, subtitle }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={48}
          color={theme.colors.primary}
        />
      </View>
      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        {title}
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
});
