import { toLoginIdentifier } from "../identifier";

describe("toLoginIdentifier", () => {
  it.each(["+2348020000001", "2348020000001", "08020000001", "8020000001", " 0802 000 0001 ", "0802-000-0001", "+234 (802) 000 0001", " 2348020000001"])(
    "canonicalizes the Nigerian mobile number %p to E.164",
    (input) => {
      expect(toLoginIdentifier(input)).toEqual({ kind: "phone", value: "+2348020000001" });
    },
  );

  it("lowercases and trims email addresses", () => {
    expect(toLoginIdentifier("  Customer-Alpha@PR01.parc.invalid ")).toEqual({ kind: "email", value: "customer-alpha@pr01.parc.invalid" });
  });

  it.each(["", "abc", "0802000000", "080200000011", "06020000001", "+2338020000001", "name@", "@domain.com", "a b@c.com"])("rejects %p", (input) => {
    expect(toLoginIdentifier(input)).toBeNull();
  });
});
