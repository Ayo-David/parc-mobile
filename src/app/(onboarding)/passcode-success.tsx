import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { useAdvanceOnboarding, useFinishOnboarding } from "@/features/onboarding/navigation";
import { OnboardingSuccessLayout, type SuccessCardRow } from "@/features/onboarding/OnboardingSuccessLayout";
import { useTheme } from "@/theme";

const LOGIN_METHODS: SuccessCardRow[] = [
  { icon: "keypad-outline", label: "Phone or Email + Passcode" },
  { icon: "finger-print-outline", label: "Biometric (Face ID / Fingerprint)" },
];

/**
 * Figma "PasscodeSuccess" (node 226:2324). "Go to Login" finishes
 * onboarding without biometrics and signs the onboarding session out, so
 * the customer lands on Login and signs in with the passcode they just
 * set. "Set up Biometric login first" continues to the server's next step
 * (BIOMETRIC).
 */
export default function PasscodeSuccessScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const finishOnboarding = useFinishOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await finishOnboarding(false);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function setUpBiometrics() {
    setIsSubmitting(true);
    setError(null);
    try {
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
          <AuthButton label="Go to Login" onPress={goToLogin} loading={isSubmitting} />
          <Pressable style={styles.secondary} onPress={setUpBiometrics} disabled={isSubmitting} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>Set up Biometric login first</Text>
          </Pressable>
        </>
      }
    />
  );
}
