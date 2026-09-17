import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: api.getBanks,
    staleTime: 60 * 60_000,
  });
}
