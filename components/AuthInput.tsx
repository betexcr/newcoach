import { StyleSheet, View } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import type { TextInputProps } from "react-native-paper";

interface AuthInputProps extends Omit<TextInputProps, "theme" | "error"> {
  error?: string;
}

function AuthInputBase({ error, style, ...props }: AuthInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        style={[styles.input, { backgroundColor: theme.colors.surface }, style]}
        outlineStyle={styles.outline}
        {...props}
      />
      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

export const AuthInput = Object.assign(AuthInputBase, {
  Icon: TextInput.Icon,
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
  },
  outline: {
    borderRadius: 12,
  },
});
