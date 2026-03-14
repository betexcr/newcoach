import { StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";
import type { ButtonProps } from "react-native-paper";

interface AuthButtonProps extends Omit<ButtonProps, "theme"> {
  variant?: "primary" | "secondary" | "text";
}

export function AuthButton({
  variant = "primary",
  style,
  labelStyle,
  ...props
}: AuthButtonProps) {
  const theme = useTheme();

  const mode =
    variant === "primary"
      ? "contained"
      : variant === "secondary"
        ? "outlined"
        : "text";

  return (
    <Button
      mode={mode}
      style={[
        styles.button,
        variant === "primary" && {
          backgroundColor: theme.colors.primary,
        },
        style,
      ]}
      labelStyle={[styles.label, labelStyle]}
      contentStyle={styles.content}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    marginVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  content: {
    paddingVertical: 6,
  },
});
