import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { LivenessCameraFrame } from "@/features/onboarding/liveness/LivenessCameraFrame";
import { useTheme } from "@/theme";

const STEP_HOLD_MS = 1500;

const CHALLENGE_STEPS = [
  { heading: "Blink slowly", instruction: "Blink both eyes naturally" },
  { heading: "Turn your head slightly", instruction: "Slowly turn left, then right" },
  { heading: "Smile naturally", instruction: "Give us a natural smile" },
];

/**
 * Figma "Liveness 03 — Challenge (Blink)" (node 426:71, missing-mobile.md
 * §2.1) — one frame in Figma, reused here for all 3 anti-spoofing
 * challenge prompts the gap doc called for (blink/turn/smile) rather than
 * building 3 near-identical screens. Step advancement is a timer, not
 * real liveness detection — see LivenessCameraFrame's doc comment.
 */
export default function LivenessChallengeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [permission] = useCameraPermissions();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (permission && !permission.granted) {
      router.replace("/(onboarding)/face/permission-denied");
    }
  }, [permission, router]);

  useEffect(() => {
    if (!permission?.granted) return;
    const timer = setTimeout(() => {
      if (stepIndex + 1 < CHALLENGE_STEPS.length) {
        setStepIndex((current) => current + 1);
      } else {
        router.replace("/(onboarding)/face/verifying");
      }
    }, STEP_HOLD_MS);
    return () => clearTimeout(timer);
  }, [stepIndex, permission?.granted, router]);

  if (!permission?.granted) {
    return null;
  }

  const step = CHALLENGE_STEPS[stepIndex];

  return (
    <LivenessCameraFrame
      heading={step.heading}
      activeStep={stepIndex + 1}
      completedThroughStep={stepIndex}
      ovalBorderColor={theme.colors.success}
      statusDotColor={theme.colors.success}
      statusText="Face detected — hold still"
      helperText={`Step ${stepIndex + 1} of ${CHALLENGE_STEPS.length} · ${step.instruction}`}
    />
  );
}
