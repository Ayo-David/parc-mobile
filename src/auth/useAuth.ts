import { useMutation } from "@tanstack/react-query";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
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

  const loginMutation = useMutation({
    mutationFn: async (params: LoginParams): Promise<StoredSession> => {
      const deviceId = await getOrCreateDeviceId();
      const idempotencyKey = createIdempotencyKey();
      const result = await api.loginWithPasscode({ ...params, deviceId, idempotencyKey });

      if ("mfa_required" in result) {
        // Optional, tenant-configurable MFA (parc-interview-answers.md §5) isn't
        // built in this sprint's login flow yet — surface distinctly rather than
        // silently failing.
        throw new ApiError({
          message: "This account requires an additional verification step that isn't supported yet.",
          category: "authorization",
          status: null,
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
