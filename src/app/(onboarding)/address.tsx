import { useState } from "react";
import { View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { LabeledField } from "@/components/LabeledField/LabeledField";
import { PickerField } from "@/components/PickerField/PickerField";
import { TextField } from "@/components/TextField/TextField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useTheme } from "@/theme";

/**
 * Figma "AddressVerification" (node 226:1931). The confirmed contract
 * (`OnboardingAddress`) still types state/lga as free-text strings, but
 * RESOLVED (PLAN.md "Real blockers"): the real `GET /v1/onboarding/reference-data`
 * endpoint now exposes a states/LGA list, so this submits the real names
 * picked from that list instead of arbitrary free text. Figma's "Area"
 * row is drawn as a dropdown ("Select LGA first"), but the reference data
 * has no per-LGA area list, so it stays a free-text field.
 */
export default function OnboardingAddressScreen() {
  const { theme } = useTheme();
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
    <OnboardingStepLayout
      step={5}
      title={"Where do\nyou live?"}
      subtitle="Your residential address for account verification"
      errorMessage={error}
      footerPlacement="inline"
      footer={<AuthButton label="Continue →" onPress={handleSubmit} disabled={!canContinue} loading={isSubmitting} />}
    >
      <View style={{ gap: theme.spacing.md + 2 }}>
        <LabeledField label="State">
          <PickerField
            placeholder="Select State"
            options={stateOptions}
            selectedValue={stateName}
            searchable
            onSelect={(option) => {
              setStateName(option.value);
              setLga(null);
            }}
          />
        </LabeledField>
        <LabeledField label="LGA (Local Government Area)">
          <PickerField
            placeholder={selectedState ? "Select LGA" : "Select State first"}
            options={lgaOptions}
            selectedValue={lga}
            searchable
            disabled={!selectedState}
            onSelect={(option) => setLga(option.value)}
          />
        </LabeledField>
        <LabeledField label="Area">
          <TextField value={area} onChangeText={setArea} placeholder="e.g. Lagos Island" />
        </LabeledField>
        <LabeledField label="Street Address">
          <TextField value={streetAddress} onChangeText={setStreetAddress} placeholder="10 Broad Street, Lagos Island" autoComplete="street-address" />
        </LabeledField>
        <LabeledField label="Landmark / Nearest Bus Stop (optional)" helperText="Helps verify your address accurately">
          <TextField value={landmark} onChangeText={setLandmark} placeholder="e.g. Beside First Bank" />
        </LabeledField>
      </View>
    </OnboardingStepLayout>
  );
}
