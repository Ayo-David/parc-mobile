import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";

import { useReferralSummary } from "@/api/queries/useReferralSummary";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const CODE_FIELDS = ["referral_code", "code"];
// Live shape (2026-10-12): { referral_code, program_name, policy, earned_reward_minor, currency } — no referral count field.
const REWARD_FIELDS = ["earned_reward_minor", "earned_rewards_minor", "total_rewards_minor"];
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
 * Figma "Refer & Earn" screen, now including its real "Misc 03 — Referral
 * Empty State" (node 439:545, missing-mobile.md §8) for a customer with
 * zero referrals so far. `GET /v1/referrals/summary` documents no
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
    codeCard: { backgroundColor: theme.colors.secondary, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, alignItems: "center", gap: theme.spacing.sm, width: "100%" },
    codeLabel: { ...theme.typography.label, color: theme.colors.secondarySubtle },
    code: { ...theme.typography.h1, color: theme.colors.textInverse, letterSpacing: 2 },
    statsRow: { flexDirection: "row", gap: theme.semanticSpacing.section },
    statValue: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: "center" },
    statLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: "center" },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted, textAlign: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (summary.isLoading) {
    return (
      <ScreenContainer>
        <BackHeader title="Refer & Earn" />
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
        <BackHeader title="Refer & Earn" />
        <View style={styles.content}>
          <Text style={styles.emptyText}>Referrals aren&apos;t available on your account yet.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currency = firstString(data, ["currency"]) ?? "NGN";
  const rewardsText = rewards !== null && /^\d+$/.test(String(rewards)) ? formatMoney({ amount_minor: String(rewards), currency }) : null;
  const hasRewards = rewards !== null && String(rewards) !== "0";
  const hasReferrals = count !== null ? String(count) !== "0" : hasRewards;

  return (
    <ScreenContainer>
      <BackHeader title="Refer & Earn" />
      <View style={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{code}</Text>
          <Button label="Share invite link" variant="secondary" onPress={() => void Share.share({ message: `Join me on Parc! Use my referral code ${code} when you sign up.` })} />
        </View>

        {hasReferrals ? (
          <View style={styles.statsRow}>
            {count !== null ? (
              <View>
                <Text style={styles.statValue}>{count}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
            ) : null}
            {rewardsText ? (
              <View>
                <Text style={styles.statValue}>{rewardsText}</Text>
                <Text style={styles.statLabel}>Rewards earned</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <EmptyState emoji="🎁" title="No referrals yet" body="Share your code with friends who'd like to join Parc." />
        )}
      </View>
    </ScreenContainer>
  );
}
