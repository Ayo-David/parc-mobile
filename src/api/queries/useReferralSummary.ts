import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useReferralSummary() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["referral-summary"],
    queryFn: api.getReferralSummary,
    enabled: isAuthenticated,
  });
}
