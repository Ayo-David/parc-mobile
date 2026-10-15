import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { isWalletNotProvisioned } from "@/api/errors";
import { useSessionStore } from "@/state/stores/sessionStore";

/** How often to re-check while Ledger is still creating a new customer's wallet. */
const WALLET_SETUP_POLL_MS = 3_000;

export function useDashboard() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    enabled: isAuthenticated,
    refetchInterval: (query) => (isWalletNotProvisioned(query.state.error) ? WALLET_SETUP_POLL_MS : false),
  });
}
