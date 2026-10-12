import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

export type StatusScreenTone = "primary" | "warning" | "error" | "neutral";

export interface StatusScreenLayoutProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  tone?: StatusScreenTone;
  title: string;
  body: string;
  /** Optional card/list content rendered between the body copy and the footer (e.g. an info card, a tips list). */
  children?: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
}

/**
 * The icon-badge + heading + body-copy + optional card + footer pattern
 * shared by most of the gap-closure screens (PLAN.md Part 11) — Liveness
 * Consent/Manual-Review/Failed/Permission-Denied (Figma nodes 425:32,
 * 426:156, 426:217, 426:266) are the first consumers, and later phases
 * (Loan Declined, System gates, etc.) reuse it rather than each screen
 * reinventing this layout, per SKILL.md.
 */
export function StatusScreenLayout({ icon, tone = "neutral", title, body, children, footer, onBack, showBackButton = true }: StatusScreenLayoutProps) {
  const { theme } = useTheme();

  const toneStyles: Record<StatusScreenTone, { backgroundColor: string; iconColor: string }> = {
    primary: { backgroundColor: theme.colors.primary, iconColor: theme.colors.textInverse },
    warning: { backgroundColor: theme.components.status.warning.backgroundColor, iconColor: theme.colors.warning },
    error: { backgroundColor: theme.components.status.error.backgroundColor, iconColor: theme.colors.error },
    neutral: { backgroundColor: theme.colors.primarySubtle, iconColor: theme.colors.textPrimary },
  };

  const styles = StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingTop: theme.semanticSpacing.component,
    },
    badge: {
      width: theme.control.iconButtonXl,
      height: theme.control.iconButtonXl,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: toneStyles[tone].backgroundColor,
      marginBottom: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    body: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      marginBottom: theme.semanticSpacing.section,
    },
    footer: {
      paddingTop: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.component,
      gap: theme.semanticSpacing.form,
    },
  });

  return (
    <ScreenContainer>
      {showBackButton ? <BackButton onPress={onBack} /> : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Ionicons name={icon} size={theme.icon.large} color={toneStyles[tone].iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {children}
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </ScreenContainer>
  );
}
