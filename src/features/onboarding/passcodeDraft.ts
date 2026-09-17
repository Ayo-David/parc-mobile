/**
 * A raw passcode must never be logged, persisted, or put into router/URL
 * params (which can surface in devtools/deep-link inspection). This is a
 * plain module-level variable — not a Zustand store, not AsyncStorage — so
 * it only ever exists in memory for the few seconds between the Create
 * Passcode and Confirm Passcode screens, and is cleared immediately after
 * being read once.
 */
let draftPasscode: string | null = null;

export function setDraftPasscode(value: string): void {
  draftPasscode = value;
}

export function consumeDraftPasscode(): string | null {
  const value = draftPasscode;
  draftPasscode = null;
  return value;
}
