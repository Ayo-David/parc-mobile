import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PickerField } from "@/components/PickerField/PickerField";
import { TextField } from "@/components/TextField/TextField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";

/**
 * Figma "AddressVerification" (node 226:1931). The confirmed contract
 * (`OnboardingAddress`) still types state/lga as free-text strings, but
 * RESOLVED (PLAN.md "Real blockers"): the real `GET /v1/onboarding/reference-data`
 * endpoint now exposes a states/LGA list, so this submits the real names
 * picked from that list instead of arbitrary free text.
 */
export default function OnboardingAddressScreen() {
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [stateName, setStateName] = useState<string | null>(null);
  const [lga, setLga] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const states = referenceData.data?.states ?? [];
  const stateOptions = states.map((entry) => ({ value: entry.code, label: entry.name }));
  const selectedState = states.find((entry) => entry.code === stateName) ?? null;
  const lgaOptions = (selectedState?.lgas ?? []).map((lgaName) => ({ value: lgaName, label: lgaName }));

  const canContinue = !!stateName && !!lga && area.trim().length >= 1 && streetAddress.trim().length >= 3;

  async function handleSubmit() {
    if (!canContinue || !selectedState || !lga) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingAddress({ state: selectedState.name, lga, area: area.trim(), streetAddress: streetAddress.trim(), landmark: landmark.trim() || undefined });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreenLayout
      title="What's your address?"
      subtitle="We use this to verify your account."
      errorMessage={error}
      footer={<Button label="Continue" onPress={handleSubmit} disabled={!canContinue} loading={isSubmitting} />}
    >
      <PickerField
        placeholder="State"
        options={stateOptions}
        selectedValue={stateName}
        searchable
        onSelect={(option) => {
          setStateName(option.value);
          setLga(null);
        }}
      />
      <PickerField placeholder="LGA" options={lgaOptions} selectedValue={lga} searchable disabled={!selectedState} onSelect={(option) => setLga(option.value)} />
      <TextField value={area} onChangeText={setArea} placeholder="Area" />
      <TextField value={streetAddress} onChangeText={setStreetAddress} placeholder="Street address" />
      <TextField value={landmark} onChangeText={setLandmark} placeholder="Landmark (optional)" />
    </FormScreenLayout>
  );
}
