import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { StatusBar } from "expo-status-bar";
import { type ComponentProps, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { BackButton } from "@/components/BackButton/BackButton";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { useFinishOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

type BiometricMethod = "fingerprint" | "face";

const METHOD_COPY: Record<BiometricMethod, { tab: string; title: string; subtitle: string; action: string; icon: ComponentProps<typeof Ionicons>["name"] }> = {
  fingerprint: { tab: "Fingerprint", title: "Use Fingerprint", subtitle: "Touch the sensor to sign in", action: "Touch to Scan", icon: "finger-print" },
  face: { tab: "Face ID", title: "Use Face ID", subtitle: "Look at your phone to sign in", action: "Scan Face", icon: "scan-outline" },
};

/**
 * Figma "Biometric" (node 226:2690) plus, for the first time, its real
 * failure state ("Onboarding 02 — Biometric Setup Failed", node 439:321,
 * missing-mobile.md §2.2). Only confirms the device supports and can
 * perform a local biometric prompt, then records that on the customer
 * profile via POST /v1/onboarding/complete's `biometric_enrolled` flag —
 * it does not register a passkey/WebAuthn credential (deferred per
 * PLAN.md Part 1, "Biometric login" is a separate, not-yet-built
 * feature). The Fingerprint / Face ID toggle only switches copy and is
 * limited to what the device reports via supportedAuthenticationTypesAsync
 * — the OS decides which sensor actually prompts.
 */
export default function BiometricSetupScreen() {
  const { theme } = useTheme();
  const finishOnboarding = useFinishOnboarding();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupFailed, setSetupFailed] = useState(false);
  const [supportedMethods, setSupportedMethods] = useState<BiometricMethod[]>([]);
  const [method, setMethod] = useState<BiometricMethod>("fingerprint");

  useEffect(() => {
    LocalAuthentication.supportedAuthenticationTypesAsync()
      .then((types) => {
        const methods: BiometricMethod[] = [];
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) methods.push("fingerprint");
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) methods.push("face");
        setSupportedMethods(methods);
        if (methods.length > 0) setMethod(methods[0]);
      })
      .catch(() => setSupportedMethods([]));
  }, []);

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
      await finishOnboarding(biometricEnrolled);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
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

  const media = theme.components.onMedia;
  const copy = METHOD_COPY[method];
  // RN has no radial gradient; stacked low-alpha discs approximate Figma's
  // magenta glow (226:2732), which fades to zero at 70% of its 190px
  // radius (~266px across) — densest at the centre, behind the ring.
  const GLOW_STEPS = 6;
  const glowSizes = Array.from({ length: GLOW_STEPS }, (_, index) => media.ringSize * (1.95 - (index * 0.9) / (GLOW_STEPS - 1)));

  const styles = StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.mediaBackground,
      paddingHorizontal: theme.spacing.xxl,
    },
    header: {
      paddingTop: theme.spacing.md,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentTrack: {
      flexDirection: "row",
      gap: theme.spacing.xs + 1,
      padding: media.segmentInset,
      borderRadius: theme.radii.md,
      backgroundColor: media.segmentTrack,
      marginBottom: theme.spacing.huge,
    },
    segment: {
      height: media.segmentHeight,
      paddingHorizontal: theme.spacing.lg - 1,
      borderRadius: media.segmentRadius,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentActive: {
      backgroundColor: media.segmentActive,
    },
    segmentLabel: {
      ...theme.typography.text12SemiBold,
      color: media.segmentInactiveText,
    },
    segmentLabelActive: {
      color: theme.colors.textInverse,
    },
    target: {
      width: media.ringSize,
      height: media.ringSize,
      alignItems: "center",
      justifyContent: "center",
      // Figma reserves a 176px slot for the 136px ring, then 32px before the title (226:2720).
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl + theme.spacing.xxxl,
    },
    glow: {
      position: "absolute",
      borderRadius: theme.radii.full,
      backgroundColor: media.glow,
      opacity: 1 / glowSizes.length,
    },
    ring: {
      width: media.ringSize,
      height: media.ringSize,
      borderRadius: theme.radii.full,
      borderWidth: theme.borderWidth.thin,
      borderColor: media.ringBorder,
      backgroundColor: media.ringBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...theme.typography.text19Bold,
      color: theme.colors.textInverse,
      textAlign: "center",
    },
    subtitle: {
      ...theme.typography.text14Regular,
      color: theme.colors.textInverse,
      textAlign: "center",
      marginTop: theme.spacing.xs + 3,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
    },
    footer: {
      paddingBottom: theme.semanticSpacing.component,
      gap: theme.spacing.sm + 1,
    },
    secondary: {
      height: theme.control.backButton,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryLabel: {
      ...theme.typography.buttonSmall,
      letterSpacing: 0,
      color: theme.colors.textInverse,
    },
  });

  return (
    <ScreenContainer style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <BackButton tone="onMedia" />
      </View>
      <View style={styles.content}>
        <View style={styles.segmentTrack} accessibilityRole="tablist">
          {(["fingerprint", "face"] as const).map((option) => {
            const isActive = option === method;
            const isAvailable = supportedMethods.includes(option);
            return (
              <Pressable
                key={option}
                style={[styles.segment, isActive && styles.segmentActive]}
                onPress={() => setMethod(option)}
                disabled={!isAvailable || isSubmitting}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive, disabled: !isAvailable }}
              >
                <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>{METHOD_COPY[option].tab}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.target}>
          {glowSizes.map((size) => (
            <View key={size} style={[styles.glow, { width: size, height: size }]} />
          ))}
          <View style={styles.ring}>
            <Ionicons name={copy.icon} size={media.ringIconSize} color={media.ringIcon} />
          </View>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AuthButton variant="onMedia" label={copy.action} onPress={handleEnable} loading={isSubmitting} disabled={isSupported !== true} />
        <Pressable style={styles.secondary} onPress={() => finish(false)} disabled={isSubmitting} accessibilityRole="button">
          <Text style={styles.secondaryLabel}>Use Passcode instead</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
