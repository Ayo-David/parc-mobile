import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

export interface SuccessCardRow {
  emoji: string;
  label: string;
}

export interface OnboardingSuccessLayoutProps {
  tone: "dark" | "success";
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: ReactNode;
  note: string;
  cardTitle: string;
  rows: SuccessCardRow[];
  /** Trailing chevron on each row ("NEXT UP" list, FaceVerified 226:2767). */
  showRowChevrons?: boolean;
  footer: ReactNode;
}

/**
 * Centered confirmation frame shared by PasscodeSuccess (226:2324) and
 * FaceVerified (226:2741): ringed hero badge, extra-bold headline, two
 * lines of copy, a grey summary card, then actions.
 */
export function OnboardingSuccessLayout({ tone, icon, title, subtitle, note, cardTitle, rows, showRowChevrons = false, footer }: OnboardingSuccessLayoutProps) {
  const { theme } = useTheme();
  const hero = theme.components.successHero[tone];
  const innerRingOffset = theme.spacing.sm;
  const outerRingOffset = theme.spacing.lg + 2;

  const styles = StyleSheet.create({
    // Figma frame gutter is 28px here (226:2324 px-28), wider than the 24px auth default.
    container: {
      paddingHorizontal: theme.spacing.xxl + theme.spacing.xs,
    },
    content: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    heroWrap: {
      width: hero.size,
      height: hero.size,
      marginBottom: theme.spacing.xxl + theme.spacing.xs,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: {
      width: hero.size,
      height: hero.size,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    innerRing: {
      position: "absolute",
      top: -innerRingOffset,
      left: -innerRingOffset,
      width: hero.size + innerRingOffset * 2,
      height: hero.size + innerRingOffset * 2,
      borderRadius: theme.radii.full,
      borderWidth: theme.borderWidth.otpBox,
      borderColor: hero.innerRing,
    },
    outerRing: {
      position: "absolute",
      top: -outerRingOffset,
      left: -outerRingOffset,
      width: hero.size + outerRingOffset * 2,
      height: hero.size + outerRingOffset * 2,
      borderRadius: theme.radii.full,
      borderWidth: theme.borderWidth.thin,
      borderColor: hero.outerRing,
    },
    title: {
      ...theme.typography.text28ExtraBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.spacing.sm + 2,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textTertiary,
      textAlign: "center",
      marginBottom: theme.spacing.xs + 2,
    },
    note: {
      ...theme.typography.text13Regular,
      color: theme.colors.textDisabled,
      textAlign: "center",
      marginBottom: theme.spacing.xxl + theme.spacing.xs,
    },
    card: {
      alignSelf: "stretch",
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.lg,
      paddingHorizontal: theme.spacing.lg + 2,
      paddingVertical: theme.spacing.lg,
    },
    cardTitle: {
      ...theme.typography.text11BoldWide,
      color: theme.colors.textMuted,
      textTransform: "uppercase",
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xs + 3,
    },
    rowDivider: {
      borderBottomWidth: theme.borderWidth.hairline,
      borderBottomColor: theme.colors.border,
    },
    rowEmoji: {
      ...theme.typography.emojiMedium,
    },
    rowLabel: {
      ...theme.typography.text14Medium,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    footer: {
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
      paddingBottom: theme.semanticSpacing.component,
      gap: theme.semanticSpacing.authActions,
    },
  });

  return (
    <ScreenContainer variant="auth" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroWrap}>
          <View style={styles.outerRing} />
          <View style={styles.innerRing} />
          <LinearGradient colors={hero.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Ionicons name={icon} size={hero.iconSize} color={hero.iconColor} />
          </LinearGradient>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.note}>{note}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{cardTitle}</Text>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index < rows.length - 1 && styles.rowDivider]}>
              <Text style={styles.rowEmoji} importantForAccessibility="no" accessibilityElementsHidden>
                {row.emoji}
              </Text>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {showRowChevrons ? <Ionicons name="chevron-forward" size={theme.icon.inline} color={theme.colors.textDisabled} /> : null}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.footer}>{footer}</View>
    </ScreenContainer>
  );
}
