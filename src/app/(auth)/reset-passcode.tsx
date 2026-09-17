import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { PinPad } from "@/components/PinPad/PinPad";
import { Button } from "@/components/Button/Button";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;
const PASSCODE_LENGTH = 6;

type Step = "code" | "new-passcode" | "confirm-passcode";

/**
 * Figma "Reset Passcode" recovery-loop step. RESOLVED (PLAN.md "Real
 * blockers"): `POST /v1/auth/passcode/recovery/confirm` now exists —
 * takes the recovery code and both new-passcode values together, so this
 * collects all three before submitting once.
 */
export default function ResetPasscodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identifier, challengeId } = useLocalSearchParams<{ identifier: string; challengeId: string }>();
  const bootstrap = useBootstrap();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCodeChange(value: string) {
    setCode(value);
    setError(null);
    if (value.length === CODE_LENGTH) {
      setStep("new-passcode");
    }
  }

  function handleNewPasscodeChange(value: string) {
    setNewPasscode(value);
    if (value.length === PASSCODE_LENGTH) {
      setStep("confirm-passcode");
    }
  }

  async function handleConfirmPasscodeChange(value: string) {
    setConfirmPasscode(value);
    if (value.length !== PASSCODE_LENGTH || isSubmitting) return;
    if (value !== newPasscode) {
      setError("Passcodes didn't match. Please try again.");
      setNewPasscode("");
      setConfirmPasscode("");
      setStep("new-passcode");
      return;
    }
    if (!bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.confirmPasscodeRecovery({
        tenantId: bootstrap.data.tenant_id,
        challengeId,
        code,
        newPasscode,
        newPasscodeConfirmation: value,
        idempotencyKey: createIdempotencyKey(),
      });
      router.replace({ pathname: "/(auth)/passcode", params: { identifier } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "That code didn't work. Please try again.");
      setCode("");
      setNewPasscode("");
      setConfirmPasscode("");
      setStep("code");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    hint: { ...theme.typography.bodySmall, color: theme.colors.textMuted, textAlign: "center" },
  });

  if (step === "code") {
    return (
      <FormScreenLayout title="Enter the recovery code" subtitle={identifier ? `Sent to ${identifier}` : undefined} errorMessage={error}>
        <OtpInput length={CODE_LENGTH} value={code} onChange={handleCodeChange} hasError={!!error} autoFocus />
      </FormScreenLayout>
    );
  }

  if (step === "new-passcode") {
    return (
      <FormScreenLayout title="Create a new passcode" errorMessage={error}>
        <PinPad length={PASSCODE_LENGTH} value={newPasscode} onChange={handleNewPasscodeChange} />
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="Confirm your new passcode"
      errorMessage={error}
      footer={
        <Button
          label="Back"
          variant="secondary"
          onPress={() => {
            setConfirmPasscode("");
            setStep("new-passcode");
          }}
          disabled={isSubmitting}
        />
      }
    >
      <PinPad length={PASSCODE_LENGTH} value={confirmPasscode} onChange={handleConfirmPasscodeChange} disabled={isSubmitting} />
      {isSubmitting ? <Text style={styles.hint}>Resetting your passcode…</Text> : null}
    </FormScreenLayout>
  );
}
