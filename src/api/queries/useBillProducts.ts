import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { BillCategory } from "@/api/schemas";

export function useBillProducts(category: BillCategory) {
  return useQuery({
    queryKey: ["bill-products", category],
    queryFn: () => api.getBillProducts(category),
    staleTime: 5 * 60_000,
  });
}
