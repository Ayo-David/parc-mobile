import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { OtpResendSheet } from "@/components/OtpResendSheet/OtpResendSheet";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;

/**
 * Figma "EmailOTP" (node 226:1765), now including its real "Misc 02 — OTP
 * Resend Channel Selection" affordance (node 439:481, missing-mobile.md
 * §2.2) — previously this screen had no resend link at all. No
 * challenge_id is returned by PUT /v1/onboarding/email per the documented
 * contract, so this expects one via route params if the app passed it
 * through from the email screen; otherwise verification will fail
 * server-side with a clear ApiError rather than the client guessing an ID.
 */
export default function OnboardingEmailOtpScreen() {
  const { theme } = useTheme();
  const { challengeId } = useLocalSearchParams<{ challengeId?: string }>();
  const advanceOnboarding = useAdvanceOnboarding();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResendSheetVisible, setIsResendSheetVisible] = useState(false);

  useEffect(() => {
    if (code.length !== CODE_LENGTH || isVerifying) {
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
      .verifyOnboardingEmail({ challengeId, code })
      .then(() => advanceOnboarding())
      .catch((verifyError) => {
        setError(verifyError instanceof ApiError ? verifyError.message : "That code didn't work. Please try again.");
        setCode("");
      })
      .finally(() => setIsVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const styles = StyleSheet.create({
    resend: { ...theme.typography.bodySmall, color: theme.colors.secondary, textAlign: "center" },
  });

  return (
    <FormScreenLayout title="Enter the code we emailed you" errorMessage={error}>
      <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} hasError={!!error} disabled={isVerifying} autoFocus />
      <Pressable onPress={() => setIsResendSheetVisible(true)}>
        <Text style={styles.resend}>Didn&apos;t get it?</Text>
      </Pressable>
      <OtpResendSheet visible={isResendSheetVisible} onClose={() => setIsResendSheetVisible(false)} />
    </FormScreenLayout>
  );
}
