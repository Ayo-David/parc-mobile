import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { OptionCard } from "@/components/OptionCard/OptionCard";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useTheme } from "@/theme";

/**
 * Figma "PEPVerification" (node 226:2013). The confirmed contract is a
 * single boolean field — no additional position/country detail fields
 * exist for an enhanced-due-diligence sub-flow (parc-interview-answers.md
 * §12 describes EDD as a separate compliance-owned process, not part of
 * this app screen).
 */
export default function OnboardingComplianceScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const [isPep, setIsPep] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (isPep === null) return;
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

  const styles = StyleSheet.create({
    options: {
      gap: theme.semanticSpacing.authActions,
    },
    notice: {
      backgroundColor: theme.components.status.warning.backgroundColor,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.semanticSpacing.authActions,
      marginTop: theme.spacing.md + 2,
    },
    noticeText: {
      ...theme.typography.text12Regular,
      color: theme.colors.warningStrong,
    },
  });

  return (
    <OnboardingStepLayout
      step={6}
      icon="shield-outline"
      title={"Are you a Politically\nExposed Person?"}
      subtitle="A PEP holds or has held a prominent public function, or is closely associated with such a person"
      errorMessage={error}
      footer={<AuthButton label="Continue →" onPress={handleSubmit} disabled={isPep === null} loading={isSubmitting} />}
    >
      <View style={styles.options}>
        <OptionCard emoji="🏛️" title="Yes, I am" description="I hold or have held a public position" selected={isPep === true} onPress={() => setIsPep(true)} disabled={isSubmitting} />
        <OptionCard emoji="👤" title="No, I'm not" description="I am a private individual" selected={isPep === false} onPress={() => setIsPep(false)} disabled={isSubmitting} />
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>Required by CBN AML/CFT regulations</Text>
      </View>
    </OnboardingStepLayout>
  );
}
