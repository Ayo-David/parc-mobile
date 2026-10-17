import { ACCOUNT_SETUP_POLL_LIMIT_MS, isAccountSetupStalled, useFundingSetupStore } from "../fundingSetupStore";
import { useSessionStore } from "../sessionStore";

const session = { accessToken: "a", refreshToken: "r", tenantId: "t" };

beforeEach(() => {
  useFundingSetupStore.setState({ pendingSince: null });
  useSessionStore.setState({ session: null });
});

describe("isAccountSetupStalled", () => {
  it("stalls only once a wait has reached the polling limit", () => {
    expect(isAccountSetupStalled(null, 10 * ACCOUNT_SETUP_POLL_LIMIT_MS)).toBe(false);
    expect(isAccountSetupStalled(1_000, 1_000 + ACCOUNT_SETUP_POLL_LIMIT_MS - 1)).toBe(false);
    expect(isAccountSetupStalled(1_000, 1_000 + ACCOUNT_SETUP_POLL_LIMIT_MS)).toBe(true);
  });
});

describe("useFundingSetupStore", () => {
  it("starts the wait on the first pending answer and keeps it through later ones", () => {
    const { observe } = useFundingSetupStore.getState();
    observe(true, 1_000);
    observe(true, 5_000);
    expect(useFundingSetupStore.getState().pendingSince).toBe(1_000);
  });

  it("ends the wait on any non-pending answer", () => {
    const { observe } = useFundingSetupStore.getState();
    observe(true, 1_000);
    observe(false, 2_000);
    expect(useFundingSetupStore.getState().pendingSince).toBeNull();
  });

  it("restarts the wait when the customer checks again", () => {
    useFundingSetupStore.getState().observe(true, 1_000);
    useFundingSetupStore.getState().restart(9_000);
    expect(useFundingSetupStore.getState().pendingSince).toBe(9_000);
  });

  it("forgets the wait when the session ends", () => {
    useSessionStore.setState({ session });
    useFundingSetupStore.getState().observe(true, 1_000);
    useSessionStore.getState().clearSession();
    expect(useFundingSetupStore.getState().pendingSince).toBeNull();
  });
});
