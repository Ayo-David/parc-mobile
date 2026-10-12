/**
 * `POST /v1/onboarding/face-verification` requires the same NIN value
 * already submitted a step earlier by identity.tsx (`identity_value`
 * alongside the liveness reference) — there is no endpoint that lets the
 * face-verification step re-read a previously submitted NIN. Mirrors
 * passcodeDraft.ts's in-memory-only pattern rather than persisting a raw
 * NIN to AsyncStorage/SecureStore: it only needs to survive the few
 * screens between Identity and Face Verification, and NIN must never be
 * logged or persisted per AGENTS.md.
 */
let draftNin: string | null = null;

export function setDraftNin(value: string): void {
  draftNin = value;
}

export function getDraftNin(): string | null {
  return draftNin;
}

export function clearDraftNin(): void {
  draftNin = null;
}
