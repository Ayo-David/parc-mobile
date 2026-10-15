import { useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { LabeledField } from "@/components/LabeledField/LabeledField";
import { TextField } from "@/components/TextField/TextField";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma "EmailVerification" (node 226:1717) — optional. RESOLVED: the
 * response is now typed (`OnboardingEmailResult`), so the challenge_id no
 * longer needs to be probed. The server's `current_step` still doesn't
 * distinguish "email set" from "email verified," so this still navigates
 * directly to the OTP screen client-side rather than refetching status.
 * The entered address is passed along only so the OTP screen can show
 * "code sent to …" (Figma 226:1800) — it's the customer's own input.
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
        router.push({ pathname: "/(onboarding)/email-otp", params: { challengeId: result.email_challenge.challenge_id, email } });
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
    <OnboardingStepLayout
      step={1}
      title={"What's your\nemail address?"}
      subtitle="We'll send a code to confirm your email. You can skip this if you don't have one."
      errorMessage={error}
      footer={
        <>
          <AuthButton label="Send Code →" onPress={handleSubmit} disabled={!isValidEmail} loading={isSubmitting} />
          <AuthButton label="I don't have an email" variant="outline" onPress={handleSkip} disabled={isSubmitting} />
        </>
      }
    >
      <LabeledField label="Email address" helperText="Used for account recovery and important notifications">
        <TextField value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" autoFocus />
      </LabeledField>
    </OnboardingStepLayout>
  );
}
