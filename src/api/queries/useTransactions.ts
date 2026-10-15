import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

/** Payment's maximum page_size — the whole history the server will return in one call. */
export const TRANSACTION_PAGE_SIZE = 100;

export function useTransactions() {
  return useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: () => api.getTransactions({ pageSize: TRANSACTION_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.page.has_more ? (lastPage.page.next_cursor ?? undefined) : undefined),
  });
}
