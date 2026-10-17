import { renderHook } from "@testing-library/react-native";

import { api } from "@/api/client";
import { queryClient } from "@/api/queryClient";
import { useSessionStore } from "@/state/stores/sessionStore";

import { useAdvanceOnboarding, useFinishOnboarding, useOnboardingStepRouter } from "../navigation";
import { ONBOARDING_STATUS_QUERY_KEY } from "../useOnboardingStatus";

const mockRouter = { canDismiss: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

const mockLogout = jest.fn();
jest.mock("@/auth/useAuth", () => ({ useAuth: () => ({ logout: mockLogout }) }));

// Importing Sentry starts a cleanup interval that keeps Jest from exiting.
jest.mock("@/observability/reportError", () => ({ reportError: jest.fn() }));

jest.mock("@/api/client", () => ({
  api: { getOnboardingStatus: jest.fn(), completeOnboarding: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function status(currentStep: string) {
  return { onboarding_id: "o1", status: "IN_PROGRESS", current_step: currentStep, completed_steps: [], expires_at: "", completed_at: null, updated_at: "" } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  useSessionStore.setState({ loginRedirectPending: false });
});

// Drops cached queries' GC timers so Jest can exit.
afterEach(() => queryClient.clear());

describe("useAdvanceOnboarding", () => {
  it("refetches status instead of trusting a fresh-but-outdated cache entry", async () => {
    // The step the customer just submitted, cached seconds ago (within the default 30s staleTime).
    queryClient.setQueryData(ONBOARDING_STATUS_QUERY_KEY, status("COMPLIANCE"));
    mockedApi.getOnboardingStatus.mockResolvedValue(status("INCOME"));

    const { result } = renderHook(() => useAdvanceOnboarding());
    await result.current();

    expect(mockedApi.getOnboardingStatus).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(onboarding)/income");
  });
});

describe("useOnboardingStepRouter", () => {
  it("clears earlier screens so back can't reach a completed step", () => {
    mockRouter.canDismiss.mockReturnValue(true);
    const { result } = renderHook(() => useOnboardingStepRouter());

    result.current("COMPLIANCE");

    expect(mockRouter.dismissAll).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/(onboarding)/compliance");
  });
});

describe("useFinishOnboarding", () => {
  it("completes onboarding, then signs out and flags the Login redirect", async () => {
    mockedApi.completeOnboarding.mockResolvedValue(status("COMPLETED"));
    const { result } = renderHook(() => useFinishOnboarding());

    await result.current(false);

    expect(mockedApi.completeOnboarding).toHaveBeenCalledWith({ biometricEnrolled: false });
    expect(mockLogout).toHaveBeenCalled();
    expect(useSessionStore.getState().loginRedirectPending).toBe(true);
  });

  it("stays signed in when completing fails", async () => {
    mockedApi.completeOnboarding.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useFinishOnboarding());

    await expect(result.current(false)).rejects.toThrow("offline");

    expect(mockLogout).not.toHaveBeenCalled();
    expect(useSessionStore.getState().loginRedirectPending).toBe(false);
  });
});
