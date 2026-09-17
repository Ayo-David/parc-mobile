import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const LOCAL_NUMBER_PATTERN = /^[789][01][0-9]{8}$/;

/**
 * Figma node 322:263 — the canonical Phone Verification screen (with
 * referral code + ToS checkbox + "Login" link), chosen over the older
 * plain variant (226:1652) because it matches the confirmed backend
 * registration contract (phone_number, consent_ids, referral_code).
 * RESOLVED (PLAN.md "Real blockers"): consent_ids now come from the real
 * public `GET /v1/onboarding/reference-data` endpoint, not a dev-only
 * placeholder.
 */
export default function RegisterPhoneScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const [localNumber, setLocalNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidNumber = LOCAL_NUMBER_PATTERN.test(localNumber);
  const allConsents = referenceData.data?.consent_documents ?? [];
  const flaggedConsents = allConsents.filter((doc) => doc.required_at_registration === true);
  // Falls back to every listed consent document only if none are explicitly
  // flagged for registration — avoids hard-blocking signup on a tenant that
  // hasn't populated the flag yet, without guessing which ones matter.
  const registrationConsents = flaggedConsents.length > 0 ? flaggedConsents : allConsents;
  const canContinue = isValidNumber && agreedToTerms && registrationConsents.length > 0 && !!bootstrap.data;

  async function handleContinue() {
    if (!canContinue || !bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const phoneNumber = `+234${localNumber}`;
      const result = await api.startOnboarding({
        tenantId: bootstrap.data.tenant_id,
        phoneNumber,
        consentIds: registrationConsents.map((doc) => doc.id),
        referralCode: referralCode.trim() || undefined,
        idempotencyKey: createIdempotencyKey(),
      });
      router.push({
        pathname: "/(auth)/register-otp",
        params: { onboardingId: result.onboarding_id, challengeId: result.phone_challenge.challenge_id, phoneNumber },
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    prefix: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
      height: theme.control.input,
      textAlignVertical: "center",
    },
    phoneField: {
      flex: 1,
    },
  });

  return (
    <FormScreenLayout title="What's your phone number?" subtitle="We'll send you a one-time code to verify it." errorMessage={error}>
      <View style={styles.phoneRow}>
        <Text style={styles.prefix}>+234</Text>
        <View style={styles.phoneField}>
          <TextField value={localNumber} onChangeText={setLocalNumber} placeholder="8012345678" keyboardType="number-pad" maxLength={10} autoFocus />
        </View>
      </View>
      <TextField value={referralCode} onChangeText={setReferralCode} placeholder="Referral code (optional)" autoCapitalize="characters" />
      <Checkbox checked={agreedToTerms} onToggle={() => setAgreedToTerms((prev) => !prev)} label="I agree to the Terms of Service and Privacy Policy" />
      <Button label="Send Verification Code" onPress={handleContinue} disabled={!canContinue} loading={isSubmitting} />
    </FormScreenLayout>
  );
}
