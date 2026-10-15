import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { LivenessCameraFrame } from "@/features/onboarding/liveness/LivenessCameraFrame";
import { useTheme } from "@/theme";

const FACE_FOUND_DELAY_MS = 1400;
const AUTO_ADVANCE_DELAY_MS = 1100;

/**
 * Figma "Liveness 02 — Camera Capture" (node 426:55, missing-mobile.md
 * §2.1). Renders a real live front-camera preview via expo-camera; "face
 * detected" is a timer, not real computer vision — see
 * LivenessCameraFrame's doc comment for why.
 */
export default function LivenessCaptureScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      router.replace("/(onboarding)/face/permission-denied");
    }
  }, [permission, router]);

  useEffect(() => {
    if (!permission?.granted) return;
    const detectTimer = setTimeout(() => setFaceDetected(true), FACE_FOUND_DELAY_MS);
    return () => clearTimeout(detectTimer);
  }, [permission?.granted]);

  useEffect(() => {
    if (!faceDetected) return;
    const advanceTimer = setTimeout(() => router.replace("/(onboarding)/face/challenge"), AUTO_ADVANCE_DELAY_MS);
    return () => clearTimeout(advanceTimer);
  }, [faceDetected, router]);

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
    },
    body: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });

  if (!permission || (!permission.granted && permission.canAskAgain)) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.body}>Requesting camera access…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.body}>Camera access is required to continue.</Text>
          <Button label="Open Settings" onPress={() => router.replace("/(onboarding)/face/permission-denied")} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <LivenessCameraFrame
      heading="Position your face in the frame"
      ovalBorderColor={faceDetected ? theme.colors.success : theme.colors.secondary}
      statusDotColor={faceDetected ? theme.colors.success : theme.colors.warning}
      statusText={faceDetected ? "Face detected — hold still" : "Looking for a face…"}
      helperText="Make sure you're in a well-lit area and your whole face is visible."
    />
  );
}
