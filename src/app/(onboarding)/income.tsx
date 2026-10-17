import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { LabeledField } from "@/components/LabeledField/LabeledField";
import { OptionCard } from "@/components/OptionCard/OptionCard";
import { PickerField } from "@/components/PickerField/PickerField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useTheme } from "@/theme";

const OTHER_INCOME_CHOICES = [
  { value: true, label: "Yes, I do", description: "e.g. a side business, rent or investments" },
  { value: false, label: "No, I don't", description: "My occupation is my only income" },
];

/**
 * Figma "SourceOfIncome" (node 226:2078). The confirmed contract
 * (`OnboardingIncome`) still types occupation/annual_income_band as
 * free-text strings, but RESOLVED (PLAN.md "Real blockers"): the real
 * `GET /v1/onboarding/reference-data` endpoint now exposes occupation and
 * income-band lists, so this picks from that list instead of free text.
 * Figma shows neither "other income" answer pre-selected, so the customer
 * must pick one rather than the app defaulting to "No".
 */
export default function OnboardingIncomeScreen() {
  const { theme } = useTheme();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [occupation, setOccupation] = useState<string | null>(null);
  const [annualIncomeBand, setAnnualIncomeBand] = useState<string | null>(null);
  const [hasOtherIncome, setHasOtherIncome] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occupationOptions = (referenceData.data?.occupations ?? []).map((value) => ({ value, label: value }));
  const incomeBands = referenceData.data?.annual_income_bands ?? [];
  const incomeBandOptions = incomeBands.map((band) => ({ value: band.code, label: band.label }));
  const selectedBand = incomeBands.find((band) => band.code === annualIncomeBand) ?? null;

  const canContinue = !!occupation && !!selectedBand && hasOtherIncome !== null;

  async function handleSubmit() {
    if (!canContinue || !occupation || !selectedBand || hasOtherIncome === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingIncome({ occupation, annualIncomeBand: selectedBand.label, hasOtherIncome });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    fields: {
      gap: theme.spacing.md + 2,
    },
    choices: {
      gap: theme.semanticSpacing.authActions,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <OnboardingStepLayout
      icon="briefcase-outline"
      title={"Tell us about\nyour income."}
      subtitle="This helps us offer you the right financial products"
      errorMessage={error}
      footer={<AuthButton label="Almost there →" onPress={handleSubmit} disabled={!canContinue} loading={isSubmitting} />}
    >
      <View style={styles.fields}>
        <LabeledField label="What's your occupation?">
          <PickerField placeholder="Select occupation" options={occupationOptions} selectedValue={occupation} searchable onSelect={(option) => setOccupation(option.value)} />
        </LabeledField>
        <LabeledField label="What's your annual income?">
          <PickerField placeholder="Select income range" options={incomeBandOptions} selectedValue={annualIncomeBand} onSelect={(option) => setAnnualIncomeBand(option.value)} />
        </LabeledField>
        <LabeledField label="Do you have other sources of income?">
          <View style={styles.choices} accessibilityRole="radiogroup">
            {OTHER_INCOME_CHOICES.map((choice) => (
              <OptionCard
                key={choice.label}
                title={choice.label}
                description={choice.description}
                selected={hasOtherIncome === choice.value}
                onPress={() => setHasOtherIncome(choice.value)}
                disabled={isSubmitting}
              />
            ))}
          </View>
        </LabeledField>
      </View>
    </OnboardingStepLayout>
  );
}
