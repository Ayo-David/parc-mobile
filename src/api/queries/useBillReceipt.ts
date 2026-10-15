import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

/** Only meaningful once the bill payment is terminal — a 409 ("not final") is normalized to null in api.getBillReceipt. */
export function useBillReceipt(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["bill-receipt", id],
    queryFn: () => api.getBillReceipt(id),
    enabled,
  });
}
