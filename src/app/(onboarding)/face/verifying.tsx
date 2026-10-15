import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { clearDraftBvn, getDraftBvn } from "@/features/onboarding/identityDraft";
import { LivenessCameraFrame } from "@/features/onboarding/liveness/LivenessCameraFrame";
import { clearDraftSelfie, getDraftSelfie } from "@/features/onboarding/liveness/selfie";
import { useTheme } from "@/theme";

/**
 * Figma "Liveness 04 — Verifying" (node 426:112, missing-mobile.md §2.1).
 *
 * Sends the selfie taken by challenge.tsx to `POST
 * /v1/onboarding/face-verification` as `selfie_image`. The backend runs the
 * KYC provider's liveness check and the match against the BVN photo, and
 * its verdict decides the route. The selfie is dropped from memory as soon
 * as it has been sent.
 */
export default function LivenessVerifyingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const [error, setError] = useState<string | null>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current) return;
    if (!referenceData.data) return;
    hasSubmitted.current = true;

    async function submit() {
      const bvn = getDraftBvn();
      const selfie = getDraftSelfie();
      clearDraftSelfie();
      const consentDocuments = referenceData.data?.consent_documents ?? [];
      const consent = consentDocuments.find((doc) => /identity|bvn|nin|kyc|biometric|face/i.test(doc.consent_type)) ?? consentDocuments[0];

      if (!bvn || !consent) {
        setError("We couldn't find your earlier BVN submission. Please go back and re-enter it.");
        return;
      }
      if (!selfie) {
        setError("We couldn't find your photo. Please take it again.");
        return;
      }

      try {
        const result = await api.submitFaceVerification({ bvnValue: bvn, selfieImage: selfie, consentId: consent.id });

        switch (result.verification.status) {
          case "VERIFIED":
            clearDraftBvn();
            router.replace({
              pathname: "/(onboarding)/identity-verified",
              params: result.identity ? { firstName: result.identity.first_name, lastName: result.identity.last_name } : {},
            });
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
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
    },
  });

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
      statusText="Matching against your BVN record"
      helperText="This usually takes a few seconds. Don't close the app."
      centerContent={<ActivityIndicator size="large" color={theme.colors.secondary} />}
    />
  );
}
