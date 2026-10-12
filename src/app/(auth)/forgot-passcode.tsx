import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { BackButton } from "@/components/BackButton/BackButton";
import { TextField } from "@/components/TextField/TextField";
import { toLoginIdentifier } from "@/features/auth/identifier";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const CHANNELS: { label: string; value: "SMS" | "EMAIL"; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { label: "SMS verification", value: "SMS", icon: "phone-portrait-outline", description: "We'll text a code to this number" },
  { label: "Email verification", value: "EMAIL", icon: "mail-outline", description: "We'll email a code to this address" },
];

/**
 * Figma "ForgotPasscode" (node 226:2532). RESOLVED (PLAN.md "Real
 * blockers"): `POST /v1/auth/passcode/recovery/request` now exists. Figma
 * shows the two contact channels pre-filled with masked destinations
 * (e.g. "+234 801 ••• 5678") and a third "Biometric reset" option — this
 * screen can't show real masked contact info because the recovery-request
 * API takes a raw identifier and returns a channel-agnostic challenge, not
 * a lookup of the account's masked phone/email; the identifier field
 * below is kept instead of fabricating masked values. Biometric reset
 * isn't implemented (no biometric anywhere in useAuth.ts) — shown to
 * match Figma's 3-option layout but disabled with a "coming soon" tap,
 * not a real functional option (the recovery API's channel type is
 * SMS | EMAIL only).
 *
 * The channel is derived from the identifier, not chosen: auth-customer
 * only sends a code when the channel matches the identifier type (SMS for
 * a phone, EMAIL for an email — otp-service.ts), and on a mismatch it
 * silently returns a challenge without sending anything (anti-enumeration),
 * which would leave the customer waiting for a code that never arrives.
 */
export default function ForgotPasscodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identifier: initialIdentifier } = useLocalSearchParams<{ identifier?: string }>();
  const bootstrap = useBootstrap();
  const [identifier, setIdentifier] = useState(initialIdentifier ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canonical = toLoginIdentifier(identifier);
  const channel: "SMS" | "EMAIL" = canonical?.kind === "email" ? "EMAIL" : "SMS";
  const canContinue = canonical !== null && !!bootstrap.data;

  async function handleSubmit() {
    if (!canContinue || !canonical || !bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const challenge = await api.requestPasscodeRecovery({ tenantId: bootstrap.data.tenant_id, identifier: canonical.value, channel, idempotencyKey: createIdempotencyKey() });
      router.push({ pathname: "/(auth)/reset-passcode", params: { identifier: canonical.value, challengeId: challenge.challenge_id } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
    },
    body: {
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
    },
    iconBadge: {
      width: 52,
      height: 52,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondarySubtle,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      marginTop: theme.spacing.lg + 2,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm + 2,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
    },
    fieldGroup: {
      marginTop: theme.semanticSpacing.form + theme.spacing.xs,
    },
    optionsList: {
      gap: theme.spacing.sm + 2,
      marginTop: theme.semanticSpacing.form + theme.spacing.xs,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      paddingHorizontal: 17,
      paddingVertical: 15,
    },
    optionRowDisabled: {
      opacity: 0.5,
    },
    optionIcon: {
      width: 22,
      alignItems: "center",
    },
    optionTextBlock: {
      flex: 1,
    },
    optionTitle: {
      ...theme.typography.text14BoldCompact,
      color: theme.colors.textPrimary,
    },
    optionDescription: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: theme.radii.chip,
      borderWidth: 2,
      borderColor: theme.components.pinPad.dotBorderColor,
    },
    radioSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    footer: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.semanticSpacing.section + theme.spacing.xs,
    },
    continueButton: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: canContinue ? theme.colors.primary : theme.colors.border,
    },
    continueLabel: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.body}>
        <View style={styles.iconBadge}>
          <Ionicons name="lock-closed" size={22} color={theme.colors.secondary} />
        </View>
        <Text style={styles.title}>Recover your{"\n"}account.</Text>
        <Text style={styles.subtitle}>Choose how you&apos;d like to verify your identity</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.fieldGroup}>
          <TextField value={identifier} onChangeText={setIdentifier} placeholder="Phone number or email" autoCapitalize="none" autoCorrect={false} autoFocus />
        </View>

        <View style={styles.optionsList}>
          {CHANNELS.map((option) => {
            const isSelected = canonical !== null && option.value === channel;
            return (
              <View key={option.value} style={styles.optionRow} accessibilityRole="radio" accessibilityState={{ selected: isSelected, disabled: !isSelected }}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={21} color={theme.colors.textPrimary} />
                </View>
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
              </View>
            );
          })}
          <Pressable
            style={[styles.optionRow, styles.optionRowDisabled]}
            onPress={() => Alert.alert("Coming soon", "Biometric reset is coming soon.")}
            accessibilityRole="button"
          >
            <View style={styles.optionIcon}>
              <Ionicons name="finger-print" size={21} color={theme.colors.textPrimary} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Biometric reset</Text>
              <Text style={styles.optionDescription}>Face ID or fingerprint</Text>
            </View>
            <View style={styles.radio} />
          </Pressable>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.continueButton} disabled={!canContinue || isSubmitting} onPress={handleSubmit} accessibilityRole="button">
          <Text style={styles.continueLabel}>{isSubmitting ? "Sending…" : "Continue"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
