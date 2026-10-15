import { formatMoney, parseMajorUnitsToMinor, formatMoneyCompact } from "../money";

describe("formatMoney", () => {
  it("formats NGN with the naira symbol and thousands separators", () => {
    expect(formatMoney({ amount_minor: "150050", currency: "NGN" })).toBe("₦1,500.50");
    expect(formatMoney({ amount_minor: "100", currency: "NGN" })).toBe("₦1.00");
    expect(formatMoney({ amount_minor: "0", currency: "NGN" })).toBe("₦0.00");
  });

  it("handles negative amounts", () => {
    expect(formatMoney({ amount_minor: "-150050", currency: "NGN" })).toBe("-₦1,500.50");
  });

  it("falls back to the currency code for an unmapped currency", () => {
    expect(formatMoney({ amount_minor: "100000", currency: "USD" })).toBe("USD 1,000.00");
  });
});

describe("parseMajorUnitsToMinor", () => {
  it("converts whole and fractional naira amounts without floating point", () => {
    expect(parseMajorUnitsToMinor("1500")).toBe("150000");
    expect(parseMajorUnitsToMinor("1500.5")).toBe("150050");
    expect(parseMajorUnitsToMinor("1500.05")).toBe("150005");
    expect(parseMajorUnitsToMinor("0.1")).toBe("10");
  });

  // A first draft of the transfer-amount screen used Math.round(Number(x) * 100)
  // here, which the project's own no-floating-point-money rule forbids even
  // where it happens to round correctly for small values — this uses only
  // string/BigInt arithmetic instead, exercised across a spread of values.
  it("stays exact across a range of values, never touching floating point", () => {
    expect(parseMajorUnitsToMinor("19.1")).toBe("1910");
    expect(parseMajorUnitsToMinor("0.29")).toBe("29");
    expect(parseMajorUnitsToMinor("999999999.99")).toBe("99999999999");
  });

  it("rejects malformed input instead of guessing", () => {
    expect(parseMajorUnitsToMinor("")).toBeNull();
    expect(parseMajorUnitsToMinor("abc")).toBeNull();
    expect(parseMajorUnitsToMinor("-100")).toBeNull();
    expect(parseMajorUnitsToMinor("100.999")).toBeNull();
  });
});

describe("formatMoneyCompact", () => {
  it.each([
    ["10000000", "₦100k"],
    ["50000000", "₦500k"],
    ["200000000", "₦2M"],
    ["150000000", "₦1.5M"],
    ["199999999", "₦1.9M"],
    ["100000", "₦1k"],
    ["50000", "₦500"],
  ])("formats %s kobo as %s", (amountMinor, expected) => {
    expect(formatMoneyCompact({ amount_minor: amountMinor, currency: "NGN" })).toBe(expected);
  });
});
