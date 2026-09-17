import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";

/**
 * Figma "PEPVerification" (node 226:2013). The confirmed contract is a
 * single boolean field — no additional position/country detail fields
 * exist for an enhanced-due-diligence sub-flow (parc-interview-answers.md
 * §12 describes EDD as a separate compliance-owned process, not part of
 * this app screen).
 */
export default function OnboardingComplianceScreen() {
  const advanceOnboarding = useAdvanceOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnswer(isPep: boolean) {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitOnboardingCompliance({ politicallyExposedPerson: isPep });
      await advanceOnboarding();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreenLayout
      title="Are you a politically exposed person?"
      subtitle="This includes senior government, military, or judicial officials, and their close family members or associates."
      errorMessage={error}
      footer={
        <>
          <Button label="No" onPress={() => handleAnswer(false)} loading={isSubmitting} />
          <Button label="Yes" variant="secondary" onPress={() => handleAnswer(true)} loading={isSubmitting} />
        </>
      }
    />
  );
}
