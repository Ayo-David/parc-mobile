import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { fundingAccountSetupState } from "@/api/errors";
import { useSessionStore } from "@/state/stores/sessionStore";

/** How often to re-check while Paystack validates the BVN and opens the account. */
const ACCOUNT_SETUP_POLL_MS = 4_000;

export function useWalletFundingDetails() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["wallet-funding-details"],
    queryFn: api.getWalletFundingDetails,
    enabled: isAuthenticated,
    staleTime: 60 * 60_000,
    // "No account yet" answers are states to render, not failures to retry.
    retry: (failureCount, error) => fundingAccountSetupState(error) === null && failureCount < 2,
    refetchInterval: (query) => (fundingAccountSetupState(query.state.error) === "pending" ? ACCOUNT_SETUP_POLL_MS : false),
  });
}
