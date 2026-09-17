import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "parc.access_token";
const REFRESH_TOKEN_KEY = "parc.refresh_token";
const TENANT_ID_KEY = "parc.tenant_id";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
}

/**
 * The only place in the app allowed to read/write token material directly
 * (per .clauderules-adjacent security rules — real tokens never appear in
 * logs, and nothing outside auth/ touches SecureStore for session state).
 * refreshToken is stored even though no Mobile BFF refresh route exists yet
 * (PLAN.md Part 2 blocker) — Auth & Customer already issues one on login,
 * and storing it now means no migration is needed once the route lands.
 */
export const tokenStorage = {
  async save(session: StoredSession): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
      SecureStore.setItemAsync(TENANT_ID_KEY, session.tenantId),
    ]);
  },

  async load(): Promise<StoredSession | null> {
    const [accessToken, refreshToken, tenantId] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(TENANT_ID_KEY),
    ]);
    if (!accessToken || !refreshToken || !tenantId) {
      return null;
    }
    return { accessToken, refreshToken, tenantId };
  },

  async clear(): Promise<void> {
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY), SecureStore.deleteItemAsync(TENANT_ID_KEY)]);
  },
};
