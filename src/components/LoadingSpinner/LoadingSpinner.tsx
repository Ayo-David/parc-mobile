import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

export interface LoadingSpinnerProps {
  size?: "small" | "large";
}

/**
 * Figma "LoadingSpinner" (node 20:3166, Feedback Components section) — a
 * plain rotating-arc indicator. React Native's built-in `ActivityIndicator`
 * already renders the same shape natively per platform (and is what
 * `Button`'s own loading state already uses), so this wraps it rather than
 * hand-building a custom animated arc, giving the rest of the app one
 * named component to compose for a full-screen/section loading state
 * (missing-mobile.md §0's "designed once, never composed" gap).
 */
export function LoadingSpinner({ size = "large" }: LoadingSpinnerProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.semanticSpacing.section,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
}
