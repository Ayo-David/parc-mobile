import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { TRANSFER_TERMINAL_STATUSES } from "@/api/schemas";

export function useTransfer(id: string) {
  return useQuery({
    queryKey: ["transfer", id],
    queryFn: () => api.getTransfer(id),
    refetchInterval: (query) => (query.state.data && TRANSFER_TERMINAL_STATUSES.includes(query.state.data.status) ? false : 3000),
  });
}
