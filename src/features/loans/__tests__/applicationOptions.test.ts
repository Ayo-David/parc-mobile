import { amountPresets, formatRatePercent, tenureMonthOptions } from "../applicationOptions";
import { formatTenureDays } from "../tenure";

describe("loan application options", () => {
  it("derives amount shortcuts from the live PR-01 product bounds (₦1,000–₦500,000)", () => {
    expect(amountPresets("100000", "50000000")).toEqual(["100000", "12500000", "25000000", "50000000"]);
  });

  it("matches Figma's Personal Loan chips for a ₦50k–₦2M product", () => {
    expect(amountPresets("5000000", "200000000")).toEqual(["5000000", "50000000", "100000000", "200000000"]);
  });

  it("never offers an amount outside the bounds", () => {
    expect(amountPresets("40000000", "50000000")).toEqual(["40000000", "50000000"]);
    expect(amountPresets("100", "0")).toEqual([]);
  });

  it("offers only month tenures inside the product's day range", () => {
    expect(tenureMonthOptions(30, 365)).toEqual([1, 3, 6, 9, 12]);
    expect(tenureMonthOptions(90, 180)).toEqual([3, 6]);
  });

  it("formats rates and tenures for display", () => {
    expect(formatRatePercent("24.0000000000")).toBe("24%");
    expect(formatRatePercent("2.5000")).toBe("2.5%");
    expect(formatTenureDays(30)).toBe("30 days");
    expect(formatTenureDays(365)).toBe("12 months");
  });
});
