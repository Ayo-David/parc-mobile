import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { OnboardingState } from "@/api/schemas";

export const ONBOARDING_STATUS_QUERY_KEY = ["onboarding-status"];

/**
 * `null` means the customer has no onboarding session at all — auth-customer
 * answers 404 ONBOARDING_NOT_FOUND for an account that wasn't created
 * through the in-app onboarding chain (e.g. seeded or back-office created).
 * Such a customer already holds a login passcode (they just used it), so
 * there is nothing to resume. Every other failure still surfaces as an error.
 */
export async function fetchOnboardingStatus(): Promise<OnboardingState | null> {
  try {
    return await api.getOnboardingStatus();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === "ONBOARDING_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export function useOnboardingStatus(enabled: boolean) {
  return useQuery({
    queryKey: ONBOARDING_STATUS_QUERY_KEY,
    queryFn: fetchOnboardingStatus,
    enabled,
  });
}
