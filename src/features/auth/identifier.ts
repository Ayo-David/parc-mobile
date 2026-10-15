export type LoginIdentifier = { kind: "phone" | "email"; value: string };

// Mirrors auth-customer's registration rule (onboarding-router.ts:
// /^\+234[789][01][0-9]{8}$/). Login and passcode recovery look the
// customer up by an exact match on that stored E.164 value, after only
// trim().toLowerCase() — so "0802 000 0001" must be canonicalized here or
// it can never match.
const NG_SUBSCRIBER = "([789][01]\\d{8})";
const PHONE_FORMS = [new RegExp(`^\\+234${NG_SUBSCRIBER}$`), new RegExp(`^234${NG_SUBSCRIBER}$`), new RegExp(`^0${NG_SUBSCRIBER}$`), new RegExp(`^${NG_SUBSCRIBER}$`)];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Converts what a customer types into the canonical identifier the server
 * stores: a lowercased email, or a Nigerian mobile number in E.164 form.
 * Returns null when the input is neither.
 */
export function toLoginIdentifier(input: string): LoginIdentifier | null {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    return EMAIL_PATTERN.test(email) ? { kind: "email", value: email } : null;
  }
  const compact = trimmed.replace(/[\s().-]/g, "");
  for (const pattern of PHONE_FORMS) {
    const match = pattern.exec(compact);
    if (match) {
      return { kind: "phone", value: `+234${match[1]}` };
    }
  }
  return null;
}
