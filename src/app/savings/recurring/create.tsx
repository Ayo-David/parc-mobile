import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import type { RecurringPlanFrequency } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PickerField } from "@/components/PickerField/PickerField";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { parseMajorUnitsToMinor } from "@/utils/money";

const FREQUENCIES: Array<{ label: string; value: RecurringPlanFrequency }> = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
];

/**
 * Figma "Savings 01 — Set Up Auto-save" (node 431:39, missing-mobile.md
 * §7). Uses the customer's existing ORDINARY savings account, same as
 * Create Goal. The "Save towards" goal picker is now wired to a real,
 * confirmed contract field — `RecurringPlanInput.goal_id` (optional,
 * `parc-contracts/openapi/savings/v1/openapi.yaml`) — not a cosmetic
 * label; PLAN.md's open question about whether recurring plans can
 * reference a goal is resolved: they can. There's still no `GET` anywhere
 * that reads a goal's contributions back (PLAN.md "Savings contract
 * gaps"), so this only lets the Goal Detail screen show "this goal has an
 * auto-save plan" — it doesn't unlock a per-goal balance.
 */
export default function CreateRecurringPlanScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const summary = useSavingsSummary();
  const goals = useSavingsRecordsStore((state) => state.goals);
  const addRecurringPlan = useSavingsRecordsStore((state) => state.addRecurringPlan);
  const [amountNaira, setAmountNaira] = useState("");
  const [frequency, setFrequency] = useState<RecurringPlanFrequency>("MONTHLY");
  const [goalId, setGoalId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savingsAccount = summary.data?.accounts.find((account) => account.product_type === "ORDINARY") ?? null;
  const amountMinor = parseMajorUnitsToMinor(amountNaira);
  const isValidDate = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(startDate);
  const canSubmit = !!savingsAccount && !!amountMinor && isValidDate;

  async function handleSubmit() {
    if (!canSubmit || !savingsAccount || !amountMinor || !bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const referenceDataResult = await api.getOnboardingReferenceData(bootstrap.data.tenant_id);
      const consentReference = referenceDataResult.consent_documents[0]?.id;
      if (!consentReference) {
        setError("No consent document is configured for this tenant.");
        return;
      }
      const result = await api.createRecurringPlan({
        savingsAccountId: savingsAccount.savings_account_id,
        amountMinor,
        frequency,
        startDate,
        consentReference,
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
        ...(goalId ? { goalId } : {}),
      });
      addRecurringPlan({
        id: result.recurring_plan_id,
        savingsAccountId: result.savings_account_id,
        amountMinor: result.amount_minor,
        currency: result.currency,
        frequency: result.frequency,
        nextExecutionDate: result.next_execution_date,
        ...(goalId ? { goalId } : {}),
      });
      router.replace({
        pathname: "/savings/success",
        params: { title: "Auto-save Set Up!", amountMinor: result.amount_minor, currency: result.currency, detail: `${result.frequency.charAt(0)}${result.frequency.slice(1).toLowerCase()} contribution starting ${result.next_execution_date}` },
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    frequencyRow: { flexDirection: "row", gap: theme.spacing.sm },
    chip: { flex: 1, borderRadius: theme.radii.full, borderWidth: 1, paddingVertical: theme.semanticSpacing.form, alignItems: "center" },
    chipLabel: { ...theme.typography.text13Bold },
  });

  if (!summary.isLoading && !savingsAccount) {
    return (
      <FormScreenLayout headerTitle="Auto-save" title="Set up auto-save">
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>
          You don't have a savings account yet, and this app can't open one for you in this build. Please contact support.
        </Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout headerTitle="Auto-save"
      title="Set up auto-save"
      subtitle="We'll move money from your wallet into savings automatically."
      errorMessage={error}
      footer={<Button label="Start Auto-save" onPress={handleSubmit} disabled={!canSubmit || referenceData.isLoading} loading={isSubmitting} />}
    >
      <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount per contribution (₦)" keyboardType="decimal-pad" autoFocus />
      <View style={styles.frequencyRow}>
        {FREQUENCIES.map((option) => {
          const isActive = option.value === frequency;
          return (
            <Pressable
              key={option.value}
              onPress={() => setFrequency(option.value)}
              style={[styles.chip, { borderColor: isActive ? theme.colors.primary : theme.colors.border, backgroundColor: isActive ? theme.colors.primarySubtle : theme.colors.surface }]}
            >
              <Text style={[styles.chipLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {goals.length > 0 ? (
        <PickerField
          placeholder="Save towards (optional)"
          options={goals.map((goal) => ({ value: goal.id, label: goal.name }))}
          selectedValue={goalId}
          onSelect={(option) => setGoalId(option.value)}
        />
      ) : null}
      <TextField value={startDate} onChangeText={setStartDate} placeholder="Start date (YYYY-MM-DD)" keyboardType="numbers-and-punctuation" />
    </FormScreenLayout>
  );
}
