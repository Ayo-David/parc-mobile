import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { OtpResendSheet } from "@/components/OtpResendSheet/OtpResendSheet";
import { tokenStorage } from "@/auth/tokenStorage";
import { onboardingStepHref } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useSessionStore } from "@/state/stores/sessionStore";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

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
 * message/border color. Verification runs only when the customer taps
 * "Verify", never on the sixth digit. "Misc 02 — OTP Resend Channel
 * Selection" (node 439:481, missing-mobile.md §2.2) is real UI
 * (`OtpResendSheet`), but every channel it offers honestly discloses that
 * no resend endpoint of any kind is documented anywhere in the
 * auth-customer contract. Figma shows both a "Resend in 0:28" countdown and
 * a separate "No code? Get help" link — both open the same
 * honest-disclosure sheet rather than inventing two different fake resend
 * mechanisms.
 */
export default function RegisterOtpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { onboardingId, challengeId, phoneNumber } = useLocalSearchParams<{ onboardingId: string; challengeId: string; phoneNumber: string }>();
  const bootstrap = useBootstrap();
  const setSession = useSessionStore((state) => state.setSession);
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

  async function verify() {
    if (code.length !== CODE_LENGTH || isVerifying || !bootstrap.data) {
      return;
    }
    const tenantId = bootstrap.data.tenant_id;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await api.verifyOnboardingPhone({ tenantId, onboardingId, challengeId, code, idempotencyKey: createIdempotencyKey() });
      if ("mfa_required" in result.tokens) {
        setError("This account requires an additional verification step that isn't supported yet.");
        setCode("");
        return;
      }
      const stored = { accessToken: result.tokens.access_token, refreshToken: result.tokens.refresh_token, tenantId };
      await tokenStorage.save(stored);
      setSession(stored);
      // The response includes onboarding state directly — route straight
      // from it instead of a separate status refetch.
      router.replace(onboardingStepHref(result.onboarding.current_step));
    } catch (verifyError) {
      setError(verifyError instanceof ApiError ? verifyError.message : "That code didn't work. Please try again.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  const styles = StyleSheet.create({
    subtitlePhone: {
      color: theme.colors.textPrimary,
    },
    countdownRow: {
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    countdownText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    countdownFigure: {
      ...theme.typography.text14BoldFigure,
      color: theme.colors.textPrimary,
    },
    helpText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    helpLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
  });

  return (
    <OnboardingStepLayout
      step={1}
      title={"Enter the code\nwe sent you."}
      subtitle={
        <>
          6-digit code to <Text style={styles.subtitlePhone}>{phoneNumber}</Text>
        </>
      }
      errorMessage={error}
      footer={
        <>
          <AuthButton label="Verify →" onPress={verify} disabled={code.length !== CODE_LENGTH} loading={isVerifying} />
          <Text style={styles.helpText}>
            No code?{" "}
            <Text style={styles.helpLink} onPress={() => setIsResendSheetVisible(true)} accessibilityRole="link">
              Get help
            </Text>
          </Text>
        </>
      }
    >
      <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} hasError={!!error} disabled={isVerifying} autoFocus />
      <View style={styles.countdownRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.countdownText}>
            Resend in <Text style={styles.countdownFigure}>{formatCountdown(secondsLeft)}</Text>
          </Text>
        ) : (
          <Pressable onPress={() => setIsResendSheetVisible(true)} accessibilityRole="button">
            <Text style={styles.helpLink}>Resend code</Text>
          </Pressable>
        )}
      </View>
      <OtpResendSheet visible={isResendSheetVisible} onClose={() => setIsResendSheetVisible(false)} maskedDestination={phoneNumber ? maskPhoneNumber(phoneNumber) : undefined} />
    </OnboardingStepLayout>
  );
}
