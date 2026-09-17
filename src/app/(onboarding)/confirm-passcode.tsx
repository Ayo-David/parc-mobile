import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PinPad } from "@/components/PinPad/PinPad";
import { consumeDraftPasscode } from "@/features/onboarding/passcodeDraft";

const PASSCODE_LENGTH = 6;

/**
 * Figma "ConfirmPasscode" (node 226:2234). Compares against the draft
 * passcode client-side first (fail fast, no network round-trip for a
 * mismatch) before calling PUT /v1/onboarding/login-passcode with both
 * values, per the confirmed `LoginPasscodeSetup` contract.
 */
export default function ConfirmPasscodeScreen() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (confirmation.length !== PASSCODE_LENGTH || isSubmitting) {
      return;
    }
    const draft = consumeDraftPasscode();
    if (!draft) {
      setError("Your session expired. Please start over.");
      router.replace("/(onboarding)/create-passcode");
      return;
    }
    if (draft !== confirmation) {
      setError("Passcodes didn't match. Please try again.");
      setConfirmation("");
      router.replace("/(onboarding)/create-passcode");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    api
      .setOnboardingLoginPasscode({ passcode: draft, passcodeConfirmation: confirmation })
      .then(() => router.replace("/(onboarding)/passcode-success"))
      .catch((submitError) => {
        setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
        setConfirmation("");
      })
      .finally(() => setIsSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmation]);

  return (
    <FormScreenLayout title="Confirm your passcode" errorMessage={error}>
      <PinPad length={PASSCODE_LENGTH} value={confirmation} onChange={setConfirmation} disabled={isSubmitting} />
    </FormScreenLayout>
  );
}
