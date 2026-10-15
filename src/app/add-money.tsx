import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { fundingAccountSetupState } from "@/api/errors";
import { useWalletFundingDetails } from "@/api/queries/useWalletFundingDetails";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { FundingAccountSetup } from "@/features/wallet/FundingAccountSetup";
import { useTheme, withAlpha } from "@/theme";

/**
 * Figma "Add Money" (228:3769), under the "Parc Dashboard" section
 * (326:968) — previously implemented as a bottom sheet on Home (no
 * dedicated screen existed for it). Figma designs it as a real full
 * screen with a back header, so it's rebuilt as one here (`/add-money`)
 * and Home's quick action now routes to it instead of opening a sheet.
 * Three funding methods are shown (Bank Transfer, Card Payment, USSD) —
 * per missing-mobile.md §9, only Bank Transfer has a confirmed backend
 * route (`getWalletFundingDetails`); Card Payment and USSD have no
 * corresponding payment-service endpoint anywhere. Rather than silently
 * drop two real Figma rows or fake a payment flow with no backend behind
 * it, they're shown (visual parity) but disclose "coming soon" on tap —
 * the same honesty pattern already used for biometric login/reset
 * elsewhere in this app. Until the customer has an account number, the
 * card is replaced by `FundingAccountSetup` (BVN + bank account for
 * Paystack's validation, then a "setting up" state while it's opened).
 */
export default function AddMoneyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const funding = useWalletFundingDetails();
  const [justCopied, setJustCopied] = useState(false);
  const fundingData = funding.data;
  const setupState = fundingAccountSetupState(funding.error);
  const recipe = theme.components.walletCard;

  async function handleCopy() {
    if (!fundingData) return;
    await Clipboard.setStringAsync(fundingData.account_number);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, paddingTop: theme.semanticSpacing.component, paddingBottom: theme.spacing.md },
    title: { ...theme.typography.text16Bold, color: theme.colors.textPrimary },
    card: { padding: theme.semanticSpacing.card, borderRadius: theme.radii.card, overflow: "hidden" },
    cardLabel: { ...theme.typography.text12Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    accountNumber: { ...theme.typography.text28ExtraBoldFigureWide, color: theme.colors.textInverse, marginTop: theme.spacing.xs },
    accountName: { ...theme.typography.text13Regular, color: withAlpha(theme.colors.textInverse, 0.6), marginTop: theme.spacing.sm - 2 },
    copyRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs + 2, marginTop: theme.spacing.md, alignSelf: "flex-start" },
    copyLabel: { ...theme.typography.text12Bold, color: withAlpha(theme.colors.textInverse, 0.7) },
    sectionLabel: { ...theme.typography.text13Bold, color: theme.colors.textSecondary, marginTop: theme.semanticSpacing.card },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md + 2,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: theme.colors.primarySubtle,
    },
    methodIcon: { width: 46, height: 46, borderRadius: theme.radii.lg - 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySubtle },
    methodInfo: { flex: 1, gap: 2 },
    methodTitle: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    methodSubtitle: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    methodBadge: { paddingHorizontal: theme.spacing.sm + 1, paddingVertical: 3, borderRadius: theme.radii.full, backgroundColor: theme.components.status.success.backgroundColor },
    methodBadgeLabel: { ...theme.typography.text10p5Bold, color: theme.colors.successStrong },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  const methods: { key: string; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; badge?: string; onPress?: () => void }[] = [
    { key: "bank", icon: "business-outline", title: "Bank Transfer", subtitle: "Transfer from any Nigerian bank", badge: "Instant" },
    { key: "card", icon: "card-outline", title: "Card Payment", subtitle: "Debit or credit card", badge: "Fast", onPress: () => Alert.alert("Coming soon", "Card funding isn't available yet.") },
    { key: "ussd", icon: "call-outline", title: "USSD", subtitle: "No internet required", onPress: () => Alert.alert("Coming soon", "USSD funding isn't available yet.") },
  ];

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title="Add Money" />

      {setupState ? (
        <FundingAccountSetup state={setupState} rejectionMessage={funding.error?.message} />
      ) : !fundingData ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.card}>
          <LinearGradient colors={recipe.gradientColors} locations={recipe.gradientLocations} start={recipe.gradientStart} end={recipe.gradientEnd} style={StyleSheet.absoluteFill} />
          <Text style={styles.cardLabel}>Transfer to this account</Text>
          <Text style={styles.accountNumber}>{fundingData.account_number}</Text>
          <Text style={styles.accountName}>
            {fundingData.account_name} · {fundingData.bank_name}
          </Text>
          <Pressable style={styles.copyRow} onPress={handleCopy} accessibilityRole="button" accessibilityLabel="Copy account number">
            <Ionicons name={justCopied ? "checkmark" : "copy-outline"} size={14} color={withAlpha(theme.colors.textInverse, 0.7)} />
            <Text style={styles.copyLabel}>{justCopied ? "Copied" : "Copy account number"}</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionLabel}>Add via</Text>
      {methods.map((method) => (
        <Pressable key={method.key} style={styles.methodRow} onPress={method.onPress} accessibilityRole="button" accessibilityLabel={method.title}>
          <View style={styles.methodIcon}>
            <Ionicons name={method.icon} size={20} color={theme.colors.textPrimary} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>{method.title}</Text>
            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
          </View>
          {method.badge ? (
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeLabel}>{method.badge}</Text>
            </View>
          ) : null}
          {method.key !== "bank" ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} /> : null}
        </Pressable>
      ))}
    </ScreenContainer>
  );
}
