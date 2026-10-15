import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { AuthButton } from "@/components/AuthButton/AuthButton";
import { LabeledField } from "@/components/LabeledField/LabeledField";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { setDraftBvn, setDraftIdentityName } from "@/features/onboarding/identityDraft";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingStepLayout } from "@/features/onboarding/OnboardingStepLayout";
import { useTheme } from "@/theme";

const BVN_LENGTH = 11;
const BVN_PATTERN = /^[0-9]{11}$/;

/**
 * Figma "NINVerification" (node 226:1815) plus, for the first time, its
 * real failed/manual-review siblings ("Onboarding 01 — NIN Verification
 * Failed", node 439:284, missing-mobile.md §2.2), now collecting a BVN
 * instead of a NIN: BVN alone satisfies CBN Tier 1 and is what Paystack
 * validates for the wallet's virtual account; NIN comes later for higher
 * tiers. The Figma frames still say "NIN". The BVN is kept only in
 * local component state and never logged, matching
 * parc-interview-answers.md §13. RESOLVED (PLAN.md "Real blockers"):
 * consent_id now comes from the real `GET /v1/onboarding/reference-data`
 * endpoint. RESOLVED (MOB-23): `api.submitOnboardingIdentity` previously
 * discarded its response — it's now fully typed
 * (`OnboardingVerificationResult`, the same shape face-verification
 * uses), so this can honestly branch on the real
 * `KycVerification.status` instead of only ever showing success or a
 * generic thrown-error message.
 */
export default function OnboardingIdentityScreen() {
  const { theme } = useTheme();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const advanceOnboarding = useAdvanceOnboarding();
  const [bvn, setBvn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"failed" | "manual_review" | null>(null);

  const isValid = BVN_PATTERN.test(bvn);
  const consentDocuments = referenceData.data?.consent_documents ?? [];
  const identityConsent = consentDocuments.find((doc) => /identity|bvn|nin|kyc/i.test(doc.consent_type)) ?? consentDocuments[0];

  async function handleSubmit() {
    if (!identityConsent) {
      setError("No consent document is configured for this tenant.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setOutcome(null);
    try {
      const result = await api.submitOnboardingIdentity({ bvnValue: bvn, consentId: identityConsent.id });
      switch (result.verification.status) {
        case "VERIFIED":
          setDraftBvn(bvn);
          setDraftIdentityName(result.identity ?? null);
          await advanceOnboarding();
          return;
        case "FAILED":
          setOutcome("failed");
          return;
        case "MANUAL_REVIEW":
        case "PENDING":
          setDraftBvn(bvn);
          setDraftIdentityName(null);
          setOutcome("manual_review");
          return;
      }
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't verify that BVN. Please check the number and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (outcome === "failed") {
    return (
      <StatusScreenLayout
        icon="card-outline"
        tone="error"
        title="We couldn't verify your BVN"
        body="We couldn't find a matching BVN record. Double-check your 11-digit BVN and try again, or continue with manual review (may take up to 24 hours)."
        onBack={() => setOutcome(null)}
        footer={
          <>
            <Button label="Try again" onPress={() => setOutcome(null)} />
            <Button label="Continue with manual review" variant="ghost" onPress={() => void advanceOnboarding()} />
          </>
        }
      />
    );
  }

  if (outcome === "manual_review") {
    return (
      <StatusScreenLayout
        icon="time-outline"
        tone="warning"
        title="We're still checking"
        body="Your identity details need a closer look by our verification team. This is normal and usually takes less than 24 hours — we'll notify you the moment it's done."
        showBackButton={false}
        footer={<Button label="Continue setting up your account" onPress={() => void advanceOnboarding()} />}
      />
    );
  }

  const styles = StyleSheet.create({
    tip: {
      flexDirection: "row",
      gap: theme.spacing.sm + 2,
      alignItems: "flex-start",
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.input,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    tipIcon: {
      marginTop: 1,
    },
    tipText: {
      ...theme.typography.text13Regular,
      color: theme.colors.textTertiary,
      flex: 1,
    },
    tipCode: {
      ...theme.typography.text13Bold,
      color: theme.colors.textPrimary,
    },
  });

  return (
    <OnboardingStepLayout
      step={3}
      icon="card-outline"
      title={"Verify your\nidentity."}
      subtitle="Enter your 11-digit Bank Verification Number (BVN)"
      errorMessage={error}
      footer={<AuthButton label="Verify BVN →" onPress={handleSubmit} disabled={!isValid} loading={isSubmitting} />}
    >
      <LabeledField label="BVN" trailingHelper={`${bvn.length}/${BVN_LENGTH}`}>
        <TextField
          value={bvn}
          onChangeText={(value) => setBvn(value.replace(/[^0-9]/g, ""))}
          placeholder="12345678901"
          keyboardType="number-pad"
          maxLength={BVN_LENGTH}
          textVariant="figure"
          autoFocus
        />
      </LabeledField>
      <View style={styles.tip}>
        <Ionicons name="alert-circle-outline" size={theme.icon.inline} color={theme.colors.textMuted} style={styles.tipIcon} />
        <Text style={styles.tipText}>
          Dial <Text style={styles.tipCode}>*565*0#</Text> from the phone number registered with your bank to get your BVN
        </Text>
      </View>
    </OnboardingStepLayout>
  );
}
