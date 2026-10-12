import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { Button } from "@/components/Button/Button";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";

/**
 * Figma "Liveness 05 — Manual Review Pending" (node 426:156,
 * missing-mobile.md §2.1) — the honest "we're still checking" moment for
 * `KycVerification.status === "MANUAL_REVIEW"`, which the confirmed
 * schema has always supported but nothing in Figma rendered before now.
 * Continuing refetches onboarding status rather than assuming the next
 * step, matching every other transitional confirmation screen in this
 * flow (identity-verified.tsx, passcode-success.tsx) — the customer can
 * keep completing their profile while the review finishes in the background.
 */
export default function LivenessManualReviewScreen() {
  const advanceOnboarding = useAdvanceOnboarding();

  return (
    <StatusScreenLayout
      icon="time-outline"
      tone="warning"
      title="We're still checking"
      body="Your face scan needs a closer look by our verification team. This is normal and usually takes less than 24 hours — we'll notify you the moment it's done."
      showBackButton={false}
      footer={<Button label="Continue setting up your account" onPress={() => void advanceOnboarding()} />}
    />
  );
}
