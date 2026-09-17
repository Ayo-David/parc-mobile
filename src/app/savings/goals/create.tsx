import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useProfile } from "@/api/queries/useProfile";
import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { parseMajorUnitsToMinor } from "@/utils/money";

/**
 * Figma "Create Target Savings Goal". Uses the customer's existing
 * ORDINARY savings account (from `GET /v1/savings/summary`) as the
 * `savings_account_id` — there is no endpoint to open a new base savings
 * account from the mobile app (`POST /v1/savings-accounts` exists in the
 * savings-service contract but is not exposed through the Mobile BFF), so
 * this is blocked for any customer who doesn't already have one.
 */
export default function CreateSavingsGoalScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const summary = useSavingsSummary();
  const addGoal = useSavingsRecordsStore((state) => state.addGoal);
  const [name, setName] = useState("");
  const [targetAmountNaira, setTargetAmountNaira] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savingsAccount = summary.data?.accounts.find((account) => account.product_type === "ORDINARY") ?? null;
  const targetAmountMinor = parseMajorUnitsToMinor(targetAmountNaira);
  const isValidDate = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(targetDate);
  const canSubmit = !!savingsAccount && !!profile.data && name.trim().length >= 2 && !!targetAmountMinor && isValidDate;

  async function handleSubmit() {
    if (!canSubmit || !savingsAccount || !profile.data || !targetAmountMinor) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.createSavingsGoal({
        customerId: profile.data.id,
        savingsAccountId: savingsAccount.savings_account_id,
        name: name.trim(),
        targetAmountMinor,
        targetDate,
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
      });
      addGoal({
        id: result.id,
        savingsAccountId: result.savings_account_id,
        name: name.trim(),
        targetAmountMinor: result.target_amount_minor,
        currency: result.currency,
        targetDate: result.target_date,
        status: result.status,
      });
      router.replace("/(tabs)/savings");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!summary.isLoading && !savingsAccount) {
    return (
      <FormScreenLayout title="Create a savings goal">
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>
          You don't have a savings account yet, and this app can't open one for you in this build. Please contact support.
        </Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="Create a savings goal"
      subtitle="Set a target and we'll track your progress."
      errorMessage={error}
      footer={<Button label="Create Goal" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />}
    >
      <TextField value={name} onChangeText={setName} placeholder="Goal name, e.g. New laptop" autoFocus />
      <TextField value={targetAmountNaira} onChangeText={setTargetAmountNaira} placeholder="Target amount (₦)" keyboardType="decimal-pad" />
      <TextField value={targetDate} onChangeText={setTargetDate} placeholder="Target date (YYYY-MM-DD)" keyboardType="numbers-and-punctuation" />
    </FormScreenLayout>
  );
}
