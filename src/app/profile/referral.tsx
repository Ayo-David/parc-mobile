import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";

import { useReferralSummary } from "@/api/queries/useReferralSummary";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const CODE_FIELDS = ["referral_code", "code"];
const REWARD_FIELDS = ["earned_rewards_minor", "total_rewards_minor", "rewards_earned_minor"];
const COUNT_FIELDS = ["referred_count", "successful_referrals", "total_referrals"];

function firstString(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string") return value;
  }
  return null;
}

function firstNumberLike(record: Record<string, unknown>, fields: string[]): string | number | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" || typeof value === "number") return value;
  }
  return null;
}

/**
 * Figma "Refer & Earn" screen. `GET /v1/referrals/summary` documents no
 * response schema at all (PLAN.md "Real blockers") — this defensively
 * probes a few plausible field names for the code/reward/count and shows
 * an honest "not available" state if none are found, rather than
 * inventing placeholder numbers.
 */
export default function ReferralScreen() {
  const { theme } = useTheme();
  const summary = useReferralSummary();

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, alignItems: "center", gap: theme.semanticSpacing.form },
    codeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      alignItems: "center",
      gap: theme.spacing.xs,
      ...theme.elevation.sm,
    },
    codeLabel: { ...theme.typography.label, color: theme.colors.textMuted },
    code: { ...theme.typography.h1, color: theme.colors.textPrimary, letterSpacing: 2 },
    statsRow: { flexDirection: "row", gap: theme.semanticSpacing.section },
    statValue: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: "center" },
    statLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: "center" },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted, textAlign: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (summary.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const data = summary.data ?? {};
  const code = firstString(data, CODE_FIELDS);
  const rewards = firstNumberLike(data, REWARD_FIELDS);
  const count = firstNumberLike(data, COUNT_FIELDS);

  if (!code) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.emptyText}>Your referral details aren't available right now.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
        {(rewards !== null || count !== null) && (
          <View style={styles.statsRow}>
            {count !== null ? (
              <View>
                <Text style={styles.statValue}>{count}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
            ) : null}
            {rewards !== null ? (
              <View>
                <Text style={styles.statValue}>{rewards}</Text>
                <Text style={styles.statLabel}>Rewards</Text>
              </View>
            ) : null}
          </View>
        )}
        <Button label="Share code" onPress={() => void Share.share({ message: `Join me on Parc! Use my referral code ${code} when you sign up.` })} />
      </View>
    </ScreenContainer>
  );
}
