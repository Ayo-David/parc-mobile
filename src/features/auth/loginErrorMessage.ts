import { ApiError } from "@/api/errors";

/** Set by useAuth when the tenant requires login MFA, which the Mobile BFF doesn't expose a verify route for yet. */
export const MFA_NOT_SUPPORTED_CODE = "MFA_NOT_SUPPORTED";

/**
 * Customer-facing copy for a failed passcode login. auth-customer returns
 * the same 401 AUTHENTICATION_FAILED for an unknown identifier, a wrong
 * passcode, and a locked account, so the copy deliberately doesn't say
 * which — that would leak whether an account exists.
 */
export function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }
  if (error.code === MFA_NOT_SUPPORTED_CODE || error.code === "MFA_ENROLLMENT_REQUIRED") {
    return "Your account needs an extra verification step that this app doesn't support yet. Please contact support.";
  }
  switch (error.category) {
    case "authentication":
      return "Incorrect phone number, email or passcode. Check your details and try again.";
    case "rate_limit":
      return "Too many attempts. For your security, please wait a few minutes before trying again.";
    case "network":
      return "We couldn't reach Parc. Check your internet connection and try again.";
    case "dependency":
      return "Parc is having trouble right now. Please try again shortly.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}
