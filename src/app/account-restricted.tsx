import { useRouter } from "expo-router";

import { Button } from "@/components/Button/Button";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";

/**
 * Figma "System 07 — Account Restricted" (node 436:411,
 * missing-mobile.md §1) — `Customer.status === "RESTRICTED"` is a real,
 * confirmed field (`GET /v1/profile`) that previously had no
 * corresponding screen anywhere; a restricted customer would have just
 * seen a broken/erroring dashboard. Rendered as a real route (not an
 * early-return in `_layout.tsx`, which runs before the root `<Stack>`
 * mounts and so has no navigation context) so "Contact support" can
 * actually navigate through the real Support-ticket flow (MOB-18).
 */
export default function AccountRestrictedScreen() {
  const router = useRouter();
  return (
    <StatusScreenLayout
      icon="shield-outline"
      tone="error"
      title="Account restricted"
      body="We've temporarily limited some actions on your account while we review recent activity. Contact support if you think this is a mistake."
      showBackButton={false}
      footer={<Button label="Contact support" onPress={() => router.push("/profile/support/new")} />}
    />
  );
}
