import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useStatement(statementId: string | null) {
  return useQuery({
    queryKey: ["statement", statementId],
    queryFn: () => api.getStatement(statementId!),
    enabled: statementId !== null,
    refetchInterval: (query) => (query.state.data?.status === "ready" || query.state.data?.status === "failed" ? false : 3000),
  });
}
