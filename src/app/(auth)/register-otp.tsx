import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { OtpInput } from "@/components/OtpInput/OtpInput";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { tokenStorage } from "@/auth/tokenStorage";
import { useOnboardingStepRouter } from "@/features/onboarding/navigation";
import { useSessionStore } from "@/state/stores/sessionStore";
import { useTheme } from "@/theme";

const CODE_LENGTH = 6;

/**
 * Figma "OTPVerification"/"OTPError" (nodes 226:2362/226:2412) for the
 * registration path — a single screen with an inline error state rather
 * than a separate route, since they're visually identical apart from the
 * message/border color. A dedicated multi-channel resend screen
 * (mobile-flow-map "OTP Resend Options") is deferred: no resend endpoint
 * for onboarding phone verification is documented in the auth-customer
 * contract, so wiring one now would mean guessing at an unverified API.
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

  useEffect(() => {
    if (code.length !== CODE_LENGTH || isVerifying || !bootstrap.data) {
      return;
    }
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
    resend: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <FormScreenLayout title="Enter the code we sent you" subtitle={phoneNumber ? `Sent to ${phoneNumber}` : undefined} errorMessage={error}>
      <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} hasError={!!error} disabled={isVerifying} autoFocus />
      <Text style={styles.resend}>Didn't get it? Resend isn't available yet in this build.</Text>
    </FormScreenLayout>
  );
}
