import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

import { useSessionStore } from "@/state/stores/sessionStore";

import { httpClient } from "../client";

// jest.mock calls are hoisted above these imports.

jest.mock("@/config/env", () => ({ env: { apiBaseUrl: "https://api.test/mobile", tenantSlug: "tenant-a" } }));
jest.mock("@/auth/tokenStorage", () => ({ tokenStorage: { save: jest.fn(async () => undefined), clear: jest.fn(async () => undefined), load: jest.fn(async () => null) } }));
jest.mock("@/observability/reportError", () => ({ reportError: jest.fn() }));

const TENANT = "11111111-1111-4111-8111-111111111111";

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 400) {
    const error = Object.assign(new Error(`status ${status}`), { isAxiosError: true, config, response, toJSON: () => ({}) });
    return Promise.reject(error);
  }
  return Promise.resolve(response);
}

describe("session refresh", () => {
  let refreshCalls: string[];
  let validAccessToken: string;

  beforeEach(() => {
    refreshCalls = [];
    validAccessToken = "access-2";
    useSessionStore.setState({ session: { accessToken: "access-1", refreshToken: "refresh-1", tenantId: TENANT }, sessionExpired: false, isHydrated: true });
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === "/v1/auth/token/refresh") {
        const { refresh_token } = JSON.parse(config.data as string) as { refresh_token: string };
        refreshCalls.push(refresh_token);
        // Mirrors auth-customer: a rotated refresh token is single-use.
        if (refresh_token !== "refresh-1" || refreshCalls.length > 1) {
          return respond(config, 401, { code: "REFRESH_TOKEN_REUSE" });
        }
        return respond(config, 200, { access_token: "access-2", refresh_token: "refresh-2", token_type: "Bearer", expires_in: 900 });
      }
      const authorization = config.headers.get("authorization");
      return authorization === `Bearer ${validAccessToken}` ? respond(config, 200, { ok: config.url }) : respond(config, 401, { code: "UNAUTHORIZED" });
    };
    httpClient.defaults.adapter = adapter;
  });

  it("shares one refresh across concurrent 401s and retries every request", async () => {
    const results = await Promise.all(["/v1/dashboard", "/v1/profile", "/v1/transactions"].map((url) => httpClient.get(url)));

    expect(refreshCalls).toEqual(["refresh-1"]);
    expect(results.map((result) => result.data)).toEqual([{ ok: "/v1/dashboard" }, { ok: "/v1/profile" }, { ok: "/v1/transactions" }]);
    expect(useSessionStore.getState().session?.refreshToken).toBe("refresh-2");
    expect(useSessionStore.getState().sessionExpired).toBe(false);
  });

  it("ends the session when the auth service rejects the refresh", async () => {
    useSessionStore.setState({ session: { accessToken: "access-1", refreshToken: "revoked", tenantId: TENANT } });
    await expect(httpClient.get("/v1/dashboard")).rejects.toMatchObject({ category: "authentication" });

    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().sessionExpired).toBe(true);
  });

  it("keeps the session when the refresh fails on the network", async () => {
    httpClient.defaults.adapter = async (config) => {
      if (config.url === "/v1/auth/token/refresh") {
        return Promise.reject(Object.assign(new Error("Network Error"), { isAxiosError: true, config, code: "ERR_NETWORK", toJSON: () => ({}) }));
      }
      return respond(config, 401, { code: "UNAUTHORIZED" });
    };

    await expect(httpClient.get("/v1/dashboard")).rejects.toMatchObject({ category: "authentication" });
    expect(useSessionStore.getState().session?.refreshToken).toBe("refresh-1");
    expect(useSessionStore.getState().sessionExpired).toBe(false);
  });
});
