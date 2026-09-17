import { Component, type ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { reportError } from "@/observability/reportError";
import { defaultTheme } from "@/theme";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Root-level safety net for unexpected render errors (React Error
 * Boundaries must be class components — there is no hook equivalent).
 * Deliberately uses defaultTheme's tokens directly rather than useTheme():
 * if this boundary is rendering its fallback, something upstream —
 * possibly ThemeProvider itself — already failed, so it must not depend on
 * context that might be the thing that broke.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }): void {
    reportError(error, { componentStack: info.componentStack });
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const theme = defaultTheme;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles(theme).content}>
          <Text style={styles(theme).title}>Something went wrong</Text>
          <Text style={styles(theme).message}>Parc ran into an unexpected problem. Restarting usually fixes this.</Text>
          <Text style={styles(theme).retry} onPress={this.handleReset}>
            Try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }
}

function styles(theme: typeof defaultTheme) {
  return StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.semanticSpacing.screenX,
      gap: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    message: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    retry: {
      ...theme.typography.button,
      color: theme.colors.primary,
      marginTop: theme.semanticSpacing.component,
    },
  });
}
