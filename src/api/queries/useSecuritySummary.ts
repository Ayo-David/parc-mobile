import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useSecuritySummary() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["security-summary"],
    queryFn: api.getSecuritySummary,
    enabled: isAuthenticated,
  });
}
