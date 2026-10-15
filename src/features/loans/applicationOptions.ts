/**
 * Shortcut choices for the loan form (Figma 237:12857 amount chips, 237:12874
 * tenure chips), derived only from the product's own server-published bounds.
 * They are conveniences for picking a value inside those bounds — the quote
 * the server returns for the chosen value is what the customer reviews.
 */

const ONE_THOUSAND_NAIRA_MINOR = 100_000n;

/** min, ¼·max, ½·max, max — each floored to a whole ₦1,000 and kept within [min, max]. */
export function amountPresets(minMinor: string, maxMinor: string): string[] {
  const min = BigInt(minMinor);
  const max = BigInt(maxMinor);
  if (max <= 0n || min > max) return [];
  const floorToThousand = (value: bigint) => (value / ONE_THOUSAND_NAIRA_MINOR) * ONE_THOUSAND_NAIRA_MINOR;
  const candidates = [min, floorToThousand(max / 4n), floorToThousand(max / 2n), max];
  const unique = [...new Set(candidates.filter((value) => value >= min && value <= max).map(String))];
  return unique.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
}

/** Days sent to the server for a tenure chosen in months (the form's unit, per Figma). */
export const DAYS_PER_MONTH = 30;

const MONTH_CHOICES = [1, 3, 6, 9, 12, 18, 24, 36];

export function tenureMonthOptions(minDays: number, maxDays: number): number[] {
  return MONTH_CHOICES.filter((months) => months * DAYS_PER_MONTH >= minDays && months * DAYS_PER_MONTH <= maxDays);
}

/** "24.0000000000" → "24%"; "2.5000" → "2.5%". String-only — no float math. */
export function formatRatePercent(rate: string): string {
  const [whole, fraction = ""] = rate.split(".");
  const trimmed = fraction.replace(/0+$/, "");
  return `${whole}${trimmed ? `.${trimmed}` : ""}%`;
}
