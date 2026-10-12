import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { useTheme } from "@/theme";

export interface EmptyStateProps {
  /** Figma uses a plain emoji glyph per context (💸 transactions, etc.) rather than an icon-set glyph — kept as-is rather than substituting an Ionicons approximation. */
  emoji: string;
  title: string;
  body: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

/**
 * Figma "EmptyState" (node 20:3145, Feedback Components section) — same
 * "designed once, never composed" gap as ErrorState/LoadingSpinner
 * (missing-mobile.md §0). Every list screen in the app (transactions,
 * loans, savings, notifications, referrals) renders only its
 * pre-populated Figma sample data today; this is the first real consumer.
 */
export function EmptyState({ emoji, title, body, ctaLabel, onPressCta }: EmptyStateProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: theme.semanticSpacing.section,
      paddingBottom: theme.semanticSpacing.section,
      paddingHorizontal: theme.semanticSpacing.section,
    },
    emoji: {
      fontSize: theme.typography.display.fontSize,
      lineHeight: theme.typography.display.fontSize * 1.5,
      marginBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h4,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.spacing.xs,
    },
    body: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.section,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onPressCta ? <Button label={ctaLabel} onPress={onPressCta} /> : null}
    </View>
  );
}
