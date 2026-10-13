import { periodRange } from "../periodRange";

const TODAY = new Date(2026, 9, 12); // 12 Oct 2026, local time

describe("periodRange", () => {
  it("this month runs from the 1st to today", () => {
    expect(periodRange("this_month", TODAY)).toEqual({ dateFrom: "2026-10-01", dateTo: "2026-10-12" });
  });
  it("last month is the whole previous calendar month", () => {
    expect(periodRange("last_month", TODAY)).toEqual({ dateFrom: "2026-09-01", dateTo: "2026-09-30" });
  });
  it("last 3 and 6 months start on the 1st and end today", () => {
    expect(periodRange("last_3_months", TODAY)).toEqual({ dateFrom: "2026-08-01", dateTo: "2026-10-12" });
    expect(periodRange("last_6_months", TODAY)).toEqual({ dateFrom: "2026-05-01", dateTo: "2026-10-12" });
  });
  it("crosses the year boundary", () => {
    expect(periodRange("last_month", new Date(2027, 0, 5))).toEqual({ dateFrom: "2026-12-01", dateTo: "2026-12-31" });
  });
});
