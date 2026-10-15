import type { RegisteredIdentityName } from "@/api/schemas";

/**
 * `POST /v1/onboarding/face-verification` requires the same BVN value
 * already submitted a step earlier by identity.tsx (`identity_value`
 * alongside the liveness reference) — there is no endpoint that lets the
 * face-verification step re-read a previously submitted BVN. Mirrors
 * passcodeDraft.ts's in-memory-only pattern rather than persisting a raw
 * BVN to AsyncStorage/SecureStore: it only needs to survive the few
 * screens between Identity and Face Verification, and BVN must never be
 * logged or persisted per AGENTS.md.
 */
let draftBvn: string | null = null;

/**
 * The BVN-registered name returned by a VERIFIED BVN lookup, shown on the
 * face-consent screen so the customer can confirm the record is theirs
 * before the face scan. Same in-memory-only lifetime as the BVN.
 */
let draftIdentityName: RegisteredIdentityName | null = null;

export function setDraftBvn(value: string): void {
  draftBvn = value;
}

export function getDraftBvn(): string | null {
  return draftBvn;
}

export function setDraftIdentityName(value: RegisteredIdentityName | null): void {
  draftIdentityName = value;
}

export function getDraftIdentityName(): RegisteredIdentityName | null {
  return draftIdentityName;
}

export function clearDraftBvn(): void {
  draftBvn = null;
  draftIdentityName = null;
}

/**
 * Keeps the first three letters of a name part and replaces the rest with
 * a fixed "**" ("DAVID" → "DAV**"), so the full legal name and its length
 * stay hidden while the customer can still recognise it.
 */
export function maskNamePart(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.length <= 3 ? trimmed : `${trimmed.slice(0, 3)}**`;
}
