/**
 * GET /v1/security is prose-only in the contract; the live shape (confirmed
 * 2026-10-12 against the shared server) is
 *   { credentials: [...], devices: [{ id, device_name, platform, status, is_trusted, last_seen_at }],
 *     active_sessions: [{ id, device_id, authentication_methods, mfa_verified_at, last_activity_at, expires_at }] }
 * where devices[].id and active_sessions[].device_id are the client-generated
 * `device_id` the app sends at login (auth/deviceId.ts).
 */

export function extractEntries(summary: Record<string, unknown>, keys: string[]): Record<string, unknown>[] {
  for (const key of keys) {
    const value = summary[key];
    if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }
  return [];
}

function text(entry: Record<string, unknown>, field: string): string | null {
  const value = entry[field];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * True for the device/session belonging to this install, which must never be
 * offered a "revoke" action (that would sign the customer out of the phone in
 * their hand). With no device id known yet, everything is treated as current.
 */
export function isCurrentEntry(entry: Record<string, unknown>, currentDeviceId: string | undefined): boolean {
  if (!currentDeviceId) return true;
  const id = currentDeviceId.toLowerCase();
  return text(entry, "id")?.toLowerCase() === id || text(entry, "device_id")?.toLowerCase() === id;
}

const PLATFORM_LABELS: Record<string, string> = { IOS: "iPhone", ANDROID: "Android phone", WEB: "Web browser" };

export function describeDevice(entry: Record<string, unknown>): { title: string; subtitle: string | null } {
  const platform = text(entry, "platform");
  const title = text(entry, "device_name") ?? (platform ? (PLATFORM_LABELS[platform.toUpperCase()] ?? platform) : "Unnamed device");
  const lastSeen = formatWhen(text(entry, "last_seen_at"));
  return { title, subtitle: lastSeen ? `Last seen ${lastSeen}` : entry.is_trusted === true ? "Trusted device" : null };
}

const METHOD_LABELS: Record<string, string> = { LOGIN_PASSCODE: "Passcode", PASSWORD: "Password", PASSKEY: "Passkey", BIOMETRIC: "Biometric" };

export function describeSession(entry: Record<string, unknown>): { title: string; subtitle: string | null } {
  const methods = Array.isArray(entry.authentication_methods) ? entry.authentication_methods.filter((m): m is string => typeof m === "string") : [];
  const title = methods.length > 0 ? `${methods.map((m) => METHOD_LABELS[m] ?? m).join(" + ")} sign-in` : "Sign-in session";
  const lastActive = formatWhen(text(entry, "last_activity_at"));
  const expires = formatWhen(text(entry, "expires_at"));
  return { title, subtitle: lastActive ? `Last active ${lastActive}` : expires ? `Expires ${expires}` : null };
}
