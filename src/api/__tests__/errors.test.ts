import { categorizeStatus, extractServerMessage } from "../errors";

describe("categorizeStatus", () => {
  it("maps known statuses to the right category", () => {
    expect(categorizeStatus(401)).toBe("authentication");
    expect(categorizeStatus(403)).toBe("authorization");
    expect(categorizeStatus(409)).toBe("conflict");
    expect(categorizeStatus(422)).toBe("validation");
    expect(categorizeStatus(400)).toBe("validation");
    expect(categorizeStatus(429)).toBe("rate_limit");
    expect(categorizeStatus(500)).toBe("dependency");
    expect(categorizeStatus(503)).toBe("dependency");
  });

  it("falls back to unknown for anything else", () => {
    expect(categorizeStatus(404)).toBe("unknown");
    expect(categorizeStatus(418)).toBe("unknown");
  });
});

describe("extractServerMessage", () => {
  it("reads message/code/correlation_id from a well-formed ApiError-shaped body", () => {
    const result = extractServerMessage({ message: "Invalid passcode", code: "INVALID_PASSCODE", correlation_id: "abc-123" });
    expect(result).toEqual({ message: "Invalid passcode", code: "INVALID_PASSCODE", correlationId: "abc-123" });
  });

  it("returns all-null for a non-object body without throwing", () => {
    expect(extractServerMessage(null)).toEqual({ message: null, code: null, correlationId: null });
    expect(extractServerMessage("plain string body")).toEqual({ message: null, code: null, correlationId: null });
    expect(extractServerMessage(undefined)).toEqual({ message: null, code: null, correlationId: null });
  });

  it("ignores fields that are present but the wrong type", () => {
    const result = extractServerMessage({ message: 123, code: null, correlation_id: {} });
    expect(result).toEqual({ message: null, code: null, correlationId: null });
  });
});
