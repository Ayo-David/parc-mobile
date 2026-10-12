import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { BackButton } from "@/components/BackButton/BackButton";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { OtpResendSheet } from "@/components/OtpResendSheet/OtpResendSheet";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StepDots } from "@/components/StepDots/StepDots";
import { tokenStorage } from "@/auth/tokenStorage";
import { useOnboardingStepRouter } from "@/features/onboarding/navigation";
import { useSessionStore } from "@/state/stores/sessionStore";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const SIGNUP_STEP_COUNT = 7;

/** e.g. "+2348012345678" -> "0801•••••78" — never logs or displays the full number. */
function maskPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/^\+234/, "0");
  if (digits.length < 6) return digits;
  return `${digits.slice(0, 4)}•••••${digits.slice(-2)}`;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Figma "OTPVerification"/"OTPError" (nodes 226:2362/226:2412) for the
 * registration path — a single screen with an inline error state rather
 * than a separate route, since they're visually identical apart from the
 * message/border color. "Misc 02 — OTP Resend Channel Selection" (node
 * 439:481, missing-mobile.md §2.2) is now real UI (`OtpResendSheet`), but
 * every channel it offers honestly discloses that no resend endpoint of
 * any kind is documented anywhere in the auth-customer contract. Figma
 * shows both a "Resend in 0:28" countdown and a separate "No code? Get
 * help" link — both open the same honest-disclosure sheet rather than
 * inventing two different fake resend mechanisms.
 */
export default function RegisterOtpScreen() {
  const { theme } = useTheme();
  const { onboardingId, challengeId, phoneNumber } = useLocalSearchParams<{ onboardingId: string; challengeId: string; phoneNumber: string }>();
  const bootstrap = useBootstrap();
  const setSession = useSessionStore((state) => state.setSession);
  const goToStep = useOnboardingStepRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResendSheetVisible, setIsResendSheetVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (code.length !== CODE_LENGTH || isVerifying || !bootstrap.data) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing verification-kickoff pattern, unrelated to this pass's styling changes
    setIsVerifying(true);
    setError(null);
    api
      .verifyOnboardingPhone({ tenantId: bootstrap.data.tenant_id, onboardingId, challengeId, code, idempotencyKey: createIdempotencyKey() })
      .then(async (result) => {
        if ("mfa_required" in result.tokens) {
          setError("This account requires an additional verification step that isn't supported yet.");
          setCode("");
          return;
        }
        const stored = { accessToken: result.tokens.access_token, refreshToken: result.tokens.refresh_token, tenantId: bootstrap.data!.tenant_id };
        await tokenStorage.save(stored);
        setSession(stored);
        // The response now includes onboarding state directly (previously
        // undocumented) — route straight from it instead of a separate
        // status refetch.
        goToStep(result.onboarding.current_step);
      })
      .catch((verifyError) => {
        setError(verifyError instanceof ApiError ? verifyError.message : "That code didn't work. Please try again.");
        setCode("");
      })
      .finally(() => setIsVerifying(false));
    // Only the entered code should retrigger verification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.spacing.md,
    },
    body: {
      paddingTop: theme.semanticSpacing.card,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm + 2,
    },
    subtitleBold: {
      ...theme.typography.text15Regular,
      fontFamily: theme.typography.text14Bold.fontFamily,
      color: theme.colors.textPrimary,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
    },
    otpRow: {
      marginTop: theme.semanticSpacing.form + theme.spacing.xs,
    },
    countdownRow: {
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    countdownText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    footer: {
      paddingTop: theme.spacing.xxxl,
      paddingBottom: theme.semanticSpacing.section,
      gap: theme.spacing.md,
    },
    authButton: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: code.length === CODE_LENGTH ? theme.colors.primary : theme.colors.border,
    },
    authButtonLabel: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
    helpRow: {
      alignItems: "center",
    },
    helpText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    helpLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BackButton />
        <StepDots total={SIGNUP_STEP_COUNT} current={1} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Enter the code{"\n"}we sent you.</Text>
        <Text style={styles.subtitle}>
          6-digit code to <Text style={styles.subtitleBold}>{phoneNumber}</Text>
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.otpRow}>
          <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} hasError={!!error} disabled={isVerifying} autoFocus />
        </View>
        <View style={styles.countdownRow}>
          {secondsLeft > 0 ? (
            <Text style={styles.countdownText}>
              Resend in <Text style={[styles.countdownText, { fontFamily: theme.typography.text14BoldMono.fontFamily, color: theme.colors.textPrimary }]}>{formatCountdown(secondsLeft)}</Text>
            </Text>
          ) : (
            <Pressable onPress={() => setIsResendSheetVisible(true)}>
              <Text style={styles.helpLink}>Resend code</Text>
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.authButton} disabled={code.length !== CODE_LENGTH || isVerifying} accessibilityRole="button">
          <Text style={styles.authButtonLabel}>{isVerifying ? "Verifying…" : "Verify →"}</Text>
        </Pressable>
        <View style={styles.helpRow}>
          <Text style={styles.helpText}>
            No code?{" "}
            <Text style={styles.helpLink} onPress={() => setIsResendSheetVisible(true)}>
              Get help
            </Text>
          </Text>
        </View>
      </View>
      <OtpResendSheet visible={isResendSheetVisible} onClose={() => setIsResendSheetVisible(false)} maskedDestination={phoneNumber ? maskPhoneNumber(phoneNumber) : undefined} />
    </ScreenContainer>
  );
}
