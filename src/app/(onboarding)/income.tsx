import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PickerField } from "@/components/PickerField/PickerField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";

/**
 * Figma "SourceOfIncome" (node 226:2078). The confirmed contract
 * (`OnboardingIncome`) still types occupation/annual_income_band as
 * free-text strings, but RESOLVED (PLAN.md "Real blockers"): the real
 * `GET /v1/onboarding/reference-data` endpoint now exposes occupation and
 * income-band lists, so this picks from that list instead of free text.
 */
export default function OnboardingIncomeScreen() {
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [occupation, setOccupation] = useState<string | null>(null);
  const [annualIncomeBand, setAnnualIncomeBand] = useState<string | null>(null);
  const [hasOtherIncome, setHasOtherIncome] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occupationOptions = (referenceData.data?.occupations ?? []).map((value) => ({ value, label: value }));
  const incomeBands = referenceData.data?.annual_income_bands ?? [];
  const incomeBandOptions = incomeBands.map((band) => ({ value: band.code, label: band.label }));
  const selectedBand = incomeBands.find((band) => band.code === annualIncomeBand) ?? null;

  const canContinue = !!occupation && !!selectedBand;

  async function handleSubmit() {
    if (!canContinue || !occupation || !selectedBand) return;
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

  return (
    <FormScreenLayout
      title="What do you do?"
      subtitle="This helps us tailor your account to you."
      errorMessage={error}
      footer={<Button label="Continue" onPress={handleSubmit} disabled={!canContinue} loading={isSubmitting} />}
    >
      <PickerField placeholder="Occupation" options={occupationOptions} selectedValue={occupation} searchable onSelect={(option) => setOccupation(option.value)} />
      <PickerField placeholder="Annual income range" options={incomeBandOptions} selectedValue={annualIncomeBand} onSelect={(option) => setAnnualIncomeBand(option.value)} />
      <Checkbox checked={hasOtherIncome} onToggle={() => setHasOtherIncome((prev) => !prev)} label="I have other sources of income" />
    </FormScreenLayout>
  );
}
