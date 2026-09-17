import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

/**
 * Figma goal-detail pattern. There is no `GET` to refetch a single goal
 * (PLAN.md "Real blockers"), so this renders from the locally tracked
 * record (savingsRecordsStore) and only ever reflects the last known
 * state — a partial withdrawal or break updates it optimistically from
 * the mutation's own response, not a refetch.
 */
export default function GoalDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const goal = useSavingsRecordsStore((state) => state.goals.find((entry) => entry.id === goalId));
  const updateGoalStatus = useSavingsRecordsStore((state) => state.updateGoalStatus);
  const [amountNaira, setAmountNaira] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira);

  async function handleWithdraw() {
    if (!amountMinor || !goalId) return;
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const withdrawal = await api.withdrawFromGoal({ goalId, amountMinor, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      updateGoalStatus(goalId, withdrawal.goal_status);
      setResult(
        `Withdrew ${formatMoney({ amount_minor: withdrawal.principal_minor, currency: withdrawal.currency })}` +
          (withdrawal.forfeited_interest_minor !== "0" ? ` (forfeited ${formatMoney({ amount_minor: withdrawal.forfeited_interest_minor, currency: withdrawal.currency })} interest)` : ""),
      );
      setAmountNaira("");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this withdrawal went through. Please check your transaction history before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBreak() {
    if (!goalId) return;
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await api.breakGoal({ goalId, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      updateGoalStatus(goalId, outcome.goal_status);
      setResult(`Goal broken. ${formatMoney({ amount_minor: outcome.principal_minor, currency: outcome.currency })} returned to your wallet.`);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this went through. Please check your transaction history before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    result: { ...theme.typography.bodySmall, color: theme.colors.success },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    actions: { gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
  });

  if (!goal) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.subtitle}>This goal is no longer available on this device.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{goal.name}</Text>
        <Text style={styles.subtitle}>
          Target: {formatMoney({ amount_minor: goal.targetAmountMinor, currency: goal.currency })} by {goal.targetDate}
        </Text>
        {result ? <Text style={styles.result}>{result}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {goal.status === "ACTIVE" ? (
          <>
            <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Withdrawal amount (₦)" keyboardType="decimal-pad" />
            <View style={styles.actions}>
              <Button label="Withdraw" onPress={handleWithdraw} disabled={!amountMinor} loading={isSubmitting} />
              <Button label="Break Goal" variant="destructive" onPress={handleBreak} loading={isSubmitting} />
              <Button label="Done" variant="secondary" onPress={() => router.replace("/(tabs)/savings")} />
            </View>
          </>
        ) : (
          <Button label="Done" onPress={() => router.replace("/(tabs)/savings")} />
        )}
      </View>
    </ScreenContainer>
  );
}
