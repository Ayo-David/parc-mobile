/**
 * Minimal pluggable persistence contract for the theme preference. No
 * storage dependency (e.g. AsyncStorage) is bundled yet — see
 * docs/theme/README.md "Open questions" — so ThemeProvider defaults to
 * noopStorageAdapter (persists nothing, always resolves null) and the app
 * shell can inject a real adapter once one is approved and added, with no
 * change required in ThemeProvider itself.
 */
export interface ThemeStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const noopStorageAdapter: ThemeStorageAdapter = {
  async getItem() {
    return null;
  },
  async setItem() {
    // Intentionally does nothing until a real storage adapter is injected.
  },
};
