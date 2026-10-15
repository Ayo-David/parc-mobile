import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useProfile() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
