import { overlapToReveal } from "../KeyboardAwareScrollView";

describe("overlapToReveal", () => {
  it("does nothing when the input is already above the keyboard", () => {
    expect(overlapToReveal({ inputBottom: 300, viewportBottom: 700, keyboardTop: 500, margin: 16 })).toBe(0);
  });

  it("scrolls far enough to clear the keyboard plus the margin", () => {
    expect(overlapToReveal({ inputBottom: 560, viewportBottom: 800, keyboardTop: 500, margin: 16 })).toBe(76);
  });

  it("uses the scroll view's own bottom when it already sits above the keyboard", () => {
    expect(overlapToReveal({ inputBottom: 460, viewportBottom: 440, keyboardTop: 500, margin: 16 })).toBe(36);
  });
});
