import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { useProfile } from "@/api/queries/useProfile";
import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { Button } from "@/components/Button/Button";
import { PickerField, type PickerOption } from "@/components/PickerField/PickerField";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS_AHEAD = 10;

function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Last calendar day of the given month (monthIndex 0–11). */
function endOfMonth(year: number, monthIndex: number): string {
  return isoDate(year, monthIndex, new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate());
}

/** First day of next month — when an auto-save linked to a new goal starts. */
function firstOfNextMonth(today: Date): string {
  const next = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  return isoDate(next.getUTCFullYear(), next.getUTCMonth(), 1);
}

/**
 * Figma "New Target Savings" (240:15595) → "Savings Goal Created!"
 * (240:15779). Creates the goal on the customer's ORDINARY savings account
 * (POST /v1/savings/goals); the optional Monthly Contribution then creates
 * a MONTHLY recurring plan tagged with the new goal_id (POST
 * /v1/savings/recurring-plans), which needs a tenant consent document — when
 * none exists the field says so up front instead of failing after the goal
 * is made. Target date is chosen as month + year (Figma "e.g. December
 * 2027") and sent as that month's last day. Figma's info card claimed a 12%
 * rate and a per-goal progress meter; neither is backed by any API, so the
 * card states only what the app actually does.
 */
