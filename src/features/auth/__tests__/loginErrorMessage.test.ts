import { ApiError } from "@/api/errors";

import { loginErrorMessage, MFA_NOT_SUPPORTED_CODE } from "../loginErrorMessage";

function apiError(category: ApiError["category"], code: string | null = null) {
  return new ApiError({ message: "server text", category, status: null, code });
}

describe("loginErrorMessage", () => {
  it("never reveals whether the account exists on a 401", () => {
    expect(loginErrorMessage(apiError("authentication", "AUTHENTICATION_FAILED"))).toBe("Incorrect phone number, email or passcode. Check your details and try again.");
  });

  it("explains lockout on rate limiting", () => {
    expect(loginErrorMessage(apiError("rate_limit", "RATE_LIMITED"))).toMatch(/Too many attempts/);
  });

  it("explains the unsupported MFA step distinctly", () => {
    expect(loginErrorMessage(apiError("authorization", MFA_NOT_SUPPORTED_CODE))).toMatch(/extra verification step/);
    expect(loginErrorMessage(apiError("authorization", "MFA_ENROLLMENT_REQUIRED"))).toMatch(/extra verification step/);
  });

  it("distinguishes offline from server trouble", () => {
    expect(loginErrorMessage(apiError("network"))).toMatch(/internet connection/);
    expect(loginErrorMessage(apiError("dependency"))).toMatch(/having trouble/);
  });

  it("never surfaces raw server text or non-ApiError details", () => {
    expect(loginErrorMessage(apiError("unknown"))).not.toContain("server text");
    expect(loginErrorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });
});
