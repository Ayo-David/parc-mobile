import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useLoanSummary() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["loan-summary"],
    queryFn: api.getLoanSummary,
    enabled: isAuthenticated,
  });
}
