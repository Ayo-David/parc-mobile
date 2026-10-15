/**
 * A raw transaction PIN must never be logged, persisted, or put into
 * router/URL params. Mirrors `features/onboarding/passcodeDraft.ts` — a
 * plain module-level variable that only exists in memory between the
 * Create and Confirm Transaction PIN screens, cleared immediately after
 * being read once.
 */
let draftPin: string | null = null;

export function setDraftTransactionPin(value: string): void {
  draftPin = value;
}

export function consumeDraftTransactionPin(): string | null {
  const value = draftPin;
  draftPin = null;
  return value;
}
