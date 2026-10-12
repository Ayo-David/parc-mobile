import { useRouter } from "expo-router";
import { Linking } from "react-native";

import { Button } from "@/components/Button/Button";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";

/**
 * Figma "Liveness 07 — Camera Permission Denied" (node 426:266,
 * missing-mobile.md §2.1) — the one liveness state Figma flagged as
 * entirely missing before this phase: what happens if the customer denies
 * the OS camera permission.
 */
export default function LivenessPermissionDeniedScreen() {
  const router = useRouter();

  return (
    <StatusScreenLayout
      icon="videocam-off-outline"
      tone="neutral"
      title="Camera access needed"
      body="Parc needs your camera to verify your identity. Turn on camera access in your phone's Settings to continue."
      footer={
        <>
          <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
          <Button label="Not now" variant="ghost" onPress={() => router.replace("/(onboarding)/face")} />
        </>
      }
    />
  );
}
