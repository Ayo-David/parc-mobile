import { useState } from "react";
import { Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { setDraftNin } from "@/features/onboarding/identityDraft";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

const NIN_PATTERN = /^[0-9]{11}$/;

/**
 * Figma "NINVerification" (node 226:1815) plus, for the first time, its
 * real failed/manual-review siblings ("Onboarding 01 — NIN Verification
 * Failed", node 439:284, missing-mobile.md §2.2). NIN is kept only in
 * local component state and never logged, matching
 * parc-interview-answers.md §13. RESOLVED (PLAN.md "Real blockers"):
 * consent_id now comes from the real `GET /v1/onboarding/reference-data`
 * endpoint. RESOLVED (MOB-23): `api.submitOnboardingIdentity` previously
 * discarded its response — it's now fully typed
 * (`OnboardingVerificationResult`, the same shape face-verification
 * uses), so this can honestly branch on the real
 * `KycVerification.status` instead of only ever showing success or a
 * generic thrown-error message.
 */
export default function OnboardingIdentityScreen() {
  const { theme } = useTheme();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [nin, setNin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"failed" | "manual_review" | null>(null);

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
    setOutcome(null);
    try {
      const result = await api.submitOnboardingIdentity({ ninValue: nin, consentId: identityConsent.id });
      switch (result.verification.status) {
        case "VERIFIED":
          setDraftNin(nin);
          await advanceOnboarding();
          return;
        case "FAILED":
          setOutcome("failed");
          return;
        case "MANUAL_REVIEW":
        case "PENDING":
          setDraftNin(nin);
          setOutcome("manual_review");
          return;
      }
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't verify that NIN. Please check the number and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (outcome === "failed") {
    return (
      <StatusScreenLayout
        icon="card-outline"
        tone="error"
        title="We couldn't verify your NIN"
        body="The details you entered don't match NIMC records. Double-check your 11-digit NIN and try again, or continue with manual review (may take up to 24 hours)."
        onBack={() => setOutcome(null)}
        footer={
          <>
            <Button label="Try again" onPress={() => setOutcome(null)} />
            <Button label="Continue with manual review" variant="ghost" onPress={() => void advanceOnboarding()} />
          </>
        }
      />
    );
  }

  if (outcome === "manual_review") {
    return (
      <StatusScreenLayout
        icon="time-outline"
        tone="warning"
        title="We're still checking"
        body="Your identity details need a closer look by our verification team. This is normal and usually takes less than 24 hours — we'll notify you the moment it's done."
        showBackButton={false}
        footer={<Button label="Continue setting up your account" onPress={() => void advanceOnboarding()} />}
      />
    );
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
