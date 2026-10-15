/**
 * The selfie taken at the end of the liveness challenge, held only in
 * memory until `verifying.tsx` sends it as `selfie_image` to
 * `POST /v1/onboarding/face-verification`. Like identityDraft.ts it is
 * never persisted or logged: it is biometric data, and the backend runs the
 * liveness and BVN face match itself.
 */
let draftSelfie: string | null = null;

export function setDraftSelfie(base64: string): void {
  draftSelfie = base64;
}

export function getDraftSelfie(): string | null {
  return draftSelfie;
}

export function clearDraftSelfie(): void {
  draftSelfie = null;
}

/** Mirrors the backend's `selfie_image` limit (base64 characters). */
export const MAX_SELFIE_BASE64_LENGTH = 1_500_000;

/** Shortest edge the face match needs; anything larger only adds upload size. */
const MIN_SELFIE_EDGE = 480;

/**
 * Picks the smallest "WIDTHxHEIGHT" picture size whose shorter edge is still
 * at least MIN_SELFIE_EDGE. Platform presets ("Photo", "High", …) are ignored;
 * undefined leaves the camera on its default size.
 */
export function pickSelfiePictureSize(sizes: readonly string[]): string | undefined {
  const candidates = sizes
    .map((size) => {
      const match = /^(\d+)x(\d+)$/.exec(size);
      return match ? { size, width: Number(match[1]), height: Number(match[2]) } : undefined;
    })
    .filter((candidate): candidate is { size: string; width: number; height: number } => candidate !== undefined)
    .filter((candidate) => Math.min(candidate.width, candidate.height) >= MIN_SELFIE_EDGE)
    .sort((a, b) => a.width * a.height - b.width * b.height);
  return candidates[0]?.size;
}
