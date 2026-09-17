import { randomUUID } from "expo-crypto";

/**
 * The Mobile BFF only enforces Idempotency-Key on the 5 public pre-auth
 * routes — every authenticated financial command (transfers, bills, loan
 * applications, savings, profile edits) reads it optionally and just
 * forwards it if present (see PLAN.md Part 4). The client must therefore
 * generate and reuse a stable key itself for every logical financial
 * command, including retries with an identical payload. Uses expo-crypto
 * rather than the platform crypto global, which isn't reliably present
 * across Hermes/engine versions.
 */
export function createIdempotencyKey(): string {
  return randomUUID();
}
