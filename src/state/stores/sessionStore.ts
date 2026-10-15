import { create } from "zustand";

import type { StoredSession } from "@/auth/tokenStorage";

interface SessionState {
  /** False until SecureStore has been checked once at app start. */
  isHydrated: boolean;
  session: StoredSession | null;
  /**
   * Distinguishes a forced end-of-session (401 → failed refresh, MOB-00A)
   * from a manual logout, so the root layout can show Figma "System 06 —
   * Session Expired" (node 436:376, missing-mobile.md §1) instead of
   * silently bouncing to Sign In — see `_layout.tsx`.
   */
  sessionExpired: boolean;
  setHydrated: (session: StoredSession | null) => void;
  setSession: (session: StoredSession) => void;
  clearSession: () => void;
  setSessionExpired: (value: boolean) => void;
}

/**
 * In-memory mirror of the persisted session (SecureStore is the source of
 * truth; this exists so api/client.ts and route guards can read the current
 * token/tenant synchronously without an async storage read on every
 * request). Never put the raw passcode or transaction PIN here.
 */
export const useSessionStore = create<SessionState>((set) => ({
  isHydrated: false,
  session: null,
  sessionExpired: false,
  setHydrated: (session) => set({ isHydrated: true, session }),
  setSession: (session) => set({ session, sessionExpired: false }),
  clearSession: () => set({ session: null }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
}));
