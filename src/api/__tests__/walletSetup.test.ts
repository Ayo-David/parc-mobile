import { ApiError, fundingAccountSetupState, isWalletNotProvisioned } from "../errors";

describe("isWalletNotProvisioned", () => {
  it("recognises the BFF's wallet-setup response", () => {
    expect(isWalletNotProvisioned(new ApiError({ message: "Your wallet is still being set up", category: "dependency", status: 503, code: "WALLET_NOT_PROVISIONED", retryable: true }))).toBe(true);
  });

  it("treats other failures as real errors", () => {
    expect(isWalletNotProvisioned(new ApiError({ message: "A required dependency is unavailable", category: "dependency", status: 502, code: "DEPENDENCY_UNAVAILABLE" }))).toBe(false);
    expect(isWalletNotProvisioned(new Error("boom"))).toBe(false);
    expect(isWalletNotProvisioned(null)).toBe(false);
  });
});

describe("fundingAccountSetupState", () => {
  const error = (code: string, status: number) => new ApiError({ message: "m", category: "unknown", status, code });

  it("maps the funding-details answers to setup states", () => {
    expect(fundingAccountSetupState(error("FUNDING_ACCOUNT_NOT_FOUND", 404))).toBe("none");
    expect(fundingAccountSetupState(error("FUNDING_ACCOUNT_PENDING", 409))).toBe("pending");
    expect(fundingAccountSetupState(error("FUNDING_ACCOUNT_REJECTED", 422))).toBe("rejected");
  });

  it("leaves real failures to the normal error handling", () => {
    expect(fundingAccountSetupState(error("DEPENDENCY_UNAVAILABLE", 502))).toBeNull();
    expect(fundingAccountSetupState(new Error("offline"))).toBeNull();
  });
});
