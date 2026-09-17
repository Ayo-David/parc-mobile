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
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { parseMajorUnitsToMinor } from "@/utils/money";

const FREQUENCIES: Array<{ label: string; value: RecurringPlanFrequency }> = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
];

/** Figma "Auto-save" / recurring contribution plan. Uses the customer's existing ORDINARY savings account, same as Create Goal. */
export default function CreateRecurringPlanScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const summary = useSavingsSummary();
  const addRecurringPlan = useSavingsRecordsStore((state) => state.addRecurringPlan);
  const [amountNaira, setAmountNaira] = useState("");
  const [frequency, setFrequency] = useState<RecurringPlanFrequency>("MONTHLY");
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
      });
      addRecurringPlan({
        id: result.recurring_plan_id,
        savingsAccountId: result.savings_account_id,
        amountMinor: result.amount_minor,
        currency: result.currency,
        frequency: result.frequency,
        nextExecutionDate: result.next_execution_date,
      });
      router.replace("/(tabs)/savings");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    frequencyRow: { flexDirection: "row", gap: theme.spacing.sm },
    chip: { flex: 1, borderRadius: theme.radii.full, borderWidth: 1, paddingVertical: theme.semanticSpacing.form, alignItems: "center" },
    chipLabel: { ...theme.typography.label },
  });

  if (!summary.isLoading && !savingsAccount) {
    return (
      <FormScreenLayout title="Set up auto-save">
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>
          You don't have a savings account yet, and this app can't open one for you in this build. Please contact support.
        </Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
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
      <TextField value={startDate} onChangeText={setStartDate} placeholder="Start date (YYYY-MM-DD)" keyboardType="numbers-and-punctuation" />
    </FormScreenLayout>
  );
}
