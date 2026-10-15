import { CameraView } from "expo-camera";
import type { ReactNode, Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/BackButton/BackButton";
import { useTheme } from "@/theme";

const OVAL_SIZE = { width: 232, height: 296 };
const CHALLENGE_STEP_COUNT = 3;

export interface LivenessCameraFrameProps {
  heading: string;
  /** Omit to hide the top step-progress bar (the plain Camera Capture screen has none). */
  activeStep?: number;
  completedThroughStep?: number;
  ovalBorderColor: string;
  statusDotColor: string;
  statusText: string;
  helperText: string;
  centerContent?: ReactNode;
  onBack?: () => void;
  /** Lets the screen take the selfie from this preview. */
  cameraRef?: Ref<CameraView>;
  pictureSize?: string;
  onCameraReady?: () => void;
}

/**
 * The dark full-bleed camera chrome shared by Liveness 02–04 (Camera
 * Capture, Challenge, Verifying — Figma nodes 426:55/426:71/426:112,
 * missing-mobile.md §2.1). It renders a real front-camera preview; the
 * challenge screen takes the selfie from it through `cameraRef`. There is no
 * on-device face detection: the "face detected" / challenge-progress states
 * are paced by the calling screen's timers, and the actual liveness and BVN
 * face match are run server-side by the KYC provider on the captured selfie.
 */
export function LivenessCameraFrame({
  heading,
  activeStep,
  completedThroughStep = 0,
  ovalBorderColor,
  statusDotColor,
  statusText,
  helperText,
  centerContent,
  onBack,
  cameraRef,
  pictureSize,
  onCameraReady,
}: LivenessCameraFrameProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.mediaBackground },
    camera: { ...StyleSheet.absoluteFill },
    overlay: { ...StyleSheet.absoluteFill },
    header: {
      paddingHorizontal: theme.semanticSpacing.screenX,
    },
    progressRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    progressSegment: {
      width: theme.spacing.xxl,
      height: theme.spacing.xs,
      borderRadius: theme.radii.xs,
    },
    heading: {
      ...theme.typography.label,
      fontFamily: theme.typography.h4.fontFamily,
      color: theme.colors.textInverse,
      textAlign: "center",
      marginTop: theme.semanticSpacing.component,
      paddingHorizontal: theme.semanticSpacing.section,
    },
    ovalWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    oval: {
      width: OVAL_SIZE.width,
      height: OVAL_SIZE.height,
      borderRadius: OVAL_SIZE.width,
      borderWidth: theme.borderWidth.thin * 2,
      borderColor: ovalBorderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    statusBlock: {
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.semanticSpacing.screenX,
      paddingBottom: theme.semanticSpacing.section,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    statusDot: {
      width: theme.spacing.sm,
      height: theme.spacing.sm,
      borderRadius: theme.radii.full,
      backgroundColor: statusDotColor,
    },
    statusText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textDisabled,
    },
    helperText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" pictureSize={pictureSize} onCameraReady={onCameraReady} />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.header}>
          <BackButton tone="onMedia" onPress={onBack} />
        </SafeAreaView>
        {activeStep ? (
          <View style={styles.progressRow}>
            {Array.from({ length: CHALLENGE_STEP_COUNT }, (_, index) => index + 1).map((step) => (
              <View
                key={step}
                style={[
                  styles.progressSegment,
                  { backgroundColor: step <= completedThroughStep ? theme.colors.success : step === activeStep ? theme.colors.secondary : theme.colors.textSecondary },
                ]}
              />
            ))}
          </View>
        ) : null}
        <Text style={styles.heading}>{heading}</Text>
        <View style={styles.ovalWrap}>
          <View style={styles.oval}>{centerContent}</View>
        </View>
        <View style={styles.statusBlock}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <Text style={styles.helperText}>{helperText}</Text>
        </View>
      </View>
    </View>
  );
}
