import { randomUUID } from "expo-crypto";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";

/**
 * Figma "Goal 03 — Break Goal" (node 430:66, missing-mobile.md §7) — the
 * forfeited-interest disclosure missing-mobile.md flagged as needing care
 * ("disclosed before the customer confirms, not just reported after").
 * Figma's copy names a specific returned amount up front; that figure
 * isn't knowable before calling `POST /v1/savings/goals/{id}/break` (no
 * quote endpoint exists for a goal break, unlike fixed-deposit
 * liquidation), so the warning stays deliberately amount-free and the
 * real returned amount is shown on the success screen instead — an
 * honest gap, not a missed figure.
 */
export default function GoalBreakScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const goal = useSavingsRecordsStore((state) => state.goals.find((entry) => entry.id === goalId));
  const updateGoalStatus = useSavingsRecordsStore((state) => state.updateGoalStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBreak() {
    if (!goalId || !goal) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const outcome = await api.breakGoal({ goalId, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      updateGoalStatus(goalId, outcome.goal_status);
      router.replace({
        pathname: "/savings/success",
        params: { title: "Goal Broken", amountMinor: outcome.principal_minor, currency: outcome.currency, detail: `Returned to your Parc wallet from ${goal.name}` },
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this went through. Please check your transaction history before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section },
    warningCard: {
      backgroundColor: theme.components.status.error.backgroundColor,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
      gap: theme.spacing.xs,
    },
    warningTitle: { ...theme.typography.text13Bold, color: theme.colors.error },
    warningBody: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.semanticSpacing.form },
    footer: { marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
  });

  if (!goal) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.warningBody}>This goal is no longer available on this device.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: `Break ${goal.name}` }} />
      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>This can&apos;t be undone</Text>
          <Text style={styles.warningBody}>
            Breaking this goal returns your savings account balance to your wallet immediately, but you&apos;ll forfeit any bonus interest this goal would have earned at maturity. If you have an
            auto-save plan for this goal, cancel it separately.
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.footer}>
          <Button label="Break goal & withdraw all" variant="destructive" onPress={handleBreak} loading={isSubmitting} />
        </View>
      </View>
    </ScreenContainer>
  );
}
