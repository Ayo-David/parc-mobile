import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { clearDraftNin, getDraftNin } from "@/features/onboarding/identityDraft";
import { LivenessCameraFrame } from "@/features/onboarding/liveness/LivenessCameraFrame";
import { useTheme } from "@/theme";

/**
 * Figma "Liveness 04 — Verifying" (node 426:112, missing-mobile.md §2.1).
 *
 * This is the one point in the whole liveness flow that's still genuinely
 * blocked, not just undesigned (PLAN.md "Real blockers"): `POST
 * /v1/onboarding/face-verification` takes an opaque `liveness_reference`
 * that only a real liveness-capture SDK (e.g. VerifyMe) can produce, and
 * no such SDK is integrated yet. In development builds this calls the
 * real, fully-typed endpoint with a clearly-fake reference so the rest of
 * the chain (status branching, routing to failed/manual-review/verified)
 * is testable end to end against a seeded backend. In production builds
 * it stops here honestly instead of pretending a biometric check ran.
 */
export default function LivenessVerifyingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const [error, setError] = useState<string | null>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!__DEV__) return;
    if (hasSubmitted.current) return;
    if (!referenceData.data) return;
    hasSubmitted.current = true;

    async function submit() {
      const nin = getDraftNin();
      const consentDocuments = referenceData.data?.consent_documents ?? [];
      const consent = consentDocuments.find((doc) => /identity|nin|kyc|biometric|face/i.test(doc.consent_type)) ?? consentDocuments[0];

      if (!nin || !consent) {
        setError("We couldn't find your earlier NIN submission. Please go back and re-enter it.");
        return;
      }

      try {
        let result = await api.submitFaceVerification({ ninValue: nin, livenessReference: `dev-stub-${Date.now()}`, consentId: consent.id });
        if (result.verification.status === "PENDING") {
          result = await api.confirmFaceVerification(result.verification.id);
        }

        switch (result.verification.status) {
          case "VERIFIED":
            clearDraftNin();
            router.replace("/(onboarding)/identity-verified");
            return;
          case "FAILED":
            router.replace("/(onboarding)/face/failed");
            return;
          case "MANUAL_REVIEW":
          case "PENDING":
            router.replace("/(onboarding)/face/manual-review");
            return;
        }
      } catch (submitError) {
        setError(submitError instanceof ApiError ? submitError.message : "Something went wrong while verifying your face.");
      }
    }

    void submit();
  }, [referenceData.data, router]);

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingHorizontal: theme.semanticSpacing.section,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    body: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
    },
  });

  if (!__DEV__) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.title}>This step isn&apos;t available yet</Text>
          <Text style={styles.body}>Face verification needs a capability this version of the app doesn&apos;t include yet. Please check back soon or contact support.</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.title}>We hit a snag</Text>
          <Text style={styles.error}>{error}</Text>
          <Button label="Back to camera" onPress={() => router.replace("/(onboarding)/face/capture")} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <LivenessCameraFrame
      heading="Verifying your identity"
      activeStep={3}
      completedThroughStep={3}
      ovalBorderColor={theme.colors.textSecondary}
      statusDotColor={theme.colors.success}
      statusText="Matching against your NIN record"
      helperText="This usually takes a few seconds. Don't close the app."
      centerContent={<ActivityIndicator size="large" color={theme.colors.secondary} />}
    />
  );
}
