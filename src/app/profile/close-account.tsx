import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Figma "Account 02 — Close Account" (node 437:111, missing-mobile.md
 * §8/§9). `Customer.status` includes `CLOSED` (a real, confirmed terminal
 * state), and NDPR-style "right to erasure" requests are a realistic
 * requirement for a Nigerian-regulated MFB app, but there is no
 * customer-self-service close-account endpoint anywhere in the confirmed
 * contract — grepped the auth-customer contract directly and confirmed
 * none exists. "Continue to close account" files a real request through
 * the Support-ticket flow (MOB-18, `POST /v1/support/tickets`) instead of
 * a fabricated dedicated endpoint — an honest, working path that also
 * matches how a regulated MFB would handle this today (a human reviews
 * account-closure requests, not an automated self-service flow).
 */
export default function CloseAccountScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createSupportTicket({
        subject: "Request to close my account",
        description: "I would like to close my Parc account. My wallet balance is zero and I have no active loans or savings plans.",
      });
      router.replace("/profile/support/tickets");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section },
    warningCard: { backgroundColor: theme.components.status.error.backgroundColor, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.xs },
    warningTitle: { ...theme.typography.text13Bold, color: theme.colors.error },
    warningBody: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.semanticSpacing.form },
    footer: { marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Close your Parc account?" }} />
      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>This can&apos;t be undone</Text>
          <Text style={styles.warningBody}>
            Your wallet must have a zero balance and no active loans or savings plans. We&apos;ll keep transaction records for 7 years as required by regulation, then permanently delete your
            personal data.
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.footer}>
          <Button label="Continue to close account" variant="destructive" onPress={handleContinue} loading={isSubmitting} />
        </View>
      </View>
    </ScreenContainer>
  );
}
