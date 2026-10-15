import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { BILL_TERMINAL_STATUSES } from "@/api/schemas";

export function useBillPayment(id: string) {
  return useQuery({
    queryKey: ["bill-payment", id],
    queryFn: () => api.getBillPayment(id),
    refetchInterval: (query) => (query.state.data && BILL_TERMINAL_STATUSES.includes(query.state.data.status) ? false : 3000),
  });
}
