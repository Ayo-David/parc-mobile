import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

export interface FormScreenLayoutProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  errorMessage?: string | null;
  /** In-app (post-login) screens: renders the standard BackHeader with this title. Onboarding forms leave it unset. */
  headerTitle?: string;
  /** Overrides the BackHeader's back action (default: safe router.back). */
  onBack?: () => void;
}

/**
 * Shared shape for the many single-purpose onboarding forms (title +
 * subtitle + fields + a footer action pinned above the keyboard). Reused
 * rather than re-implemented per screen, per SKILL.md.
 */
export function FormScreenLayout({ title, subtitle, children, footer, errorMessage, headerTitle, onBack }: FormScreenLayoutProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingTop: headerTitle ? theme.spacing.lg : theme.semanticSpacing.section,
      flexGrow: 1,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      marginBottom: theme.semanticSpacing.section,
    },
    body: {
      gap: theme.semanticSpacing.component,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginBottom: theme.semanticSpacing.form,
    },
    footer: {
      paddingTop: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.component,
      gap: theme.semanticSpacing.form,
    },
  });

  return (
    <ScreenContainer>
      {headerTitle ? <BackHeader title={headerTitle} onBack={onBack} /> : null}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
