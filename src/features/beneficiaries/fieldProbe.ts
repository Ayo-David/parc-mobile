/**
 * `GET /v1/beneficiaries` and the `POST` response are both prose-only in
 * the payment contract ("Customer-owned beneficiaries" / "Beneficiary
 * created") — no schema for either. Field names mirror the confirmed
 * `POST` request shape (`name`/`account_number`/`bank_code`) since a
 * reasonable API would echo its own input field names back, but that's
 * an assumption, not a confirmed response shape.
 */
export function firstString(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

/** Deterministically picks one of the caller's own theme colors by name hash — never a literal hex, per .clauderules. */
export function avatarColorFor(seed: string, palette: readonly string[]): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}
