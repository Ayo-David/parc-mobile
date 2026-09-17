import type { Money } from "@/api/schemas";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
};

/**
 * Per the backend's own invariant, money is an integer-minor-unit decimal
 * string with an explicit currency — this only ever formats a value the
 * server already computed, using BigInt/string arithmetic so no floating
 * point ever touches a monetary amount on the client.
 */
export function formatMoney(money: Money): string {
  const isNegative = money.amount_minor.startsWith("-");
  const digits = isNegative ? money.amount_minor.slice(1) : money.amount_minor;
  const minorUnits = BigInt(digits);
  const factor = 100n;
  const majorUnits = minorUnits / factor;
  const decimalPart = (minorUnits % factor).toString().padStart(2, "0");
  const majorWithSeparators = majorUnits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = CURRENCY_SYMBOLS[money.currency] ?? `${money.currency} `;
  return `${isNegative ? "-" : ""}${symbol}${majorWithSeparators}.${decimalPart}`;
}

/**
 * Converts a customer-entered major-unit amount string (e.g. "1500.5") into
 * an integer minor-unit string (e.g. "150050"), using only string/BigInt
 * arithmetic — never `Number(...) * 100`, which can misround real values
 * under floating point. Returns null for anything that isn't a plain
 * non-negative decimal with at most 2 fraction digits.
 */
export function parseMajorUnitsToMinor(input: string): string | null {
  const trimmed = input.trim();
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [wholePart, fractionPart = ""] = trimmed.split(".");
  const paddedFraction = fractionPart.padEnd(2, "0");
  const combined = `${wholePart}${paddedFraction}`.replace(/^0+(?=\d)/, "");
  return combined;
}
