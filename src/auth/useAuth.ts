import { useMutation } from "@tanstack/react-query";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { toLoginIdentifier } from "@/features/auth/identifier";
import { MFA_NOT_SUPPORTED_CODE } from "@/features/auth/loginErrorMessage";
import { useSessionStore } from "@/state/stores/sessionStore";

import { getOrCreateDeviceId } from "./deviceId";
import { tokenStorage, type StoredSession } from "./tokenStorage";

export interface LoginParams {
  tenantId: string;
  identifier: string;
  passcode: string;
}

export function useAuth() {
  const session = useSessionStore((state) => state.session);
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setSessionExpired = useSessionStore((state) => state.setSessionExpired);

  const loginMutation = useMutation({
    mutationFn: async (params: LoginParams): Promise<StoredSession> => {
      const deviceId = await getOrCreateDeviceId();
      const idempotencyKey = createIdempotencyKey();
      // Canonicalized here, at the one point every login passes through: the
      // identifier reaches the passcode screen as a route param, and a
      // deep-linked URL is decoded once before its query is parsed, which
      // turns "+234…" into " 234…" — a value auth-customer can never match.
      const identifier = toLoginIdentifier(params.identifier)?.value ?? params.identifier.trim();
      const result = await api.loginWithPasscode({ ...params, identifier, deviceId, idempotencyKey });

      if ("mfa_required" in result) {
        // Tenant-configurable customer MFA (parc-interview-answers.md §5):
        // auth-customer issues an SMS/EMAIL OTP challenge here and completes
        // it via POST /v1/auth/mfa/verify, but the Mobile BFF doesn't relay
        // that route (confirmed in parc-mobile-bff/src/app.ts), so the app
        // has no way to finish this login. Surfaced distinctly, not faked.
        throw new ApiError({
          message: "This account requires an additional verification step that isn't supported yet.",
          category: "authorization",
          status: null,
          code: MFA_NOT_SUPPORTED_CODE,
        });
      }

      const stored: StoredSession = {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        tenantId: params.tenantId,
      };
      await tokenStorage.save(stored);
      setSession(stored);
      return stored;
    },
  });

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      // Best-effort server-side session revocation — local logout must
      // still succeed even if the network call fails (e.g. offline).
    }
    await tokenStorage.clear();
    setSessionExpired(false);
    clearSession();
  };

  return {
    session,
    isAuthenticated: session !== null,
    isHydrated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error as ApiError | null,
    logout,
  };
}
