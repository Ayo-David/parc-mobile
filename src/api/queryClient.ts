import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "./errors";
import { reportError } from "@/observability/reportError";

function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && error.retryable;
}

/**
 * Defense-in-depth: httpClient's response interceptor (api/client.ts)
 * already reports unexpected network/5xx/unknown failures to Sentry. This
 * catches everything else that can still surface as a query/mutation
 * error — a zod parse failure inside a `parse()` callback, a bug in a
 * queryFn/mutationFn — so no failure mode silently reports nothing.
 * Ordinary ApiError instances are never double-reported here; the
 * interceptor already decided whether they're expected or not.
 */
function reportUnexpectedQueryError(error: unknown, context: Record<string, unknown>): void {
  if (error instanceof ApiError) {
    return;
  }
  reportError(error, context);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportUnexpectedQueryError(error, { queryKey: query.queryKey }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => reportUnexpectedQueryError(error, { mutationKey: mutation.options.mutationKey }),
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      staleTime: 30_000,
    },
    mutations: {
      // Financial/command mutations never auto-retry: a timeout after
      // submission must be resolved by querying status, not resending.
      retry: false,
    },
  },
});
