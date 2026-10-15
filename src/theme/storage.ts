import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Minimal pluggable persistence contract for the theme preference. See
 * docs/theme/README.md.
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
    // Intentionally does nothing; used only where persistence is deliberately opted out of (e.g. tests).
  },
};

/**
 * Default production adapter, backed by AsyncStorage (approved PLAN.md
 * MOB-00). Kept inside theme/ per .clauderules: no other file may touch
 * AsyncStorage for the theme preference directly.
 */
export const asyncStorageThemeAdapter: ThemeStorageAdapter = {
  async getItem(key) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },
};
