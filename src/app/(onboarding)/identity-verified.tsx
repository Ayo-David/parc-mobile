import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { AuthButton } from "@/components/AuthButton/AuthButton";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { OnboardingSuccessLayout, type SuccessCardRow } from "@/features/onboarding/OnboardingSuccessLayout";
import { useTheme } from "@/theme";

const NEXT_STEPS: SuccessCardRow[] = [
  { icon: "home-outline", label: "Address Verification" },
  { icon: "shield-checkmark-outline", label: "Compliance Check" },
  { icon: "briefcase-outline", label: "Source of Income" },
  { icon: "keypad-outline", label: "Set Login Passcode" },
];

/**
 * Figma "FaceVerified" / "Identity Verified" (node 226:2741) — a purely
 * client-side transitional confirmation after IDENTITY + FACE_VERIFICATION;
 * there is no corresponding server OnboardingStep for it, so "Continue"
 * refetches status to find the real next step (ADDRESS). The name comes
 * from the face-verification response's registered `identity` (BVN
 * record), passed in by face/verifying.tsx; it's omitted if absent. The
 * "Next up" list mirrors the real remaining steps in navigation.ts order.
 */
export default function IdentityVerifiedScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();
  const { firstName, lastName } = useLocalSearchParams<{ firstName?: string; lastName?: string }>();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const styles = StyleSheet.create({
    name: {
      ...theme.typography.text15Bold,
      color: theme.colors.textPrimary,
    },
  });

  return (
    <OnboardingSuccessLayout
      tone="success"
      icon="checkmark-circle-outline"
      title="Identity Verified!"
      subtitle={
        fullName ? (
          <>
            Welcome, <Text style={styles.name}>{fullName}</Text>
          </>
        ) : (
          "Welcome to Parc"
        )
      }
      note="Your face matches your BVN record. Let's set up your account."
      cardTitle="Next up"
      rows={NEXT_STEPS}
      showRowChevrons
      footer={<AuthButton label="Continue →" onPress={() => void advanceOnboarding()} />}
    />
  );
}
