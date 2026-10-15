import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PinPad } from "@/components/PinPad/PinPad";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

import { OnboardingHeader } from "./OnboardingStepLayout";

export interface OnboardingPasscodeLayoutProps {
  rightLabel: string;
  title: string;
  subtitle: string;
  length: number;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  errorMessage?: string | null;
  statusMessage?: string | null;
}

/**
 * CreatePasscode (226:2144) / ConfirmPasscode (226:2234): header with a
 * right-hand label instead of step dots, heading, PIN dots, a centred
 * "Never share" chip, and the keypad pinned to the bottom 18px from the
 * screen edge — same structure as the login Passcode screen (226:1555).
 */
export function OnboardingPasscodeLayout({ rightLabel, title, subtitle, length, value, onChange, disabled, errorMessage, statusMessage }: OnboardingPasscodeLayoutProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    body: {
      flex: 1,
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
      paddingBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm + 2,
      marginBottom: theme.spacing.xxl + theme.spacing.xs,
    },
    keypadArea: {
      flex: 1,
      marginHorizontal: theme.semanticSpacing.keypadX - theme.spacing.xxl,
    },
    accessory: {
      alignItems: "center",
      gap: theme.spacing.md,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    status: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
    hintChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.sm + 1,
    },
    hintText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
  });

  return (
    <ScreenContainer variant="auth">
      <OnboardingHeader rightLabel={rightLabel} />
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.keypadArea}>
          <PinPad
            fill
            length={length}
            value={value}
            onChange={onChange}
            disabled={disabled}
            accessory={
              <View style={styles.accessory}>
                {errorMessage ? (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {errorMessage}
                  </Text>
                ) : null}
                {statusMessage ? (
                  <Text style={styles.status} accessibilityLiveRegion="polite">
                    {statusMessage}
                  </Text>
                ) : (
                  <View style={styles.hintChip}>
                    <Ionicons name="shield-outline" size={theme.icon.inline} color={theme.colors.textMuted} />
                    <Text style={styles.hintText}>Never share your passcode with anyone</Text>
                  </View>
                )}
              </View>
            }
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
