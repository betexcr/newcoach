import { View, StyleSheet } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color={theme.colors.error}
      />
      <Text
        variant="bodyLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: "center" }}
      >
        {message ?? t("common.errorGeneric")}
      </Text>
      {onRetry && (
        <Button mode="outlined" onPress={onRetry} style={styles.retryButton}>
          {t("common.retry")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});
