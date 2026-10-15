import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export const BENEFICIARIES_QUERY_KEY = ["beneficiaries"];

export function useBeneficiaries() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: BENEFICIARIES_QUERY_KEY,
    queryFn: () => api.getBeneficiaries(),
    enabled: isAuthenticated,
  });
}
