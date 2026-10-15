import * as Sentry from "@sentry/react-native";

/**
 * The single place unexpected errors (render errors, network/5xx/unknown
 * API failures, anything an ordinary screen-level try/catch didn't already
 * turn into a friendly message) get reported from. Always logs in
 * development; reports to Sentry when a DSN is configured —
 * Sentry.captureException no-ops safely when Sentry.init was never called
 * (see observability/sentry.ts), so this is safe to call unconditionally.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error("[reportError]", error, context);
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
