import { create } from "zustand";

import type { StoredSession } from "@/auth/tokenStorage";

interface SessionState {
  /** False until SecureStore has been checked once at app start. */
  isHydrated: boolean;
  session: StoredSession | null;
  setHydrated: (session: StoredSession | null) => void;
  setSession: (session: StoredSession) => void;
  clearSession: () => void;
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
  setHydrated: (session) => set({ isHydrated: true, session }),
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}));