export default function CreateSavingsGoalScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const summary = useSavingsSummary();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const addGoal = useSavingsRecordsStore((state) => state.addGoal);
  const addRecurringPlan = useSavingsRecordsStore((state) => state.addRecurringPlan);
  const [name, setName] = useState("");
  const [targetAmountNaira, setTargetAmountNaira] = useState("");
  const [monthlyNaira, setMonthlyNaira] = useState("");
  const [month, setMonth] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const yearOptions: PickerOption[] = useMemo(
    () => Array.from({ length: YEARS_AHEAD + 1 }, (_, offset) => String(today.getFullYear() + offset)).map((value) => ({ value, label: value })),
    [today],
  );
  // Only months that are still ahead when the current year is chosen.
  const monthOptions: PickerOption[] = MONTHS.map((label, index) => ({ value: String(index), label })).filter(
    (option) => year === null || Number(year) > today.getFullYear() || Number(option.value) >= today.getMonth(),
  );

  const savingsAccount = summary.data?.accounts.find((account) => account.product_type === "ORDINARY") ?? null;
  const consentReference = referenceData.data?.consent_documents[0]?.id ?? null;
  const autoSaveAvailable = !!consentReference;
  const targetAmountMinor = parseMajorUnitsToMinor(targetAmountNaira);
  const monthlyMinor = monthlyNaira.trim() ? parseMajorUnitsToMinor(monthlyNaira) : null;
  const monthlyInvalid = monthlyNaira.trim().length > 0 && !monthlyMinor;
  const targetDate = month !== null && year !== null ? endOfMonth(Number(year), Number(month)) : null;
  const canSubmit = !!savingsAccount && !!profile.data && name.trim().length >= 2 && !!targetAmountMinor && !!targetDate && !monthlyInvalid && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit || !savingsAccount || !profile.data || !targetAmountMinor || !targetDate) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const goal = await api.createSavingsGoal({
        customerId: profile.data.id,
        savingsAccountId: savingsAccount.savings_account_id,
        name: name.trim(),
        targetAmountMinor,
        targetDate,
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
      });
      addGoal({
        id: goal.id,
        savingsAccountId: goal.savings_account_id,
        name: name.trim(),
        targetAmountMinor: goal.target_amount_minor,
        currency: goal.currency,
        targetDate: goal.target_date,
        status: goal.status,
      });

      let autoSaveNote = "";
      if (monthlyMinor && consentReference) {
        try {
          const plan = await api.createRecurringPlan({
            savingsAccountId: savingsAccount.savings_account_id,
            amountMinor: monthlyMinor,
            frequency: "MONTHLY",
            startDate: firstOfNextMonth(today),
            consentReference,
            goalId: goal.id,
            correlationId: randomUUID(),
            idempotencyKey: createIdempotencyKey(),
          });
          addRecurringPlan({ id: plan.recurring_plan_id, savingsAccountId: plan.savings_account_id, goalId: goal.id, amountMinor: plan.amount_minor, currency: plan.currency, frequency: plan.frequency, nextExecutionDate: plan.next_execution_date });
          autoSaveNote = ` · Auto-saving ${formatMoney({ amount_minor: plan.amount_minor, currency: plan.currency })} monthly`;
        } catch {
          // The goal itself exists; tell the customer the auto-save didn't, rather than undoing it.
          autoSaveNote = " · Monthly auto-save couldn't be set up — you can add it from the goal";
        }
      }

      router.replace({
        pathname: "/savings/success",
        params: { title: "Savings Goal Created!", amountMinor: goal.target_amount_minor, currency: goal.currency, detail: `${name.trim()} · by ${MONTHS[Number(month)]} ${year}${autoSaveNote}` },
      });
    } catch (submitError) {
      setError(
        submitError instanceof ApiError && submitError.category === "network"
          ? "We couldn't reach Parc. Check your connection and try again."
          : submitError instanceof ApiError && submitError.category === "validation"
            ? submitError.message
            : "We couldn't create your goal. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { gap: theme.spacing.md + 2, paddingBottom: theme.spacing.lg },
    label: { ...theme.typography.text12SemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm - 2 },
    hint: { ...theme.typography.text11Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
    hintError: { color: theme.colors.error },
    dateRow: { flexDirection: "row", gap: theme.spacing.sm },
    dateCell: { flex: 1 },
    infoCard: { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.input, paddingHorizontal: theme.spacing.md + 2, paddingVertical: theme.spacing.md },
    infoTitle: { ...theme.typography.text12Bold, color: theme.colors.textSecondary },
    infoLine: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
    notice: { ...theme.typography.text14Regular, color: theme.colors.textSecondary },
    footer: { paddingVertical: theme.spacing.md },
  });

  if (!summary.isLoading && !savingsAccount) {
    return (
      <ScreenContainer>
        <BackHeader title="New Target Savings" />
        <Text style={styles.notice}>You don&apos;t have a savings account yet, and goals can&apos;t be created without one. Please contact support.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackHeader title="New Target Savings" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.label}>Goal Name</Text>
            <TextField value={name} onChangeText={setName} placeholder="e.g. Rent, Business Capital, Car" maxLength={80} />
          </View>
          <View>
            <Text style={styles.label}>Target Amount (₦)</Text>
            <TextField value={targetAmountNaira} onChangeText={setTargetAmountNaira} placeholder="e.g. 2,000,000" keyboardType="decimal-pad" />
          </View>
          <View>
            <Text style={styles.label}>Monthly Contribution (₦)</Text>
            <TextField
              value={monthlyNaira}
              onChangeText={setMonthlyNaira}
              placeholder={autoSaveAvailable ? "Optional · auto-deducted each month" : "Not available yet"}
              keyboardType="decimal-pad"
              editable={autoSaveAvailable}
              state={monthlyInvalid ? "error" : "default"}
            />
            {!autoSaveAvailable && referenceData.isSuccess ? <Text style={styles.hint}>Monthly auto-save isn&apos;t available on your account yet.</Text> : null}
            {monthlyInvalid ? <Text style={[styles.hint, styles.hintError]}>Enter a valid amount</Text> : null}
          </View>
          <View>
            <Text style={styles.label}>Target Date</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCell}>
                <PickerField placeholder="Month" options={monthOptions} selectedValue={month} onSelect={(option) => setMonth(option.value)} />
              </View>
              <View style={styles.dateCell}>
                <PickerField
                  placeholder="Year"
                  options={yearOptions}
                  selectedValue={year}
                  onSelect={(option) => {
                    setYear(option.value);
                    if (month !== null && Number(option.value) === today.getFullYear() && Number(month) < today.getMonth()) setMonth(null);
                  }}
                />
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 How Target Savings Works</Text>
            <Text style={styles.infoLine}>• Saved in your Parc savings account</Text>
            <Text style={styles.infoLine}>• Add a monthly auto-save from your wallet (optional)</Text>
            <Text style={styles.infoLine}>• Withdraw anytime — early withdrawal may forfeit interest</Text>
          </View>
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Create Goal" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
