import * as Crypto from "expo-crypto";

/**
 * `POST /v1/transaction-authorizations` requires a `request_hash` matching
 * `^[a-f0-9]{64}$` (a SHA-256 hex digest of "the canonical request" per its
 * schema) — but the contract doesn't document what canonicalization the
 * server itself uses to verify it. This is a best-effort implementation
 * (stable key ordering, plain JSON) and must be verified against a live
 * backend before being trusted; if the server hashes differently, every
 * authorization call using this will fail server-side validation.
 */
export async function computeRequestHash(payload: Record<string, unknown>): Promise<string> {
  const sortedKeys = Object.keys(payload).sort();
  const canonical = JSON.stringify(payload, sortedKeys);
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical, { encoding: Crypto.CryptoEncoding.HEX });
}
