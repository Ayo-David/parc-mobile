import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { api } from "@/api/client";
import { fundingAccountSetupState } from "@/api/errors";
import { useSessionStore } from "@/state/stores/sessionStore";
import { ACCOUNT_SETUP_POLL_LIMIT_MS, isAccountSetupStalled, useFundingSetupStore } from "@/state/stores/fundingSetupStore";

/** How often to re-check while Paystack validates the BVN and opens the account. */
const ACCOUNT_SETUP_POLL_MS = 4_000;
const FUNDING_DETAILS_QUERY_KEY = ["wallet-funding-details"];

async function fetchWalletFundingDetails() {
  const { observe } = useFundingSetupStore.getState();
  try {
    const details = await api.getWalletFundingDetails();
    observe(false, Date.now());
    return details;
  } catch (error) {
    observe(fundingAccountSetupState(error) === "pending", Date.now());
    throw error;
  }
}

export function useWalletFundingDetails() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: FUNDING_DETAILS_QUERY_KEY,
    queryFn: fetchWalletFundingDetails,
    enabled: isAuthenticated,
    staleTime: 60 * 60_000,
    // "No account yet" answers are states to render, not failures to retry.
    retry: (failureCount, error) => fundingAccountSetupState(error) === null && failureCount < 2,
    refetchInterval: (query) =>
      fundingAccountSetupState(query.state.error) === "pending" && !isAccountSetupStalled(useFundingSetupStore.getState().pendingSince, Date.now())
        ? ACCOUNT_SETUP_POLL_MS
        : false,
  });
}

/**
 * Whether a pending account setup has outlived the polling limit, and a way to
 * resume polling. A timer flips `isStalled` on time even though polling (and
 * so re-rendering) has stopped.
 */
export function useFundingSetupStall(refetch: () => Promise<unknown>) {
  const pendingSince = useFundingSetupStore((state) => state.pendingSince);
  const restart = useFundingSetupStore((state) => state.restart);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (pendingSince === null) return;
    const remaining = pendingSince + ACCOUNT_SETUP_POLL_LIMIT_MS - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }
    const timer = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(timer);
  }, [pendingSince]);

  return {
    isStalled: isAccountSetupStalled(pendingSince, Math.max(now, Date.now())),
    checkAgain: () => {
      restart(Date.now());
      void refetch();
    },
  };
}
