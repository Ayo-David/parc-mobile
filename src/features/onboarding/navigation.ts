import { useRouter } from "expo-router";

import { api } from "@/api/client";
import type { OnboardingStep } from "@/api/schemas";
import { queryClient } from "@/api/queryClient";

import { ONBOARDING_STATUS_QUERY_KEY } from "./useOnboardingStatus";

export function useOnboardingStepRouter() {
  const router = useRouter();
  return function goToStep(step: OnboardingStep) {
    switch (step) {
      case "PHONE_VERIFICATION":
        router.replace("/(auth)/register-phone");
        return;
      case "EMAIL":
        router.replace("/(onboarding)/email");
        return;
      case "IDENTITY":
        router.replace("/(onboarding)/identity");
        return;
      case "FACE_VERIFICATION":
        router.replace("/(onboarding)/face");
        return;
      case "ADDRESS":
        router.replace("/(onboarding)/address");
        return;
      case "COMPLIANCE":
        router.replace("/(onboarding)/compliance");
        return;
      case "INCOME":
        router.replace("/(onboarding)/income");
        return;
      case "LOGIN_PASSCODE":
        router.replace("/(onboarding)/create-passcode");
        return;
      case "BIOMETRIC":
        router.replace("/(onboarding)/biometric-setup");
        return;
      case "COMPLETED":
        router.replace("/(tabs)");
        return;
    }
  };
}

/**
 * Refetches onboarding status (the only documented source of truth for
 * "what's next" — PLAN.md Part 2) and navigates to whatever step the server
 * now reports, rather than a screen assuming its own mutation's undocumented
 * response tells it where to go next.
 */
export function useAdvanceOnboarding() {
  const goToStep = useOnboardingStepRouter();
  return async function advance() {
    const status = await queryClient.fetchQuery({ queryKey: ONBOARDING_STATUS_QUERY_KEY, queryFn: api.getOnboardingStatus });
    goToStep(status.current_step);
  };
}
