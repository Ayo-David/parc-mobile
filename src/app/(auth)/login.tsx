import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BackButton } from "@/components/BackButton/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { toLoginIdentifier } from "@/features/auth/identifier";
import { useTheme } from "@/theme";

/**
 * Figma "PhoneEmailLogin" (node 226:1514). Collects the identifier only;
 * the actual POST /v1/auth/passcode/login call happens once the passcode
 * screen has both fields (auth-customer's PasscodeLoginRequest takes
 * identifier + passcode + device_id together — see PLAN.md/useAuth.ts).
 * The "Next" button reuses the auth-flow's own AuthBtn treatment (always
 * white text, gray-inactive vs. black-active) rather than the standard
 * Button component's disabled recipe — confirmed distinct on this screen.
 * The identifier is canonicalized (E.164 phone / lowercased email) before
 * it's passed on, since auth-customer matches it exactly — see
 * features/auth/identifier.ts.
 */
export default function LoginIdentifierScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [showInvalid, setShowInvalid] = useState(false);

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
    },
    body: {
      flex: 1,
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm + 2,
    },
    keyboardAvoider: {
      flex: 1,
    },
    fieldGroup: {
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
    },
    fieldLabel: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    fieldHelper: {
      ...theme.typography.caption,
      color: showInvalid ? theme.colors.error : theme.colors.textDisabled,
      marginTop: theme.spacing.sm,
    },
    footer: {
      gap: theme.semanticSpacing.authActions,
      paddingBottom: theme.semanticSpacing.section + theme.spacing.xs,
    },
    nextButton: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        identifier.trim().length >= 3
          ? theme.colors.primary
          : theme.colors.border,
    },
    nextButtonLabel: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
    recoverRow: {
      alignItems: "center",
    },
    recoverText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    recoverLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
  });

  const canContinue = identifier.trim().length >= 3;

  function handleNext() {
    const canonical = toLoginIdentifier(identifier);
    if (!canonical) {
      setShowInvalid(true);
      return;
    }
    router.push({
      pathname: "/(auth)/passcode",
      params: { identifier: canonical.value },
    });
  }

  return (
    <ScreenContainer variant="auth">
      <View style={styles.header}>
        <BackButton />
      </View>
      {/* The field auto-focuses, so the footer must ride above the keyboard or Next is unreachable. */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>Sign in to{"\n"}your account.</Text>
          <Text style={styles.subtitle}>
            Enter your phone number or email address
          </Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number or Email</Text>
            <TextField
              value={identifier}
              state={showInvalid ? "error" : "default"}
              onChangeText={(text) => {
                setIdentifier(text);
                setShowInvalid(false);
              }}
              placeholder="080X XXX XXXX or you@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoFocus
              onSubmitEditing={handleNext}
              returnKeyType="next"
            />
            <Text style={styles.fieldHelper} accessibilityLiveRegion="polite">
              {showInvalid
                ? "Enter a valid Nigerian phone number (e.g. 0802 000 0001) or email address"
                : "Use the phone number or email you registered with"}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable
            style={styles.nextButton}
            disabled={!canContinue}
            onPress={handleNext}
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonLabel}>Next →</Text>
          </Pressable>
          <View style={styles.recoverRow}>
            <Text style={styles.recoverText}>
              Forgot passcode?{" "}
              <Text
                style={styles.recoverLink}
                onPress={() => router.push("/(auth)/forgot-passcode")}
              >
                Recover access
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
