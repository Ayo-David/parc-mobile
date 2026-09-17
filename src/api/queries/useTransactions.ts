import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { TransactionStatus } from "@/api/schemas";

export interface TransactionFilters {
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["transactions", filters],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => api.getTransactions({ ...filters, pageCursor: pageParam, pageSize: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.page.has_more ? (lastPage.page.next_cursor ?? undefined) : undefined),
  });
}
