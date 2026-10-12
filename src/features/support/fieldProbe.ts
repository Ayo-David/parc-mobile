import type { StatusTone } from "@/theme";

/**
 * `GET /v1/support/faqs`/`GET /v1/support/tickets` document zero response
 * schema anywhere — not just thinly in the Mobile BFF's own contract, but
 * in the underlying tenant-admin service's OpenAPI too (both are prose-only:
 * "Effective published tenant FAQ catalogue" / "Customer-owned support
 * tickets", no schema block). Every field name here is a best-effort probe
 * of plausible field names, not a confirmed shape.
 */
export function firstString(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export function ticketStatusTone(status: string): StatusTone {
  if (/resolv|closed|complete/i.test(status)) return "success";
  if (/progress|open|pending|await/i.test(status)) return "warning";
  return "info";
}
