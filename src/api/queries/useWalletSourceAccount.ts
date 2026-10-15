import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useWalletSourceAccount() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["wallet-source-account"],
    queryFn: api.getWalletSourceAccount,
    enabled: isAuthenticated,
    staleTime: 60 * 60_000,
  });
}
