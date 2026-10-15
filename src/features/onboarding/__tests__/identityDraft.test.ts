import { clearDraftBvn, getDraftBvn, getDraftIdentityName, maskNamePart, setDraftBvn, setDraftIdentityName } from "../identityDraft";

describe("maskNamePart", () => {
  it("keeps the first three letters and hides the rest with a fixed mask", () => {
    expect(maskNamePart("David")).toBe("DAV**");
    expect(maskNamePart("Ajayi-Ogunleye")).toBe("AJA**");
  });

  it("leaves names of three letters or fewer as they are", () => {
    expect(maskNamePart(" ayo ")).toBe("AYO");
    expect(maskNamePart("Jo")).toBe("JO");
  });
});

describe("identity draft", () => {
  it("clears the registered name along with the BVN", () => {
    setDraftBvn("12345678901");
    setDraftIdentityName({ first_name: "Ayo", middle_name: "David", last_name: "Ajayi" });
    expect(getDraftIdentityName()?.first_name).toBe("Ayo");

    clearDraftBvn();

    expect(getDraftBvn()).toBeNull();
    expect(getDraftIdentityName()).toBeNull();
  });
});
