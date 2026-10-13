import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Money } from "@/api/schemas";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney } from "@/utils/money";

const parcLogo = require("../../../assets/images/parc-logo.png");

export interface WalletBalanceCardProps {
  balance: Money;
  accountNumber: string;
  bankName: string;
  accountName: string;
  isBalanceVisible: boolean;
  onToggleVisibility: () => void;
}

/**
 * Figma HomeScreen (226:2865) "Container" 226:3106 — the dark gradient
 * wallet card with masked-balance toggle (226:3306 is the masked state)
 * and copy-to-clipboard account details. Ionicons are the documented
 * placeholder iconset (design-system.md §8) until real Figma icon assets
 * are exported.
 */
export function WalletBalanceCard({ balance, accountNumber, bankName, accountName, isBalanceVisible, onToggleVisibility }: WalletBalanceCardProps) {
  const { theme } = useTheme();
  const [justCopied, setJustCopied] = useState(false);
  const recipe = theme.components.walletCard;

  async function handleCopy() {
    await Clipboard.setStringAsync(accountNumber);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }

  const styles = StyleSheet.create({
    card: {
      borderRadius: recipe.radius,
      padding: theme.semanticSpacing.card,
      overflow: "hidden",
      ...recipe.shadow,
    },
    decorCircleTop: {
      position: "absolute",
      top: -40,
      right: -24,
      width: 160,
      height: 160,
      borderRadius: theme.radii.full,
      backgroundColor: withAlpha(theme.colors.secondary, 0.08),
    },
    decorCircleBottom: {
      position: "absolute",
      bottom: -40,
      right: 8,
      width: 100,
      height: 100,
      borderRadius: theme.radii.full,
      backgroundColor: withAlpha(theme.colors.secondary, 0.05),
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    logo: {
      width: 22,
      height: 22,
      borderRadius: theme.radii.logo,
      opacity: 0.9,
    },
    brandLabel: {
      ...theme.typography.text12BoldWide,
      textTransform: "uppercase",
      color: withAlpha(theme.colors.textInverse, 0.55),
    },
    statusPill: {
      marginLeft: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
      borderRadius: theme.radii.full,
      backgroundColor: withAlpha(theme.colors.textInverse, 0.07),
      borderWidth: theme.borderWidth.thin,
      borderColor: withAlpha(theme.colors.textInverse, 0.1),
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.success,
    },
    statusLabel: {
      ...theme.typography.text10Bold,
      color: withAlpha(theme.colors.textInverse, 0.55),
    },
    balanceLabel: {
      ...theme.typography.text12Medium,
      color: withAlpha(theme.colors.textInverse, 0.4),
      marginTop: theme.spacing.lg,
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xs,
    },
    balanceAmount: {
      ...theme.typography.text30ExtraBoldFigure,
      color: theme.colors.textInverse,
    },
    eyeButton: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.chip,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withAlpha(theme.colors.textInverse, 0.08),
    },
    accountRow: {
      marginTop: theme.spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md - 1,
      borderRadius: theme.radii.button,
      backgroundColor: withAlpha(theme.colors.textInverse, 0.06),
    },
    accountBankLabel: {
      ...theme.typography.text10p5SemiBoldWide,
      textTransform: "uppercase",
      color: withAlpha(theme.colors.textInverse, 0.35),
    },
    accountNumber: {
      ...theme.typography.text15BoldFigure,
      color: theme.colors.textInverse,
      marginTop: 3,
    },
    accountName: {
      ...theme.typography.text11Regular,
      color: withAlpha(theme.colors.textInverse, 0.4),
      marginTop: 2,
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm - 1,
      borderRadius: theme.radii.chip,
      backgroundColor: withAlpha(theme.colors.textInverse, 0.07),
      borderWidth: theme.borderWidth.thin,
      borderColor: withAlpha(theme.colors.textInverse, 0.12),
    },
    copyLabel: {
      ...theme.typography.text11Bold,
      color: withAlpha(theme.colors.textInverse, 0.5),
    },
  });

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={recipe.gradientColors}
        locations={recipe.gradientLocations}
        start={recipe.gradientStart}
        end={recipe.gradientEnd}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      <View style={styles.brandRow}>
        <Image source={parcLogo} style={styles.logo} />
        <Text style={styles.brandLabel}>Parc Wallet</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusLabel}>Active</Text>
        </View>
      </View>

      <Text style={styles.balanceLabel}>Available Balance</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceAmount}>{isBalanceVisible ? formatMoney(balance) : `₦${"•".repeat(10)}`}</Text>
        <Pressable style={styles.eyeButton} onPress={onToggleVisibility} accessibilityRole="button" accessibilityLabel={isBalanceVisible ? "Hide balance" : "Show balance"}>
          <Ionicons name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} size={16} color={theme.colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.accountRow}>
        <View>
          <Text style={styles.accountBankLabel}>{bankName}</Text>
          <Text style={styles.accountNumber}>{accountNumber}</Text>
          <Text style={styles.accountName}>{accountName}</Text>
        </View>
        <Pressable style={styles.copyButton} onPress={handleCopy} accessibilityRole="button" accessibilityLabel="Copy account number">
          <Ionicons name={justCopied ? "checkmark" : "copy-outline"} size={13} color={withAlpha(theme.colors.textInverse, 0.5)} />
          <Text style={styles.copyLabel}>{justCopied ? "Copied" : "Copy"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
