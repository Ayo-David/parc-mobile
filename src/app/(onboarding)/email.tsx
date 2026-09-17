import { useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma "EmailVerification" (node 226:1717) — optional. RESOLVED: the
 * response is now typed (`OnboardingEmailResult`), so the challenge_id no
 * longer needs to be probed. The server's `current_step` still doesn't
 * distinguish "email set" from "email verified," so this still navigates
 * directly to the OTP screen client-side rather than refetching status.
 */
export default function OnboardingEmailScreen() {
  const router = useRouter();
  const advanceOnboarding = useAdvanceOnboarding();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = EMAIL_PATTERN.test(email);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.setOnboardingEmail({ email });
      if (result.email_challenge) {
        router.push({ pathname: "/(onboarding)/email-otp", params: { challengeId: result.email_challenge.challenge_id } });
      } else {
        setError("Email saved, but no verification challenge was returned. Skip for now and verify later.");
      }
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.skipOnboardingEmail();
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreenLayout
      title="Add your email"
      subtitle="Optional, but useful for account recovery and receipts."
      errorMessage={error}
      footer={
        <>
          <Button label="Continue" onPress={handleSubmit} disabled={!isValidEmail} loading={isSubmitting} />
          <Button label="Skip for now" variant="ghost" onPress={handleSkip} disabled={isSubmitting} />
        </>
      }
    >
      <TextField value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoFocus />
    </FormScreenLayout>
  );
}
