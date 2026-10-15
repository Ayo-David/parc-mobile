import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useProfile } from "@/api/queries/useProfile";
import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { KYC_TIER_LIMITS, kycLimitForTier } from "@/features/security/kycLimits";
import { useTheme, withAlpha } from "@/theme";

/**
 * Figma "System 08 — KYC Tier & Limits" (node 436:492, missing-mobile.md
 * §1) — a confirmed real gap the doc flagged: the customer previously had
 * no way to see their tier, their limits, or an upgrade path. `kyc_tier`
 * is real (`GET /v1/profile`); the ₦ figures are a static reference table
 * (see `features/security/kycLimits.ts` for why). "Upgrade to Tier 3"
 * routes through the real Support-ticket flow (MOB-18) rather than a
 * fabricated self-service upgrade endpoint — none exists, and
 * `parc-interview-answers.md` §12 itself notes tier activation "requires
 * institutional approval."
 */
export default function AccountLimitsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();

  const currentTier = profile.data?.kyc_tier;
  const currentLimit = kycLimitForTier(currentTier);
  const nextTier = currentTier !== undefined ? KYC_TIER_LIMITS.find((entry) => entry.tier === currentTier + 1) : undefined;

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.component },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    tierCard: { backgroundColor: theme.colors.surfaceInverse, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, gap: theme.spacing.sm },
    tierRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    tierLabel: { ...theme.typography.text14Bold, color: theme.colors.textInverse },
    upgradeChip: { backgroundColor: theme.colors.secondary, borderRadius: theme.radii.full, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    upgradeChipText: { ...theme.typography.text10p5Bold, color: theme.colors.textInverse },
    tierHelper: { ...theme.typography.text12Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    sectionLabel: { ...theme.typography.text13Bold, color: theme.colors.textMuted },
    row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form },
    rowLabel: { ...theme.typography.text14Regular, color: theme.colors.textSecondary },
    rowValue: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
  });

  if (profile.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackHeader title="Account Limits" />
      <View style={styles.content}>
        <View style={styles.tierCard}>
          <View style={styles.tierRow}>
            <Text style={styles.tierLabel}>{currentLimit?.label ?? "Tier not available"}</Text>
            {nextTier ? (
              <View style={styles.upgradeChip}>
                <Text style={styles.upgradeChipText}>Upgrade to {nextTier.label.split(" – ")[0]}</Text>
              </View>
            ) : null}
          </View>
          {nextTier ? <Text style={styles.tierHelper}>Contact support to verify additional details and unlock {nextTier.label.split(" – ")[0]} limits.</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>Your current limits</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily transaction limit</Text>
          <Text style={styles.rowValue}>{currentLimit?.dailyTransactionLimitNaira ?? "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Balance limit</Text>
          <Text style={styles.rowValue}>{currentLimit?.balanceLimitNaira ?? "No limit"}</Text>
        </View>

        {nextTier ? <Button label={`Upgrade to ${nextTier.label.split(" – ")[0]}`} onPress={() => router.push("/profile/support/new")} /> : null}
      </View>
    </ScreenContainer>
  );
}
