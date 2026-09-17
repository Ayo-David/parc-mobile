import * as Sentry from "@sentry/react-native";

/**
 * Init-only for this sprint (PLAN.md Part 8 exclusions). A no-op until a
 * real DSN is supplied via EXPO_PUBLIC_SENTRY_DSN — never sends PII
 * (customer data, tokens, PINs) by default.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }
  Sentry.init({ dsn, sendDefaultPii: false });
}
