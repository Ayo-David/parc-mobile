import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useResetOnboardingStack } from "@/features/onboarding/navigation";
import { OnboardingPasscodeLayout } from "@/features/onboarding/OnboardingPasscodeLayout";
import { consumeDraftPasscode } from "@/features/onboarding/passcodeDraft";

const PASSCODE_LENGTH = 6;

/**
 * Figma "ConfirmPasscode" (node 226:2234). Compares against the draft
 * passcode client-side first (fail fast, no network round-trip for a
 * mismatch) before calling PUT /v1/onboarding/login-passcode with both
 * values, per the confirmed `LoginPasscodeSetup` contract.
 */
export default function ConfirmPasscodeScreen() {
  const resetTo = useResetOnboardingStack();
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    setConfirmation(next);
    if (next.length !== PASSCODE_LENGTH || isSubmitting) {
      return;
    }
    const draft = consumeDraftPasscode();
    if (!draft) {
      resetTo({ pathname: "/(onboarding)/create-passcode", params: { reason: "expired" } });
      return;
    }
    if (draft !== next) {
      setConfirmation("");
      resetTo({ pathname: "/(onboarding)/create-passcode", params: { reason: "mismatch" } });
      return;
    }
    setIsSubmitting(true);
    setError(null);
    api
      .setOnboardingLoginPasscode({ passcode: draft, passcodeConfirmation: next })
      .then(() => resetTo("/(onboarding)/passcode-success"))
      .catch((submitError) => {
        setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
        setConfirmation("");
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <OnboardingPasscodeLayout
      rightLabel="Confirm"
      title={"Confirm your\nPasscode."}
      subtitle="Enter the same passcode again"
      length={PASSCODE_LENGTH}
      value={confirmation}
      onChange={handleChange}
      disabled={isSubmitting}
      errorMessage={error}
      statusMessage={isSubmitting ? "Saving your passcode…" : null}
    />
  );
}
