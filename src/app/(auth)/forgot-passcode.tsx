import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const CHANNELS: Array<{ label: string; value: "SMS" | "EMAIL" }> = [
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "EMAIL" },
];

/**
 * Figma "Forgot Passcode" recovery-loop entry point. RESOLVED (PLAN.md
 * "Real blockers"): `POST /v1/auth/passcode/recovery/request` now exists.
 */
export default function ForgotPasscodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identifier: initialIdentifier } = useLocalSearchParams<{ identifier?: string }>();
  const bootstrap = useBootstrap();
  const [identifier, setIdentifier] = useState(initialIdentifier ?? "");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = identifier.trim().length >= 3 && !!bootstrap.data;

  async function handleSubmit() {
    if (!canContinue || !bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const challenge = await api.requestPasscodeRecovery({ tenantId: bootstrap.data.tenant_id, identifier: identifier.trim(), channel, idempotencyKey: createIdempotencyKey() });
      router.push({ pathname: "/(auth)/reset-passcode", params: { identifier: identifier.trim(), challengeId: challenge.challenge_id } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    channelRow: { flexDirection: "row", gap: theme.spacing.sm },
    chip: { flex: 1, borderRadius: theme.radii.full, borderWidth: 1, paddingVertical: theme.semanticSpacing.form, alignItems: "center" },
    chipLabel: { ...theme.typography.label },
  });

  return (
    <FormScreenLayout
      title="Forgot your passcode?"
      subtitle="We'll send a recovery code to reset it."
      errorMessage={error}
      footer={<Button label="Send code" onPress={handleSubmit} disabled={!canContinue} loading={isSubmitting} />}
    >
      <TextField value={identifier} onChangeText={setIdentifier} placeholder="Phone number or email" autoCapitalize="none" autoCorrect={false} autoFocus />
      <View style={styles.channelRow}>
        {CHANNELS.map((option) => {
          const isActive = option.value === channel;
          return (
            <Pressable
              key={option.value}
              onPress={() => setChannel(option.value)}
              style={[styles.chip, { borderColor: isActive ? theme.colors.primary : theme.colors.border, backgroundColor: isActive ? theme.colors.primarySubtle : theme.colors.surface }]}
            >
              <Text style={[styles.chipLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </FormScreenLayout>
  );
}
