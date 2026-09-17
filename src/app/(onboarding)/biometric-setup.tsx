import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

/**
 * Figma "Biometric" (node 226:2690). Only confirms the device supports and
 * can perform a local biometric prompt, then records that on the customer
 * profile via POST /v1/onboarding/complete's `biometric_enrolled` flag — it
 * does not register a passkey/WebAuthn credential (deferred per PLAN.md
 * Part 1, "Biometric login" is a separate, not-yet-built feature).
 */
export default function BiometricSetupScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((hasHardware) => (hasHardware ? LocalAuthentication.isEnrolledAsync() : false))
      .then(setIsSupported)
      .catch(() => setIsSupported(false));
  }, []);

  async function finish(biometricEnrolled: boolean) {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.completeOnboarding({ biometricEnrolled });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEnable() {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm biometric unlock" });
    if (result.success) {
      await finish(true);
    } else {
      setError("We couldn't confirm your biometrics. You can try again or skip for now.");
    }
  }

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.section,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Set up biometric unlock</Text>
        <Text style={styles.subtitle}>{isSupported ? "Use Face ID or fingerprint to unlock Parc faster next time." : "Biometric unlock isn't available on this device."}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {isSupported ? <Button label="Enable" onPress={handleEnable} loading={isSubmitting} /> : null}
        <Button label="Skip for now" variant="ghost" onPress={() => finish(false)} disabled={isSubmitting} />
      </View>
    </ScreenContainer>
  );
}
