import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PinPad } from "@/components/PinPad/PinPad";
import { setDraftTransactionPin } from "@/features/security/transactionPinDraft";

const PIN_LENGTH = 4;

/**
 * Figma "Create Transaction PIN" (node 325:868). RESOLVED (PLAN.md
 * "Real blockers" MOB-06): `POST /v1/security/transaction-pin/setup` +
 * `/confirm` now exist. This is the one-time prerequisite triggered the
 * first time a customer attempts any money-movement action.
 */
export default function CreateTransactionPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      setDraftTransactionPin(pin);
      router.push("/security/transaction-pin/confirm");
    }
  }, [pin, router]);

  return (
    <FormScreenLayout headerTitle="Transaction PIN" title="Create your transaction PIN" subtitle="You'll use this 4-digit PIN to authorize transfers, bill payments, and loan actions.">
      <PinPad length={PIN_LENGTH} value={pin} onChange={setPin} />
    </FormScreenLayout>
  );
}
