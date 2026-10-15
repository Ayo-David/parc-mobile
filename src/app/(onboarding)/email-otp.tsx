import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { OtpResendSheet } from "@/components/OtpResendSheet/OtpResendSheet";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Figma "EmailOTP" (node 226:1765), including its "Misc 02 — OTP Resend
 * Channel Selection" affordance (node 439:481, missing-mobile.md §2.2).
 * No challenge_id is returned by PUT /v1/onboarding/email per the
 * documented contract, so this expects one via route params from the
 * email screen; otherwise verification fails server-side with a clear
 * ApiError rather than the client guessing an ID. The countdown's
 * "Resend code" opens the same honest-disclosure sheet register-otp uses
 * — no resend endpoint exists. "Change it" goes back to the email screen.
 */
export default function OnboardingEmailOtpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { challengeId, email } = useLocalSearchParams<{ challengeId?: string; email?: string }>();
  const advanceOnboarding = useAdvanceOnboarding();
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

  function verify(enteredCode: string) {
    if (enteredCode.length !== CODE_LENGTH || isVerifying) {
      return;
    }
    if (!challengeId) {
      setError("Missing verification challenge. Please go back and try again.");
      setCode("");
      return;
    }
    setIsVerifying(true);
    setError(null);
    api
      .verifyOnboardingEmail({ challengeId, code: enteredCode })
      .then(() => advanceOnboarding())
      .catch((verifyError) => {
        setError(verifyError instanceof ApiError ? verifyError.message : "That code didn't work. Please try again.");
        setCode("");
      })
      .finally(() => setIsVerifying(false));
  }

  function handleCodeChange(next: string) {
    setCode(next);
    verify(next);
  }

  const styles = StyleSheet.create({
    subtitleEmail: {
      color: theme.colors.textPrimary,
    },
    otpRow: {
      alignItems: "center",
    },
    countdownRow: {
      alignItems: "center",
      marginTop: theme.spacing.xl,
    },
    countdownText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    countdownFigure: {
      ...theme.typography.text14BoldFigure,
      color: theme.colors.textPrimary,
    },
    resendLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
    helpText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    helpLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.textPrimary,
    },
  });

  return (
    <OnboardingStepLayout
      step={2}
      title={"Check your\ninbox."}
      subtitle={
        email ? (
          <>
            6-digit code sent to <Text style={styles.subtitleEmail}>{email}</Text>
          </>
        ) : (
          "Enter the 6-digit code we emailed you"
        )
      }
      errorMessage={error}
      footer={
        <>
          <AuthButton label="Verify Email" onPress={() => verify(code)} disabled={code.length !== CODE_LENGTH} loading={isVerifying} />
          <Text style={styles.helpText}>
            Wrong email?{" "}
            <Text style={styles.helpLink} onPress={() => router.back()} accessibilityRole="link">
              Change it
            </Text>
          </Text>
        </>
      }
    >
      <View style={styles.otpRow}>
        <OtpInput length={CODE_LENGTH} value={code} onChange={handleCodeChange} hasError={!!error} disabled={isVerifying} autoFocus />
      </View>
      <View style={styles.countdownRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.countdownText}>
            Resend in <Text style={styles.countdownFigure}>{formatCountdown(secondsLeft)}</Text>
          </Text>
        ) : (
          <Pressable onPress={() => setIsResendSheetVisible(true)} accessibilityRole="button">
            <Text style={styles.resendLink}>Resend code</Text>
          </Pressable>
        )}
      </View>
      <OtpResendSheet visible={isResendSheetVisible} onClose={() => setIsResendSheetVisible(false)} />
    </OnboardingStepLayout>
  );
}
