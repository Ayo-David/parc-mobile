import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Minimal themed stand-in for tabs not yet built this sprint (Payments,
 * Loans, Savings, Me — PLAN.md Part 6 backlog). Exists so the tab bar has
 * real, navigable screens to demonstrate rather than dead links.
 */
export function PlaceholderScreen({ title }: { title: string }) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming soon.</Text>
      </View>
    </ScreenContainer>
  );
}
