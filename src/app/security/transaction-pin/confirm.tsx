import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PinPad } from "@/components/PinPad/PinPad";
import { consumeDraftTransactionPin } from "@/features/security/transactionPinDraft";

const PIN_LENGTH = 4;

/**
 * Figma "Confirm Transaction PIN" (node 325:916). Compares against the
 * draft PIN client-side first, then calls the two-step, anti-replay
 * `startTransactionPinSetup` -> `confirmTransactionPinSetup` sequence
 * (confirmed against the auth-customer contract: setup mints a fresh
 * `challenge_id`, confirm consumes it with the chosen PIN — no OTP step).
 */
export default function ConfirmTransactionPinScreen() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (confirmation.length !== PIN_LENGTH || isSubmitting) {
      return;
    }
    const draft = consumeDraftTransactionPin();
    if (!draft) {
      setError("Your session expired. Please start over.");
      router.replace("/security/transaction-pin/create");
      return;
    }
    if (draft !== confirmation) {
      setError("PINs didn't match. Please try again.");
      setConfirmation("");
      router.replace("/security/transaction-pin/create");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    api
      .startTransactionPinSetup()
      .then((challenge) => api.confirmTransactionPinSetup({ challengeId: challenge.challenge_id, pin: draft }))
      .then(() => router.replace("/security/transaction-pin/success"))
      .catch((submitError) => {
        setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
        setConfirmation("");
      })
      .finally(() => setIsSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmation]);

  return (
    <FormScreenLayout title="Confirm your transaction PIN" errorMessage={error}>
      <PinPad length={PIN_LENGTH} value={confirmation} onChange={setConfirmation} disabled={isSubmitting} />
    </FormScreenLayout>
  );
}
