import { useCameraPermissions, type CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/Button/Button";
import { LivenessCameraFrame } from "@/features/onboarding/liveness/LivenessCameraFrame";
import { MAX_SELFIE_BASE64_LENGTH, pickSelfiePictureSize, setDraftSelfie } from "@/features/onboarding/liveness/selfie";
import { useTheme } from "@/theme";

const STEP_HOLD_MS = 1500;
/** Retried once at lower quality if the first photo is over the upload limit. */
const CAPTURE_QUALITIES = [0.6, 0.3];

const CHALLENGE_STEPS = [
  { heading: "Blink slowly", instruction: "Blink both eyes naturally" },
  { heading: "Turn your head slightly", instruction: "Slowly turn left, then right" },
  // Last, because the selfie is taken here: a neutral front-on face matches the BVN photo best.
  { heading: "Look straight at the camera", instruction: "Hold still while we take your photo" },
];

/**
 * Figma "Liveness 03 — Challenge (Blink)" (node 426:71, missing-mobile.md
 * §2.1) — one frame in Figma, reused here for all 3 challenge prompts
 * rather than building 3 near-identical screens. Step advancement is a
 * timer, not on-device liveness detection — see LivenessCameraFrame's doc
 * comment. At the end of the last prompt the screen takes one selfie and
 * hands it to verifying.tsx, which sends it to the backend for the KYC
 * provider's liveness check and BVN face match.
 */
export default function LivenessChallengeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [permission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>();
  const [stepIndex, setStepIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [captureFailed, setCaptureFailed] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      router.replace("/(onboarding)/face/permission-denied");
    }
  }, [permission, router]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    cameraRef.current
      ?.getAvailablePictureSizesAsync()
      .then((sizes) => setPictureSize(pickSelfiePictureSize(sizes)))
      .catch(() => undefined);
  }, []);

  const captureSelfie = useCallback(async () => {
    setCapturing(true);
    try {
      for (const quality of CAPTURE_QUALITIES) {
        const picture = await cameraRef.current?.takePictureAsync({ base64: true, quality, shutterSound: false });
        if (picture?.base64 && picture.base64.length <= MAX_SELFIE_BASE64_LENGTH) {
          setDraftSelfie(picture.base64);
          router.replace("/(onboarding)/face/verifying");
          return;
        }
      }
      setCaptureFailed(true);
    } catch {
      setCaptureFailed(true);
    } finally {
      setCapturing(false);
    }
  }, [router]);

  const isLastStep = stepIndex === CHALLENGE_STEPS.length - 1;

  useEffect(() => {
    if (!permission?.granted || captureFailed || capturing) return;
    // The last prompt waits for the camera so the selfie can be taken.
    if (isLastStep && !cameraReady) return;
    const timer = setTimeout(() => {
      if (isLastStep) void captureSelfie();
      else setStepIndex((current) => current + 1);
    }, STEP_HOLD_MS);
    return () => clearTimeout(timer);
  }, [stepIndex, isLastStep, cameraReady, captureFailed, capturing, permission?.granted, captureSelfie]);

  if (!permission?.granted) {
    return null;
  }

  const step = CHALLENGE_STEPS[stepIndex];

  return (
    <LivenessCameraFrame
      heading={captureFailed ? "We couldn't take your photo" : step.heading}
      cameraRef={cameraRef}
      pictureSize={pictureSize}
      onCameraReady={handleCameraReady}
      activeStep={stepIndex + 1}
      completedThroughStep={stepIndex}
      ovalBorderColor={captureFailed ? theme.colors.warning : theme.colors.success}
      statusDotColor={captureFailed ? theme.colors.warning : theme.colors.success}
      statusText={captureFailed ? "Something went wrong with the camera" : capturing ? "Taking your photo…" : "Face detected — hold still"}
      helperText={captureFailed ? "Make sure your face is well lit, then try again." : `Step ${stepIndex + 1} of ${CHALLENGE_STEPS.length} · ${step.instruction}`}
      centerContent={
        captureFailed ? (
          <Button
            label="Try again"
            onPress={() => {
              setCaptureFailed(false);
              setStepIndex(0);
            }}
          />
        ) : undefined
      }
    />
  );
}
