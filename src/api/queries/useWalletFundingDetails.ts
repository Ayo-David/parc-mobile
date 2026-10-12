import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useWalletFundingDetails() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["wallet-funding-details"],
    queryFn: api.getWalletFundingDetails,
    enabled: isAuthenticated,
    staleTime: 60 * 60_000,
  });
}
