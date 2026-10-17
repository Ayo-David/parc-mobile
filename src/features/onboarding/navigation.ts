import { type Href, useRouter } from "expo-router";

import { api } from "@/api/client";
import type { OnboardingStep } from "@/api/schemas";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/auth/useAuth";
import { useSessionStore } from "@/state/stores/sessionStore";

import { fetchOnboardingStatus, ONBOARDING_STATUS_QUERY_KEY } from "./useOnboardingStatus";

export function onboardingStepHref(step: OnboardingStep): Href {
  switch (step) {
    case "PHONE_VERIFICATION":
      return "/(auth)/register-phone";
    case "EMAIL":
      return "/(onboarding)/email";
    case "IDENTITY":
      return "/(onboarding)/identity";
    case "FACE_VERIFICATION":
      return "/(onboarding)/face";
    case "ADDRESS":
      return "/(onboarding)/address";
    case "COMPLIANCE":
      return "/(onboarding)/compliance";
    case "INCOME":
      return "/(onboarding)/income";
    case "LOGIN_PASSCODE":
      return "/(onboarding)/create-passcode";
    case "BIOMETRIC":
      return "/(onboarding)/biometric-setup";
    case "COMPLETED":
      return "/(tabs)";
  }
}

/**
 * Navigates to a server-declared step as a fresh stack. A completed step
 * can't be resubmitted (auth-customer answers ONBOARDING_STEP_OUT_OF_ORDER),
 * so earlier screens must not stay underneath for back/swipe to reveal.
 */
export function useResetOnboardingStack() {
  const router = useRouter();
  return function resetTo(href: Href) {
    if (router.canDismiss()) router.dismissAll();
    router.replace(href);
  };
}

export function useOnboardingStepRouter() {
  const resetTo = useResetOnboardingStack();
  return function goToStep(step: OnboardingStep) {
    resetTo(onboardingStepHref(step));
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
    // staleTime 0: the default 30s would hand back the step just submitted,
    // leaving the customer on the same screen to resubmit into a 409.
    const status = await queryClient.fetchQuery({ queryKey: ONBOARDING_STATUS_QUERY_KEY, queryFn: fetchOnboardingStatus, staleTime: 0 });
    if (status) {
      goToStep(status.current_step);
    }
  };
}

/**
 * Completes onboarding, then ends the onboarding session so the customer
 * signs in with the passcode they just created (Figma PasscodeSuccess
 * 226:2324 "Go to Login"). The (auth) welcome screen forwards to Login.
 */
export function useFinishOnboarding() {
  const { logout } = useAuth();
  return async function finish(biometricEnrolled: boolean) {
    await api.completeOnboarding({ biometricEnrolled });
    useSessionStore.getState().setLoginRedirectPending(true);
    await logout();
    queryClient.removeQueries({ queryKey: ONBOARDING_STATUS_QUERY_KEY });
  };
}
