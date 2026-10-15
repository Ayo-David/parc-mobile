import { relativeTime } from "../relativeTime";

const NOW = new Date("2026-10-12T12:00:00Z");

describe("relativeTime", () => {
  it.each([
    ["2026-10-12T11:59:30Z", "Just now"],
    ["2026-10-12T11:15:00Z", "45m ago"],
    ["2026-10-12T10:00:00Z", "2h ago"],
    ["2026-10-11T12:00:00Z", "1d ago"],
    ["2026-09-27T12:00:00Z", "15d ago"],
  ])("formats %s as %s", (iso, expected) => {
    expect(relativeTime(iso, NOW)).toBe(expected);
  });

  it("never shows a negative age for clock skew", () => {
    expect(relativeTime("2026-10-12T12:05:00Z", NOW)).toBe("Just now");
  });
});
