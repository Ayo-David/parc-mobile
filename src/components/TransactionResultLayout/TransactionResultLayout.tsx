import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { Money } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { MoneyText } from "@/components/MoneyText/MoneyText";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

export type TransactionResultTone = "success" | "warning" | "error";

export interface TransactionResultAction {
  label: string;
  onPress: () => void;
}

export interface TransactionResultLayoutProps {
  tone: TransactionResultTone;
  title: string;
  money?: Money;
  /** e.g. ["To CHIOMA OBI", "0123456789 · GTBank — declined by GTBank"] */
  detailLines?: string[];
  primaryAction?: TransactionResultAction;
  secondaryAction?: TransactionResultAction;
  /** Shows a spinner instead of the tone icon badge for a non-terminal (still-processing) state. */
  isProcessing?: boolean;
  /** Figma's Transfer/Loan result screens put two actions side by side; the Bill receipt screens (node 439:131/439:186) stack "Share receipt" above "Done" full-width instead. */
  stackActions?: boolean;
  children?: ReactNode;
}

const TONE_ICON: Record<TransactionResultTone, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark",
  warning: "time-outline",
  error: "close",
};

/**
 * The money-result card shared by every terminal transfer/bill/loan/savings
 * screen — Figma's "SuccessState" (node 20:3202) generalized to also cover
 * failed/pending outcomes (Figma "Transfer 01 — Failed" / "Transfer 02 —
 * Pending", nodes 428:62/428:157, missing-mobile.md §0/§4). Before this
 * phase, `transfers/success.tsx` and `bills/[category]/success.tsx` each
 * rendered only plain centered title/subtitle text for every status —
 * this is the first time the real designed result card (tone icon badge,
 * big mono amount, recipient/detail lines, two-button footer) is used.
 */
export function TransactionResultLayout({ tone, title, money, detailLines, primaryAction, secondaryAction, isProcessing = false, stackActions = false, children }: TransactionResultLayoutProps) {
  const { theme } = useTheme();

  const toneStyles: Record<TransactionResultTone, { backgroundColor: string; iconColor: string }> = {
    success: { backgroundColor: theme.components.status.success.backgroundColor, iconColor: theme.colors.success },
    warning: { backgroundColor: theme.components.status.warning.backgroundColor, iconColor: theme.colors.warning },
    error: { backgroundColor: theme.components.status.error.backgroundColor, iconColor: theme.colors.error },
  };

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.semanticSpacing.section,
      paddingBottom: theme.semanticSpacing.section,
    },
    badge: {
      width: theme.control.iconButtonXl + theme.spacing.lg,
      height: theme.control.iconButtonXl + theme.spacing.lg,
      borderRadius: theme.radii.sheet,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: toneStyles[tone].backgroundColor,
      marginBottom: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    money: {
      marginBottom: theme.spacing.sm,
    },
    detailLine: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    details: {
      marginBottom: theme.semanticSpacing.section,
    },
    footer: {
      flexDirection: stackActions ? "column" : "row",
      gap: theme.spacing.md,
      width: "100%",
      marginTop: theme.semanticSpacing.component,
    },
    footerButton: {
      flex: stackActions ? undefined : 1,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {isProcessing ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: theme.semanticSpacing.component }} /> : (
          <View style={styles.badge}>
            <Ionicons name={TONE_ICON[tone]} size={theme.icon.large} color={toneStyles[tone].iconColor} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {money ? (
          <View style={styles.money}>
            <MoneyText money={money} />
          </View>
        ) : null}
        {detailLines && detailLines.length > 0 ? (
          <View style={styles.details}>
            {detailLines.map((line) => (
              <Text style={styles.detailLine} key={line}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
        {children}
        {primaryAction || secondaryAction ? (
          <View style={styles.footer}>
            {secondaryAction ? (
              <View style={styles.footerButton}>
                <Button label={secondaryAction.label} variant="tertiary" onPress={secondaryAction.onPress} />
              </View>
            ) : null}
            {primaryAction ? (
              <View style={styles.footerButton}>
                <Button label={primaryAction.label} onPress={primaryAction.onPress} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
