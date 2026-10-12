import { randomUUID } from "expo-crypto";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

/**
 * Figma "Goal 02 — Withdraw" (node 430:22, missing-mobile.md §7). "Available
 * to withdraw" shows the real pooled ORDINARY account balance (`GET
 * /v1/savings/summary`), labeled honestly as the shared account balance
 * rather than this goal's own — see the Detail screen's comment for why no
 * per-goal figure exists. No withdrawal-quote is shown first: `POST
 * /v1/savings/goals/{id}/withdrawal-quotes` exists but has no documented
 * response schema (PLAN.md "Savings contract gaps"), so this goes straight
 * to the real withdrawal and shows its actual forfeited-interest figure on
 * the success screen, rather than guessing at an unconfirmed quote shape.
 */
export default function GoalWithdrawScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const goal = useSavingsRecordsStore((state) => state.goals.find((entry) => entry.id === goalId));
  const updateGoalStatus = useSavingsRecordsStore((state) => state.updateGoalStatus);
  const summary = useSavingsSummary();
  const savingsAccount = summary.data?.accounts.find((account) => account.product_type === "ORDINARY") ?? null;
  const [amountNaira, setAmountNaira] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira);

  async function handleWithdraw() {
    if (!amountMinor || !goalId || !goal) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const withdrawal = await api.withdrawFromGoal({ goalId, amountMinor, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      updateGoalStatus(goalId, withdrawal.goal_status);
      const detail =
        withdrawal.forfeited_interest_minor !== "0"
          ? `Credited to your Parc wallet from ${goal.name} (forfeited ${formatMoney({ amount_minor: withdrawal.forfeited_interest_minor, currency: withdrawal.currency })} interest)`
          : `Credited to your Parc wallet from ${goal.name}`;
      router.replace({
        pathname: "/savings/success",
        params: { title: "Withdrawal Successful!", amountMinor: withdrawal.principal_minor, currency: withdrawal.currency, detail },
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this withdrawal went through. Please check your transaction history before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    available: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    warningCard: {
      backgroundColor: theme.components.status.warning.backgroundColor,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
      gap: theme.spacing.xs,
    },
    warningTitle: { ...theme.typography.text13Bold, color: theme.colors.warning },
    warningBody: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
  });

  if (!goal) {
    return (
      <FormScreenLayout title="Withdraw">
        <Text style={styles.available}>This goal is no longer available on this device.</Text>
      </FormScreenLayout>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Withdraw from ${goal.name}` }} />
      <FormScreenLayout
        title={`Withdraw from ${goal.name}`}
        errorMessage={error}
        footer={<Button label="Confirm withdrawal" onPress={handleWithdraw} disabled={!amountMinor} loading={isSubmitting} />}
      >
        <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount to withdraw (₦)" keyboardType="decimal-pad" autoFocus />
        {savingsAccount ? <Text style={styles.available}>Available to withdraw: {formatMoney({ amount_minor: savingsAccount.available_balance_minor, currency: savingsAccount.currency })}</Text> : null}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>This affects your progress</Text>
          <Text style={styles.warningBody}>Withdrawing early may reduce your goal&apos;s progress and any bonus interest earned won&apos;t apply to the withdrawn amount.</Text>
        </View>
      </FormScreenLayout>
    </>
  );
}
