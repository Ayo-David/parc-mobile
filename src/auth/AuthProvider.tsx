import { useEffect, type ReactNode } from "react";

import { useSessionStore } from "@/state/stores/sessionStore";

import { tokenStorage } from "./tokenStorage";

/**
 * Hydrates the in-memory session store from SecureStore once at app start.
 * Session state itself lives in useSessionStore (Zustand); this component
 * only owns the one-time async hydration side effect.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setHydrated = useSessionStore((state) => state.setHydrated);

  useEffect(() => {
    let cancelled = false;
    tokenStorage.load().then((session) => {
      if (!cancelled) {
        setHydrated(session);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setHydrated]);

  return <>{children}</>;
}
