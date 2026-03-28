import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const t = i18n.t.bind(i18n);
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons
            name="alert-octagon-outline"
            size={64}
          />
          <Text
            variant="headlineSmall"
            style={styles.title}
          >
            {t("common.errorBoundaryTitle")}
          </Text>
          <Text
            variant="bodyMedium"
            style={styles.message}
          >
            {t("common.errorBoundaryMessage")}
          </Text>
          <Button
            mode="contained"
            onPress={() => this.setState((s) => ({ hasError: false, retryCount: s.retryCount + 1 }))}
            style={styles.button}
          >
            {t("common.retry")}
          </Button>
        </View>
      );
    }

    return (
      <React.Fragment key={this.state.retryCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontWeight: "700",
    marginTop: 24,
  },
  message: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
  },
});
