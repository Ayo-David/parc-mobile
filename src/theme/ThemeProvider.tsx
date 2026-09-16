import { createContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { noopStorageAdapter, type ThemeStorageAdapter } from "./storage";
import { applyTenantOverrides, validateTenantThemeOverrides } from "./tenantTheme";
import { darkTheme } from "./themes/darkTheme";
import { defaultTheme } from "./themes/defaultTheme";
import type { ParcTheme, ThemeMode, ThemePreference, UnvalidatedTenantThemeInput } from "./types";

const DEFAULT_STORAGE_KEY = "parc.theme.preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export interface ThemeContextValue {
  theme: ParcTheme;
  /** The resolved mode actually being rendered ("system" is never exposed here). */
  themeMode: ThemeMode;
  /** What the customer/device asked for, including "system". */
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  /** Tenant override keys that failed validation and were dropped; surface in dev tooling/logging, never to the customer. */
  tenantRejectedKeys: string[];
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Raw, untrusted tenant branding payload (e.g. from the bootstrap API
   * response). Re-validated on every change via validateTenantThemeOverrides.
   * Memoize this object in the caller to avoid re-validating every render.
   */
  tenantBranding?: UnvalidatedTenantThemeInput | null;
  storageAdapter?: ThemeStorageAdapter;
  storageKey?: string;
  /** Overrides persisted/system resolution; primarily for tests and Storybook-style harnesses. */
  initialPreference?: ThemePreference;
}

export function ThemeProvider({
  children,
  tenantBranding = null,
  storageAdapter = noopStorageAdapter,
  storageKey = DEFAULT_STORAGE_KEY,
  initialPreference,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference ?? "system");
  const hasLoadedPersisted = useRef(initialPreference !== undefined);

  useEffect(() => {
    if (hasLoadedPersisted.current) {
      return;
    }
    let cancelled = false;
    storageAdapter.getItem(storageKey).then((stored) => {
      if (!cancelled && isThemePreference(stored)) {
        setPreference(stored);
      }
      hasLoadedPersisted.current = true;
    });
    return () => {
      cancelled = true;
    };
    // Only runs once on mount to hydrate a persisted preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setThemePreference = (next: ThemePreference) => {
    setPreference(next);
    void storageAdapter.setItem(storageKey, next);
  };

  const resolvedMode: ThemeMode = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  const { overrides, rejectedKeys } = useMemo(() => validateTenantThemeOverrides(tenantBranding), [tenantBranding]);

  const theme = useMemo(() => {
    const base = resolvedMode === "dark" ? darkTheme : defaultTheme;
    return Object.keys(overrides).length > 0 ? applyTenantOverrides(base, overrides) : base;
  }, [resolvedMode, overrides]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeMode: resolvedMode,
      themePreference: preference,
      setThemePreference,
      tenantRejectedKeys: rejectedKeys,
    }),
    // setThemePreference is intentionally omitted: it's stable across renders
    // because it only closes over the setPreference/storageAdapter/storageKey
    // props, none of which this provider expects to change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, resolvedMode, preference, rejectedKeys],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
