import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { useTheme } from "@/theme";

/**
 * Figma "FaceVerification" (node 226:1878) — STILL BLOCKED, though the
 * shape of the gap changed (PLAN.md "Real blockers"): the endpoint's
 * request/response are now fully typed (`api.submitFaceVerification` /
 * `api.confirmFaceVerification`, both returning `OnboardingVerificationResult`),
 * and it takes `liveness_reference` rather than a raw `photo_url`. But no
 * VerifyMe SDK (or any other liveness-capture SDK) is integrated in this
 * app, so there is still no honest way for the client to produce a real
 * `liveness_reference` value itself. This renders the intended screen
 * shell and, in development builds only, a clearly-marked bypass so the
 * rest of the onboarding chain remains testable.
 */
export default function OnboardingFaceScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    placeholder: {
      height: 240,
      borderRadius: theme.radii.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.semanticSpacing.section,
    },
    placeholderText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
      textAlign: "center",
      paddingHorizontal: theme.semanticSpacing.component,
    },
    devNote: {
      ...theme.typography.caption,
      color: theme.colors.warning,
    },
  });

  return (
    <FormScreenLayout
      title="Verify your face"
      subtitle="This step isn't available yet in this build."
      footer={
        __DEV__ ? (
          <>
            <Button label="[DEV ONLY] Skip face verification" variant="destructive" onPress={() => router.replace("/(onboarding)/identity-verified")} />
            <Text style={styles.devNote}>Bypasses a confirmed backend contract gap — see the comment in this file. Never available in a production build.</Text>
          </>
        ) : undefined
      }
    >
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Face verification requires a photo-upload workflow that isn't exposed by the backend yet.</Text>
      </View>
    </FormScreenLayout>
  );
}
