import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingSuccessLayout } from "@/features/onboarding/OnboardingSuccessLayout";
import { useTheme } from "@/theme";

const LOGIN_METHODS = [
  { emoji: "🔢", label: "Phone or Email + Passcode" },
  { emoji: "🔐", label: "Biometric (Face ID / Fingerprint)" },
];

/**
 * Figma "PasscodeSuccess" (node 226:2324). Figma's primary action reads
 * "Go to Login", but the customer already has a live session here, so it
 * finishes onboarding without biometrics (the same call biometric-setup's
 * "Use Passcode instead" makes) and lands them in the app — labelled for
 * what it actually does. "Set up Biometric login first" continues to the
 * server's next step (BIOMETRIC).
 */
export default function PasscodeSuccessScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finishWithoutBiometrics() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.completeOnboarding({ biometricEnrolled: false });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
    },
    secondary: {
      height: theme.control.backButton,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryLabel: {
      ...theme.typography.buttonSmall,
      letterSpacing: 0,
      color: theme.colors.textMuted,
    },
  });

  return (
    <OnboardingSuccessLayout
      tone="dark"
      icon="lock-open-outline"
      title="You're all set!"
      subtitle="Your login passcode has been created."
      note="You can now login with your phone number or email + passcode, or use biometrics."
      cardTitle="You can login with"
      rows={LOGIN_METHODS}
      footer={
        <>
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <AuthButton label="Continue to Parc" onPress={finishWithoutBiometrics} loading={isSubmitting} />
          <Pressable style={styles.secondary} onPress={() => void advanceOnboarding()} disabled={isSubmitting} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>Set up Biometric login first</Text>
          </Pressable>
        </>
      }
    />
  );
}
