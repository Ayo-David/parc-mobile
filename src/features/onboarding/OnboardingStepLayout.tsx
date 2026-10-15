import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { KeyboardAvoidingView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton/BackButton";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView/KeyboardAwareScrollView";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StepDots } from "@/components/StepDots/StepDots";
import { useTheme } from "@/theme";

/** Dots shown in the sign-up header — Figma "StepDots" has 7 (phone → PEP). */
export const SIGNUP_STEP_COUNT = 7;

export interface OnboardingHeaderProps {
  /** 0-indexed active step; omit for screens without dots (e.g. SourceOfIncome 226:2096). */
  step?: number;
  /** Replaces the dots, e.g. "Final step" on CreatePasscode (226:2168). */
  rightLabel?: string;
  onBack?: () => void;
}

/** Back chip + step indicator row shared by every light onboarding frame (226:1735 and siblings). */
export function OnboardingHeader({ step, rightLabel, onBack }: OnboardingHeaderProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.spacing.md,
    },
    rightLabel: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.textMuted,
    },
  });

  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : step !== undefined ? <StepDots total={SIGNUP_STEP_COUNT} current={step} /> : null}
    </View>
  );
}

export interface OnboardingStepLayoutProps extends OnboardingHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** 52px rounded tile above the heading (NIN 226:1847, PEP 226:2045, Income 226:2102). */
  icon?: ComponentProps<typeof Ionicons>["name"];
  errorMessage?: string | null;
  children?: ReactNode;
  footer?: ReactNode;
  /**
   * "pinned" keeps the actions at the screen base (most frames); "inline"
   * flows them after the form, as on the long Address frame (226:2010).
   */
  footerPlacement?: "pinned" | "inline";
}

/**
 * Light sign-up/onboarding form frame: header, optional icon tile, 28px
 * heading, muted subtitle, fields, and AuthBtn actions. Spacing follows
 * the Figma frames (226:1717 etc.): 28px above the heading and above the
 * fields, 10px between heading and subtitle.
 */
export function OnboardingStepLayout({
  step,
  rightLabel,
  onBack,
  title,
  subtitle,
  icon,
  errorMessage,
  children,
  footer,
  footerPlacement = "pinned",
}: OnboardingStepLayoutProps) {
  const { theme } = useTheme();
  const sectionGap = theme.spacing.xxl + theme.spacing.xs;

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingTop: sectionGap,
      paddingBottom: footerPlacement === "inline" ? theme.semanticSpacing.component : 0,
    },
    iconTile: {
      width: theme.control.iconTile,
      height: theme.control.iconTile,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.primarySubtle,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg + 2,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm + 2,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
    },
    body: {
      marginTop: sectionGap,
    },
    inlineFooter: {
      marginTop: sectionGap,
      gap: theme.semanticSpacing.authActions,
    },
    pinnedFooter: {
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.semanticSpacing.component,
      gap: theme.semanticSpacing.authActions,
    },
  });

  return (
    <ScreenContainer variant="auth">
      <OnboardingHeader step={step} rightLabel={rightLabel} onBack={onBack} />
      {/* "padding" on Android too: with edge-to-edge the window no longer resizes for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {icon ? (
            <View style={styles.iconTile}>
              <Ionicons name={icon} size={theme.icon.default} color={theme.colors.textPrimary} />
            </View>
          ) : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {errorMessage ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {errorMessage}
            </Text>
          ) : null}
          {children ? <View style={styles.body}>{children}</View> : null}
          {footer && footerPlacement === "inline" ? <View style={styles.inlineFooter}>{footer}</View> : null}
        </KeyboardAwareScrollView>
        {footer && footerPlacement === "pinned" ? <View style={styles.pinnedFooter}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
