import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export const ONBOARDING_STATUS_QUERY_KEY = ["onboarding-status"];

export function useOnboardingStatus(enabled: boolean) {
  return useQuery({
    queryKey: ONBOARDING_STATUS_QUERY_KEY,
    queryFn: api.getOnboardingStatus,
    enabled,
  });
}
