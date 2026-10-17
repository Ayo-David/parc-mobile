import { create } from "zustand";

import { useSessionStore } from "./sessionStore";

/**
 * How long Add Money keeps polling a "pending" funding account before it
 * stops and offers "Check again". The account only opens once the provider's
 * webhook arrives; if that never happens the server stays pending forever, so
 * without this limit the customer would watch a spinner indefinitely.
 */
export const ACCOUNT_SETUP_POLL_LIMIT_MS = 2 * 60_000;

export function isAccountSetupStalled(pendingSince: number | null, now: number): boolean {
  return pendingSince !== null && now - pendingSince >= ACCOUNT_SETUP_POLL_LIMIT_MS;
}

interface FundingSetupState {
  /** When the server first answered "pending" in the current wait, or null. */
  pendingSince: number | null;
  /** Records each funding-details answer: starts the wait on the first pending one, ends it on anything else. */
  observe: (isPending: boolean, now: number) => void;
  /** Starts a fresh wait — the customer asked to check again. */
  restart: (now: number) => void;
}

/**
 * Client-side timing only — whether the account is open is always the
 * server's answer. Shared so every screen polling funding details agrees on
 * when to stop.
 */
export const useFundingSetupStore = create<FundingSetupState>((set) => ({
  pendingSince: null,
  observe: (isPending, now) => set((state) => ({ pendingSince: isPending ? (state.pendingSince ?? now) : null })),
  restart: (now) => set({ pendingSince: now }),
}));

// A new customer on this device must not inherit the previous one's wait.
useSessionStore.subscribe((state, previous) => {
  if (previous.session && !state.session) useFundingSetupStore.setState({ pendingSince: null });
});
