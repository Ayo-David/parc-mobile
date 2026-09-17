import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PinPad } from "@/components/PinPad/PinPad";
import { setDraftPasscode } from "@/features/onboarding/passcodeDraft";

const PASSCODE_LENGTH = 6;

/** Figma "CreatePasscode" (node 226:2144) — the customer's 6-digit login passcode, distinct from the 4-digit transaction PIN. */
export default function CreatePasscodeScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (passcode.length === PASSCODE_LENGTH) {
      setDraftPasscode(passcode);
      router.push("/(onboarding)/confirm-passcode");
    }
  }, [passcode, router]);

  return (
    <FormScreenLayout title="Create your passcode" subtitle="You'll use this 6-digit passcode to log in.">
      <PinPad length={PASSCODE_LENGTH} value={passcode} onChange={setPasscode} />
    </FormScreenLayout>
  );
}
