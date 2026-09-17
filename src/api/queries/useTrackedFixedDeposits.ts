import { useQueries } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useSessionStore } from "@/state/stores/sessionStore";

/** Refetches each locally-tracked fixed deposit by id (the only lookup the contract supports — see savingsRecordsStore.ts). */
export function useTrackedFixedDeposits() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  const fixedDeposits = useSavingsRecordsStore((state) => state.fixedDeposits);

  return useQueries({
    queries: fixedDeposits.map((tracked) => ({
      queryKey: ["fixed-deposit", tracked.id],
      queryFn: () => api.getFixedDeposit(tracked.id),
      enabled: isAuthenticated,
    })),
  });
}
