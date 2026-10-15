import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { OnboardingPasscodeLayout } from "@/features/onboarding/OnboardingPasscodeLayout";
import { setDraftPasscode } from "@/features/onboarding/passcodeDraft";

const PASSCODE_LENGTH = 6;

/**
 * Figma "CreatePasscode" (node 226:2144) — the customer's 6-digit login
 * passcode, distinct from the 4-digit transaction PIN. Confirm-passcode
 * sends the customer back here with `reason` when the two entries don't
 * match (or the draft expired), so the reset isn't silent.
 */
export default function CreatePasscodeScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: "mismatch" | "expired" }>();
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (passcode.length === PASSCODE_LENGTH) {
      setDraftPasscode(passcode);
      router.push("/(onboarding)/confirm-passcode");
    }
  }, [passcode, router]);

  const errorMessage =
    passcode.length === 0 && reason === "mismatch"
      ? "Passcodes didn't match. Please try again."
      : passcode.length === 0 && reason === "expired"
        ? "Your session expired. Please start over."
        : null;

  return (
    <OnboardingPasscodeLayout
      rightLabel="Final step"
      title={"Set your login\nPasscode."}
      subtitle="You'll use this to sign in to Parc"
      length={PASSCODE_LENGTH}
      value={passcode}
      onChange={setPasscode}
      errorMessage={errorMessage}
    />
  );
}
