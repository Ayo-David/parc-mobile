import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useSavingsSummary() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["savings-summary"],
    queryFn: api.getSavingsSummary,
    enabled: isAuthenticated,
  });
}
