import { isValidHexColor, withAlpha } from "../colorUtils";

describe("isValidHexColor", () => {
  it("accepts 3, 6, and 8 digit hex colors", () => {
    expect(isValidHexColor("#000")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#000000FF")).toBe(true);
  });

  it("rejects non-hex and malformed values", () => {
    expect(isValidHexColor("black")).toBe(false);
    expect(isValidHexColor("#12345")).toBe(false);
    expect(isValidHexColor("rgba(0,0,0,1)")).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(123)).toBe(false);
  });
});

describe("withAlpha", () => {
  it("converts a hex color into an rgba string at the given alpha", () => {
    expect(withAlpha("#00C896", 0.12)).toBe("rgba(0, 200, 150, 0.12)");
  });

  it("clamps alpha into the 0-1 range", () => {
    expect(withAlpha("#000000", 5)).toBe("rgba(0, 0, 0, 1)");
    expect(withAlpha("#000000", -1)).toBe("rgba(0, 0, 0, 0)");
  });
});
