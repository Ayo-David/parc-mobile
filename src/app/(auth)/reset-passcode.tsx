import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { BackButton } from "@/components/BackButton/BackButton";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { PinPad } from "@/components/PinPad/PinPad";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
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
    header: { paddingTop: theme.spacing.md },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.components.status.success.backgroundColor,
      borderRadius: theme.radii.button,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.sm + 3,
      marginTop: theme.spacing.sm + 2,
    },
    bannerText: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.successStrong,
    },
    body: { paddingTop: theme.semanticSpacing.form + theme.spacing.xs },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.text15Regular, color: theme.colors.textMuted, marginTop: theme.spacing.sm + 2 },
    errorText: { ...theme.typography.bodySmall, color: theme.colors.error, marginTop: theme.spacing.sm },
    hintRow: { alignItems: "center", marginTop: theme.semanticSpacing.section, marginBottom: theme.semanticSpacing.form },
    hintChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.sm + 1,
    },
    hintChipText: { ...theme.typography.caption, color: theme.colors.textMuted },
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
      <ScreenContainer>
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={14} color={theme.colors.successStrong} />
          <Text style={styles.bannerText}>Identity verified. Set your new passcode.</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Set a new{"\n"}Passcode.</Text>
          <Text style={styles.subtitle}>Choose a passcode you&apos;ll remember</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.hintRow}>
            <View style={styles.hintChip}>
              <Ionicons name="shield-checkmark-outline" size={13} color={theme.colors.textMuted} />
              <Text style={styles.hintChipText}>Never share your passcode with anyone</Text>
            </View>
          </View>
          <PinPad length={PASSCODE_LENGTH} value={newPasscode} onChange={handleNewPasscodeChange} />
        </View>
      </ScreenContainer>
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
