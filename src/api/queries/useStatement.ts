import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useStatement(statementId: string | null) {
  return useQuery({
    queryKey: ["statement", statementId],
    queryFn: () => api.getStatement(statementId!),
    enabled: statementId !== null,
    refetchInterval: (query) => (query.state.data && ["ready", "failed", "expired"].includes(query.state.data.status) ? false : 3000),
  });
}
