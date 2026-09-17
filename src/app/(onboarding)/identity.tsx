import { useState } from "react";
import { Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

const NIN_PATTERN = /^[0-9]{11}$/;

/**
 * Figma "NINVerification" (node 226:1815). NIN is kept only in local
 * component state and never logged, matching parc-interview-answers.md §13.
 * RESOLVED (PLAN.md "Real blockers"): consent_id now comes from the real
 * `GET /v1/onboarding/reference-data` endpoint. No `consent_type` value is
 * documented specifically for identity verification, so this prefers a
 * document whose type mentions identity/NIN/KYC and falls back to the
 * first listed document.
 */
export default function OnboardingIdentityScreen() {
  const { theme } = useTheme();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [nin, setNin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = NIN_PATTERN.test(nin);
  const consentDocuments = referenceData.data?.consent_documents ?? [];
  const identityConsent = consentDocuments.find((doc) => /identity|nin|kyc/i.test(doc.consent_type)) ?? consentDocuments[0];

  async function handleSubmit() {
    if (!identityConsent) {
      setError("No consent document is configured for this tenant.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingIdentity({ ninValue: nin, consentId: identityConsent.id });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't verify that NIN. Please check the number and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreenLayout
      title="Verify your identity"
      subtitle="Enter your 11-digit National Identification Number (NIN)."
      errorMessage={error}
      footer={<Button label="Continue" onPress={handleSubmit} disabled={!isValid} loading={isSubmitting} />}
    >
      <TextField value={nin} onChangeText={setNin} placeholder="12345678901" keyboardType="number-pad" maxLength={11} autoFocus />
      <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted }}>Dial *346# on your registered line if you don't know your NIN.</Text>
    </FormScreenLayout>
  );
}
