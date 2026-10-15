import { onboardingVerificationResultSchema } from "../schemas";

const verification = {
  id: "8f2d7c1e-3b4a-4c5d-9e6f-1a2b3c4d5e6f",
  identity_type: "NIN",
  masked_identity: "*******0001",
  status: "VERIFIED",
  created_at: "2026-10-13T10:00:00.000Z",
};
const onboarding = {
  onboarding_id: "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  status: "IN_PROGRESS",
  current_step: "FACE_VERIFICATION",
  completed_steps: ["PHONE_VERIFICATION", "EMAIL", "IDENTITY"],
  expires_at: "2026-10-20T10:00:00.000Z",
  completed_at: null,
  updated_at: "2026-10-13T10:00:00.000Z",
};

describe("onboardingVerificationResultSchema", () => {
  it("accepts a Prembly result with the registered name", () => {
    const parsed = onboardingVerificationResultSchema.parse({
      verification: { ...verification, provider: "PREMBLY" },
      onboarding,
      identity: { first_name: "Ada", middle_name: null, last_name: "Okafor" },
    });
    expect(parsed.identity).toEqual({ first_name: "Ada", middle_name: null, last_name: "Okafor" });
  });

  it("still accepts a VerifyMe result without a name", () => {
    expect(onboardingVerificationResultSchema.safeParse({ verification: { ...verification, provider: "VERIFYME" }, onboarding }).success).toBe(true);
  });
});
