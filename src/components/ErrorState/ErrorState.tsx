import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { useTheme } from "@/theme";

export interface ErrorStateProps {
  title?: string;
  body?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: ComponentProps<typeof Ionicons>["name"];
  /** "network" renders the neutral offline treatment (Figma "System 02 — No Internet Connection", node 428:610); "error" (default) is the red error badge (Figma "System 03 — Something Went Wrong"/generic "ErrorState", nodes 428:654/20:3224). */
  tone?: "error" | "network";
}

/**
 * Figma "ErrorState" (node 20:3224, Feedback Components section) —
 * designed once but, per missing-mobile.md §0, never actually composed
 * into a real screen anywhere in the app before this phase (PLAN.md Part
 * 11, MOB-15). The 80px error-tint badge and 1.5px-bordered "Try Again"
 * button map exactly onto existing tokens (`components.status.error`,
 * button `variant="tertiary"`) — no new tokens needed. `tone="network"`
 * reuses this same compact layout for the "No internet connection" case
 * (a full dedicated screen variant of that also exists — see
 * `StatusScreenLayout` — but list/section-level failures compose this
 * smaller inline card instead of taking over the whole screen).
 */
export function ErrorState({ title, body, retryLabel = "Try Again", onRetry, icon, tone = "error" }: ErrorStateProps) {
  const { theme } = useTheme();

  const resolvedTitle = title ?? (tone === "network" ? "No internet connection" : "Something went wrong");
  const resolvedBody = body ?? (tone === "network" ? "Check your Wi-Fi or mobile data and try again." : "We couldn't complete that action. Please try again.");
  const resolvedIcon = icon ?? (tone === "network" ? "cloud-offline-outline" : "alert-circle");
  const badgeBackground = tone === "network" ? theme.colors.primarySubtle : theme.components.status.error.backgroundColor;
  const iconColor = tone === "network" ? theme.colors.textSecondary : theme.colors.error;

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: theme.semanticSpacing.section,
      paddingBottom: theme.semanticSpacing.section,
      paddingHorizontal: theme.semanticSpacing.section,
    },
    badge: {
      width: theme.control.iconButtonXl + theme.spacing.lg,
      height: theme.control.iconButtonXl + theme.spacing.lg,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: badgeBackground,
      marginBottom: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h4,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
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
      <View style={styles.badge}>
        <Ionicons name={resolvedIcon} size={theme.icon.large} color={iconColor} />
      </View>
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.body}>{resolvedBody}</Text>
      {onRetry ? <Button label={tone === "network" ? "Retry" : retryLabel} variant="tertiary" onPress={onRetry} /> : null}
    </View>
  );
}
