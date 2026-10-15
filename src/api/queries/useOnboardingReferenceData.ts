import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

/** Public (X-Tenant-Id only, no bearer) — safe to call before login. */
export function useOnboardingReferenceData(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["onboarding-reference-data", tenantId],
    queryFn: () => api.getOnboardingReferenceData(tenantId!),
    enabled: !!tenantId,
    staleTime: 60 * 60_000,
  });
}
