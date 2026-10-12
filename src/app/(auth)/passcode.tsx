import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useBootstrap } from "@/api/queries/useBootstrap";
import { BackButton } from "@/components/BackButton/BackButton";
import { PinPad } from "@/components/PinPad/PinPad";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAuth } from "@/auth/useAuth";
import { loginErrorMessage } from "@/features/auth/loginErrorMessage";
import { useTheme } from "@/theme";

const PASSCODE_LENGTH = 6;

/**
 * Figma "Passcode" login variant (node 226:1555). On completing all 6
 * digits, fires POST /v1/auth/passcode/login. A successful login updates
 * useSessionStore, which the root layout's Stack.Protected guard reacts to
 * automatically — no manual navigation to (tabs) happens here. Biometric
 * login isn't implemented (no biometric auth anywhere in useAuth.ts) — the
 * link is shown matching Figma but surfaces "coming soon" honestly rather
 * than faking it, same pattern as SignIn's biometric card.
 */
export default function EnterPasscodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const bootstrap = useBootstrap();
  const { login, isLoggingIn, loginError } = useAuth();
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (passcode.length !== PASSCODE_LENGTH || !bootstrap.data || isLoggingIn) {
      return;
    }
    login({ tenantId: bootstrap.data.tenant_id, identifier, passcode }).catch(() => {
      setPasscode("");
    });
    // login/bootstrap.data intentionally omitted: this effect should only
    // re-fire when the entered passcode itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passcode]);

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
    },
    body: {
      flex: 1,
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
    },
    keypadArea: {
      flex: 1,
      // Figma NumPad sits 18px from the screen edge (226:1596), inside the 24px auth gutter.
      marginHorizontal: theme.semanticSpacing.keypadX - theme.spacing.xxl,
    },
    accessory: {
      alignItems: "center",
      gap: theme.spacing.md,
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
    biometricRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs + 2,
      paddingVertical: theme.semanticSpacing.form,
    },
    biometricLabel: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
    forgotLabel: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  function handleBiometricPress() {
    Alert.alert("Coming soon", "Biometric login is coming soon.");
  }

  return (
    <ScreenContainer variant="auth">
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Enter your{"\n"}passcode.</Text>
        <Text style={styles.subtitle}>Your 6-digit login passcode</Text>
        <View style={styles.keypadArea}>
          <PinPad
            fill
            length={PASSCODE_LENGTH}
            value={passcode}
            onChange={setPasscode}
            disabled={isLoggingIn || bootstrap.isLoading}
            accessory={
              <View style={styles.accessory}>
                {loginError && !isLoggingIn ? (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {loginErrorMessage(loginError)}
                  </Text>
                ) : null}
                {isLoggingIn ? (
                  <Text style={styles.status} accessibilityLiveRegion="polite">
                    Signing you in…
                  </Text>
                ) : (
                  <View style={styles.hintChip}>
                    <Ionicons name="shield-checkmark-outline" size={theme.icon.inline} color={theme.colors.textMuted} />
                    <Text style={styles.hintText}>Never share your passcode with anyone</Text>
                  </View>
                )}
              </View>
            }
          />
        </View>
        <Pressable style={styles.biometricRow} onPress={handleBiometricPress} disabled={isLoggingIn}>
          <Ionicons name="finger-print" size={theme.icon.inline} color={theme.colors.secondary} />
          <Text style={styles.biometricLabel}>Login with Biometric instead</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: "/(auth)/forgot-passcode", params: { identifier } })} disabled={isLoggingIn}>
          <Text style={styles.forgotLabel}>Forgot passcode?</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
