import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

/**
 * Figma "Biometric" (node 226:2690) plus, for the first time, its real
 * failure state ("Onboarding 02 — Biometric Setup Failed", node 439:321,
 * missing-mobile.md §2.2). Only confirms the device supports and can
 * perform a local biometric prompt, then records that on the customer
 * profile via POST /v1/onboarding/complete's `biometric_enrolled` flag —
 * it does not register a passkey/WebAuthn credential (deferred per
 * PLAN.md Part 1, "Biometric login" is a separate, not-yet-built
 * feature).
 */
export default function BiometricSetupScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupFailed, setSetupFailed] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((hasHardware) => (hasHardware ? LocalAuthentication.isEnrolledAsync() : false))
      .then((supported) => {
        setIsSupported(supported);
        if (!supported) setSetupFailed(true);
      })
      .catch(() => {
        setIsSupported(false);
        setSetupFailed(true);
      });
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
      setSetupFailed(true);
    }
  }

  if (setupFailed) {
    return (
      <StatusScreenLayout
        icon="person-outline"
        tone="error"
        title="Biometric setup didn't work"
        body="We couldn't enable Face ID / fingerprint login for Parc. This might be a device setting — you can still use your passcode to sign in, and try enabling biometrics later from Security settings."
        showBackButton={false}
        footer={
          <>
            {isSupported ? <Button label="Try again" onPress={() => setSetupFailed(false)} loading={isSubmitting} /> : null}
            <Button label="Continue with passcode instead" variant="ghost" onPress={() => finish(false)} disabled={isSubmitting} />
          </>
        }
      />
    );
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
